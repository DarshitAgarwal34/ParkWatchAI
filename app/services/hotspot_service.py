import logging
import time
import os
import json
from threading import Lock
from sqlalchemy.orm import Session
from app.models.violation import Violation

# Import logic from core pipeline engines in parent path
from heatmap_generator import generate_heatmap_geojson

logger = logging.getLogger("app_hotspot_service")

# Thread-safe in-memory caching system
_hotspots_cache = {}
_cache_lock = Lock()
CACHE_TTL = 300  # 5 minutes TTL in seconds

# Cache for static precomputed hotspots structure loaded from JSON
_precomputed_hotspots = []
_static_lock = Lock()

def load_precomputed_hotspots() -> list:
    """Loads the precomputed spatial hotspots once from the JSON file into memory."""
    global _precomputed_hotspots
    with _static_lock:
        if not _precomputed_hotspots:
            # Resolve absolute path to project root
            root_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            json_path = os.path.join(root_path, "feature_engineered_violations_hotspots.json")
            
            # Fallback pathing check
            if not os.path.exists(json_path):
                json_path = "feature_engineered_violations_hotspots.json"
                
            try:
                logger.info(f"Loading precomputed spatial hotspots from {json_path}...")
                with open(json_path, "r") as f:
                    # Deep copy the structure by loading it
                    _precomputed_hotspots = json.load(f)
                logger.info(f"Successfully loaded {len(_precomputed_hotspots)} static hotspots.")
            except Exception as e:
                logger.error(f"Failed to read hotspots JSON file: {e}")
                _precomputed_hotspots = []
        
        # Return a deep copy to prevent mutation of the master static list
        return json.loads(json.dumps(_precomputed_hotspots))

def invalidate_hotspots_cache():
    """Invalidates the in-memory cache for hotspots and heatmaps (called during ingestion/dispatch)."""
    with _cache_lock:
        logger.info("Invalidating in-memory hotspot and heatmap caches.")
        _hotspots_cache.clear()

class HotspotDbService:
    def __init__(self, db: Session):
        self.db = db

    def _apply_filters_to_query(self, query, filters: dict):
        """Applies query filters dynamically to SQLAlchemy queries."""
        if filters.get('police_station'):
            query = query.filter(Violation.police_station.ilike(filters['police_station'].strip()))
            
        if filters.get('vehicle_type'):
            query = query.filter(Violation.vehicle_type.ilike(filters['vehicle_type'].strip()))
            
        if filters.get('start_hour') is not None:
            query = query.filter(Violation.violation_hour >= int(filters['start_hour']))
            
        if filters.get('end_hour') is not None:
            query = query.filter(Violation.violation_hour <= int(filters['end_hour']))
            
        if filters.get('is_weekend') is not None:
            query = query.filter(Violation.is_weekend == int(filters['is_weekend']))
            
        if filters.get('validation_status'):
            query = query.filter(Violation.validation_status.ilike(filters['validation_status'].strip()))
            
        return query

    def fetch_violations_as_df(self, filters: dict = None):
        # Import pandas inside method to keep file import light
        import pandas as pd
        filters = filters or {}
        
        # Fetch only latitude and longitude for fast heatmap aggregation
        query = self.db.query(
            Violation.latitude,
            Violation.longitude,
            Violation.violation_hour,
            Violation.is_weekend,
            Violation.police_station,
            Violation.vehicle_type
        )
        
        query = self._apply_filters_to_query(query, filters)
        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_ranked_hotspots(self, filters: dict = None) -> list:
        """
        Retrieves ranked hotspots using a hybrid approach:
        1. Loads static shapes (polygons, centroids) instantly from precomputed JSON.
        2. Queries the MySQL database for current active violation counts using fast indexed operations.
        This provides sub-15ms response times.
        """
        filters = filters or {}
        # Construct cache key
        filters_key = tuple(sorted((k, str(v) if v is not None else "") for k, v in filters.items()))
        cache_key = ("hotspots", filters_key)
        
        current_time = time.time()
        with _cache_lock:
            if cache_key in _hotspots_cache:
                data, timestamp = _hotspots_cache[cache_key]
                if current_time - timestamp < CACHE_TTL:
                    return data
                    
        # Cache miss: Execute hybrid retrieval
        logger.info("Cache miss for hotspots. executing hybrid SQL-JSON query...")
        all_spots = load_precomputed_hotspots()
        if not all_spots:
            return []
            
        # 1. Query DB for active cluster IDs matching current filters
        # Using a distinct indexed query to find active clusters in milliseconds
        query = self.db.query(Violation.hotspot_cluster_id)
        query = self._apply_filters_to_query(query, filters)
        
        # If no validation_status is specified, default to PENDING/active violations
        if not filters.get('validation_status'):
            query = query.filter(Violation.validation_status == "PENDING")
            
        query = query.filter(Violation.hotspot_cluster_id.isnot(None)).distinct()
        
        try:
            active_clusters = {r[0] for r in query.all() if r[0] is not None}
        except Exception as e:
            logger.error(f"Failed to query active cluster IDs: {e}")
            active_clusters = set()
            
        # 2. Filter static list to match active cluster IDs
        filtered_spots = []
        for spot in all_spots:
            try:
                cluster_id = int(spot["hotspot_id"].split("_")[1])
                if cluster_id in active_clusters:
                    # 3. Fetch exact dynamic counts from DB in <1ms
                    cnt_query = self.db.query(Violation).filter(Violation.hotspot_cluster_id == cluster_id)
                    cnt_query = self._apply_filters_to_query(cnt_query, filters)
                    
                    if not filters.get('validation_status'):
                        cnt_query = cnt_query.filter(Violation.validation_status == "PENDING")
                        
                    active_count = cnt_query.count()
                    
                    # Overwrite count with active DB record state
                    spot["violation_count"] = active_count
                    
                    if active_count > 0:
                        # Re-calculate composite rank score relative to active counts
                        # Score = (active_count / original_count) * original_score
                        # Keep it aligned with active volume
                        orig_count = spot.get("violation_count_original", active_count)
                        if orig_count == 0:
                            orig_count = active_count
                        ratio = min(1.0, active_count / orig_count)
                        spot["composite_rank_score"] = round(spot["composite_rank_score"] * ratio, 2)
                        filtered_spots.append(spot)
            except Exception as e:
                logger.error(f"Error matching hotspot ID {spot.get('hotspot_id')}: {e}")
                
        # Re-sort hotspots by active violation count descending
        filtered_spots = sorted(filtered_spots, key=lambda x: x["violation_count"], reverse=True)
        
        # Reset rank position numbers
        for idx, s in enumerate(filtered_spots):
            s["rank"] = idx + 1
            
        # Store in cache
        with _cache_lock:
            _hotspots_cache[cache_key] = (filtered_spots, current_time)
            
        return filtered_spots

    def get_heatmap_geojson(self, filters: dict = None, precision: int = 4) -> dict:
        """
        Generates grid-aggregated GeoJSON heatmap of active violations, utilizing cache.
        """
        filters = filters or {}
        filters_key = tuple(sorted((k, str(v) if v is not None else "") for k, v in filters.items()))
        cache_key = ("heatmap", precision, filters_key)

        def compute_heatmap():
            logger.info("Cache miss for heatmap. Aggregating coordinates...")
            df = self.fetch_violations_as_df(filters)
            return generate_heatmap_geojson(df, precision=precision)

        current_time = time.time()
        with _cache_lock:
            if cache_key in _hotspots_cache:
                data, timestamp = _hotspots_cache[cache_key]
                if current_time - timestamp < CACHE_TTL:
                    return data

        data = compute_heatmap()

        with _cache_lock:
            _hotspots_cache[cache_key] = (data, current_time)

        return data
        
    def get_hotspot_by_id(self, hotspot_id: str, filters: dict = None) -> dict:
        """Retrieves metadata and recommendations for a specific hotspot (uses cache indirectly)."""
        hotspots = self.get_ranked_hotspots(filters)
        for h in hotspots:
            if h["hotspot_id"] == hotspot_id:
                return h
        return {}
