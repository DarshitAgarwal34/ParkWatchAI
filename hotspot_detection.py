import logging
import numpy as np
import pandas as pd
from scipy.spatial import ConvexHull
from sklearn.cluster import DBSCAN
import config

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format=config.LOG_FORMAT)
logger = logging.getLogger("hotspot_detection")

def calculate_centroid(points: np.ndarray) -> tuple:
    """Calculates the center point (latitude, longitude) of a cluster."""
    if len(points) == 0:
        return (0.0, 0.0)
    centroid = np.mean(points, axis=0)
    return (float(centroid[0]), float(centroid[1]))

def calculate_convex_hull(points: np.ndarray) -> list:
    """
    Computes the boundary polygon coordinates of a cluster using Convex Hull.
    Returns list of [lat, lon] coordinates forming a closed loop.
    """
    if len(points) < 3:
        # Not enough points for a hull, return points as-is
        return points.tolist()
    
    try:
        hull = ConvexHull(points)
        vertices = points[hull.vertices]
        # Close the polygon loop
        closed_polygon = np.vstack([vertices, vertices[0]])
        return closed_polygon.tolist()
    except Exception as e:
        logger.debug(f"ConvexHull generation failed (possibly collinear points): {e}")
        # Return bounding box or points
        return points.tolist()

def estimate_polygon_area_km2(points: np.ndarray) -> float:
    """
    Estimates the physical area of a cluster polygon in square kilometers
    using a flat-earth projection relative to the centroid.
    """
    if len(points) < 3:
        return 0.0
    
    try:
        lat_c, lon_c = calculate_centroid(points)
        
        # Approximate scale factors for latitude and longitude to meters
        lat_to_meters = 111320.0
        lon_to_meters = 111320.0 * np.cos(np.radians(lat_c))
        
        # Projects to local 2D space (y=lat, x=lon)
        y = (points[:, 0] - lat_c) * lat_to_meters
        x = (points[:, 1] - lon_c) * lon_to_meters
        
        # Shoelace formula for area
        area_m2 = 0.5 * np.abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))
        return float(area_m2 / 1e6) # return in km2
    except Exception as e:
        logger.error(f"Error estimating area: {e}")
        return 0.0

def calculate_density_score(count: int, area_km2: float) -> float:
    """
    Calculates a normalized density score.
    If area is extremely small or zero, falls back to count-based density.
    """
    if area_km2 < 0.0001:
        # Small cluster/collinear fallback: set a nominal area of 100 sq meters (0.0001 km2)
        area_km2 = 0.0001
    return float(count / area_km2)

def get_closest_location_name(centroid: tuple, df: pd.DataFrame) -> str:
    """Finds the most frequent location or junction name closest to the centroid."""
    # Find the row closest to the centroid
    lat_c, lon_c = centroid
    distances = np.sqrt((df['latitude'] - lat_c)**2 + (df['longitude'] - lon_c)**2)
    closest_idx = distances.idxmin()
    
    location = df.loc[closest_idx, 'location']
    junction = df.loc[closest_idx, 'junction_name']
    
    if pd.notnull(junction) and junction != 'UNKNOWN_JUNCTION':
        return str(junction)
    return str(location)

def detect_hotspots(df: pd.DataFrame) -> list:
    """
    Applies DBSCAN clustering on geographical coordinates, generates
    polygons, calculates metadata, and ranks the hotspots.
    """
    logger.info("Initializing hotspot detection pipeline...")
    
    # 1. Coordinate Conversion & Cluster Extraction
    coords = df[['latitude', 'longitude']].values
    coords_radians = np.radians(coords)
    
    # DBSCAN parameters (150m radius)
    kms_per_radian = 6371.0088
    epsilon_radians = 0.15 / kms_per_radian
    
    logger.info(f"Running DBSCAN clustering (eps={0.15}km, min_samples={config.DBSCAN_MIN_SAMPLES})...")
    db = DBSCAN(eps=epsilon_radians, min_samples=config.DBSCAN_MIN_SAMPLES, metric='haversine', algorithm='ball_tree')
    labels = db.fit_predict(coords_radians)
    
    unique_labels = set(labels)
    # Exclude noise label -1
    cluster_labels = [l for l in unique_labels if l != -1]
    
    hotspots = []
    
    for cluster_id in cluster_labels:
        cluster_mask = (labels == cluster_id)
        cluster_df = df[cluster_mask]
        cluster_points = coords[cluster_mask]
        
        # Calculate spatial metrics
        centroid = calculate_centroid(cluster_points)
        polygon = calculate_convex_hull(cluster_points)
        area_km2 = estimate_polygon_area_km2(cluster_points)
        violation_count = len(cluster_df)
        density_score = calculate_density_score(violation_count, area_km2)
        
        # Fetch human-readable location
        location_name = get_closest_location_name(centroid, cluster_df)
        
        # Calculate Risk Inputs
        # - Peak hour ratio
        peak_ratio = float(cluster_df['is_peak_hour'].mean()) if 'is_peak_hour' in cluster_df.columns else 0.0
        # - Repeat vehicle ratio
        repeat_veh_ratio = float(cluster_df['is_repeat_vehicle'].mean()) if 'is_repeat_vehicle' in cluster_df.columns else 0.0
        # - Average action latency (in minutes)
        avg_action_delay = float(cluster_df['action_delay'].mean()) if 'action_delay' in cluster_df.columns else np.nan
        # - Dominant violation type
        dominant_violation = str(cluster_df['violation_type'].mode().iloc[0]) if not cluster_df['violation_type'].empty else 'UNKNOWN'
        
        hotspot_metadata = {
            "hotspot_id": f"HP_{cluster_id:03d}",
            "location": location_name,
            "centroid": {"latitude": centroid[0], "longitude": centroid[1]},
            "violation_count": violation_count,
            "density_score": density_score,
            "cluster_size_km2": area_km2,
            "polygon_vertices": polygon,
            "risk_inputs": {
                "peak_hour_ratio": peak_ratio,
                "repeat_vehicle_ratio": repeat_veh_ratio,
                "average_action_delay_mins": avg_action_delay if pd.notnull(avg_action_delay) else None,
                "dominant_violation_type": dominant_violation
            }
        }
        hotspots.append(hotspot_metadata)
        
    # Rank Hotspots based on a composite score
    # Score = log10(violation_count) * 0.4 + log10(density_score) * 0.3 + peak_hour_ratio * 0.3
    # First, let's normalize factors to [0, 1] range to avoid bias
    if hotspots:
        counts = [h["violation_count"] for h in hotspots]
        densities = [h["density_score"] for h in hotspots]
        
        max_count = max(counts) if counts else 1
        max_density = max(densities) if densities else 1
        
        for h in hotspots:
            norm_count = h["violation_count"] / max_count
            norm_density = h["density_score"] / max_density
            peak_ratio = h["risk_inputs"]["peak_hour_ratio"]
            
            # Weighted dynamic ranking score (0.0 to 100.0)
            rank_score = (norm_count * 0.4 + norm_density * 0.4 + peak_ratio * 0.2) * 100.0
            h["composite_rank_score"] = round(rank_score, 2)
            
        # Sort hotspots descending by composite rank score
        hotspots = sorted(hotspots, key=lambda x: x["composite_rank_score"], reverse=True)
        
        # Add rank position
        for idx, h in enumerate(hotspots):
            h["rank"] = idx + 1
            
    logger.info(f"Processed and ranked {len(hotspots)} hotspots successfully.")
    return hotspots

if __name__ == "__main__":
    # Test execution
    import json
    try:
        df_feat = pd.read_csv(config.FEATURE_ENGINEERED_DATA_PATH)
        df_feat['created_datetime'] = pd.to_datetime(df_feat['created_datetime'], utc=True)
        hotspots = detect_hotspots(df_feat)
        
        # Show top 5 ranked hotspots
        print(json.dumps(hotspots[:5], indent=2))
    except Exception as e:
        logger.error(f"Test run failed (possibly missing feature engineered dataset): {e}")
