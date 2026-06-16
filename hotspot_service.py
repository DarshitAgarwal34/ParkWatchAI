import logging
import pandas as pd
import hashlib
import json
import config
from hotspot_detection import detect_hotspots
from heatmap_generator import generate_heatmap_geojson

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format=config.LOG_FORMAT)
logger = logging.getLogger("hotspot_service")

class HotspotService:
    def __init__(self, data_path: str = None):
        self.data_path = data_path or config.FEATURE_ENGINEERED_DATA_PATH
        self._df = None
        self._hotspot_cache = {}
        self._heatmap_cache = {}
        
    def load_data(self) -> pd.DataFrame:
        """Loads and caches the feature-engineered dataset for API querying."""
        if self._df is None:
            logger.info(f"Service loading data from {self.data_path}...")
            try:
                self._df = pd.read_csv(self.data_path)
                # Ensure date columns are correctly parsed as datetime objects
                for col in ['created_datetime', 'closed_datetime', 'action_taken_timestamp', 'validation_timestamp']:
                    if col in self._df.columns:
                        self._df[col] = pd.to_datetime(self._df[col], utc=True)
                logger.info(f"Service loaded dataset successfully. Shape: {self._df.shape}")
            except FileNotFoundError:
                logger.error(f"Failed to find feature-engineered dataset at {self.data_path}. Run pipeline first.")
                raise
        return self._df
        
    def _generate_cache_key(self, filters: dict) -> str:
        """Creates a unique MD5 hash for a set of filter query parameters."""
        # Normalize and sort filters for consistent hashing
        normalized = {k: str(v).strip().upper() for k, v in filters.items() if v is not None}
        sorted_str = json.dumps(normalized, sort_keys=True)
        return hashlib.md5(sorted_str.encode('utf-8')).hexdigest()
        
    def _apply_filters(self, df: pd.DataFrame, filters: dict) -> pd.DataFrame:
        """Applies spatial and temporal filters to the violation dataset."""
        filtered_df = df.copy()
        
        # 1. Filter by Police Station
        if filters.get('police_station'):
            station = str(filters['police_station']).strip().upper()
            filtered_df = filtered_df[filtered_df['police_station'].astype(str).str.upper() == station]
            
        # 2. Filter by Vehicle Type
        if filters.get('vehicle_type'):
            v_type = str(filters['vehicle_type']).strip().upper()
            filtered_df = filtered_df[filtered_df['vehicle_type'].astype(str).str.upper() == v_type]
            
        # 3. Filter by Time of Day (Hour range, e.g. 8 to 18)
        if filters.get('start_hour') is not None:
            filtered_df = filtered_df[filtered_df['violation_hour'] >= int(filters['start_hour'])]
        if filters.get('end_hour') is not None:
            filtered_df = filtered_df[filtered_df['violation_hour'] <= int(filters['end_hour'])]
            
        # 4. Filter by Day Type (Weekend vs Weekday)
        if filters.get('is_weekend') is not None:
            is_wknd = int(filters['is_weekend'])
            filtered_df = filtered_df[filtered_df['is_weekend'] == is_wknd]
            
        # 5. Filter by Validation Status
        if filters.get('validation_status'):
            status = str(filters['validation_status']).strip().upper()
            filtered_df = filtered_df[filtered_df['validation_status'].astype(str).str.upper() == status]
            
        logger.debug(f"Filtered dataset row count: {len(filtered_df)} (originally {len(df)})")
        return filtered_df

    def get_hotspots(self, filters: dict = None, force_refresh: bool = False) -> list:
        """
        Retrieves a ranked list of hotspots. Uses a query cache to avoid
        running DBSCAN repeatedly for identical search criteria.
        """
        filters = filters or {}
        cache_key = self._generate_cache_key(filters)
        
        if cache_key in self._hotspot_cache and not force_refresh:
            logger.info("Serving hotspots from service cache.")
            return self._hotspot_cache[cache_key]
            
        # Load and filter data
        df = self.load_data()
        filtered_df = self._apply_filters(df, filters)
        
        if len(filtered_df) < config.DBSCAN_MIN_SAMPLES:
            logger.warning("Insufficient violation records matching filters to run clustering.")
            return []
            
        # Compute hotspots
        hotspots = detect_hotspots(filtered_df)
        
        # Apply recommendation engine to append tailored enforcement actions
        from recommendation_engine import RecommendationEngine
        rec_engine = RecommendationEngine()
        hotspots = rec_engine.process_hotspot_list(hotspots)
        
        # Save to cache
        self._hotspot_cache[cache_key] = hotspots
        return hotspots

    def get_heatmap(self, filters: dict = None, precision: int = 4, force_refresh: bool = False) -> dict:
        """
        Retrieves GeoJSON heatmap data. Uses cache key to prevent redundant aggregation.
        """
        filters = filters or {}
        cache_key = f"{self._generate_cache_key(filters)}_prec_{precision}"
        
        if cache_key in self._heatmap_cache and not force_refresh:
            logger.info("Serving heatmap from service cache.")
            return self._heatmap_cache[cache_key]
            
        df = self.load_data()
        filtered_df = self._apply_filters(df, filters)
        
        heatmap_geojson = generate_heatmap_geojson(filtered_df, precision=precision)
        self._heatmap_cache[cache_key] = heatmap_geojson
        return heatmap_geojson

    def get_hotspot_by_id(self, hotspot_id: str, filters: dict = None) -> dict:
        """Retrieves a single hotspot details by its identifier."""
        hotspots = self.get_hotspots(filters)
        for h in hotspots:
            if h["hotspot_id"] == hotspot_id:
                return h
        return {}
        
    def clear_caches(self):
        """Evicts all query caches (e.g. if new data is ingested)."""
        self._hotspot_cache.clear()
        self._heatmap_cache.clear()
        logger.info("Service query cache cleared.")
