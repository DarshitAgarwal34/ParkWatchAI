import logging
import pandas as pd
import numpy as np
import config

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format=config.LOG_FORMAT)
logger = logging.getLogger("heatmap_generator")

def generate_heatmap_geojson(df: pd.DataFrame, precision: int = 4) -> dict:
    """
    Aggregates coordinates by rounding to a specified decimal precision (grid binning),
    and constructs a standard GeoJSON FeatureCollection formatted for GIS maps.
    
    Coordinate Precision reference:
    - 4 decimal places: ~11.1 meters (ideal for zoomed-in block-level heatmaps)
    - 3 decimal places: ~111 meters (ideal for city-wide views)
    """
    logger.info(f"Creating spatial grid aggregation with precision={precision}...")
    
    # Check if necessary columns exist
    if 'latitude' not in df.columns or 'longitude' not in df.columns:
        raise ValueError("DataFrame must contain 'latitude' and 'longitude' columns.")
        
    # Drop rows with null coordinates
    df_clean = df.dropna(subset=['latitude', 'longitude']).copy()
    
    if len(df_clean) == 0:
        logger.warning("Empty coordinate dataset passed. Returning empty FeatureCollection.")
        return {"type": "FeatureCollection", "features": []}
        
    # Group by rounded latitude and longitude to bin points
    df_clean['lat_bin'] = df_clean['latitude'].round(precision)
    df_clean['lon_bin'] = df_clean['longitude'].round(precision)
    
    # Aggregate counts
    aggregated = df_clean.groupby(['lat_bin', 'lon_bin']).size().reset_index(name='weight')
    
    # Normalize weights between 0.0 and 1.0 for styling libraries
    max_weight = aggregated['weight'].max() if not aggregated.empty else 1
    aggregated['normalized_weight'] = aggregated['weight'] / max_weight
    
    features = []
    for _, row in aggregated.iterrows():
        # Note: GeoJSON coordinates standard is [longitude, latitude]
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(row['lon_bin']), float(row['lat_bin'])]
            },
            "properties": {
                "weight": int(row['weight']),
                "normalized_weight": float(row['normalized_weight'])
            }
        }
        features.append(feature)
        
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "total_points": len(df_clean),
            "grid_cells": len(features),
            "max_weight": int(max_weight)
        },
        "features": features
    }
    
    logger.info(f"Successfully generated heatmap with {len(features)} aggregated nodes.")
    return geojson

def get_raw_heatmap_points(df: pd.DataFrame) -> list:
    """Returns a simplified list of dictionary coordinates with weights for direct API consumption."""
    df_clean = df.dropna(subset=['latitude', 'longitude'])
    points = []
    for _, row in df_clean.iterrows():
        points.append({
            "lat": float(row['latitude']),
            "lng": float(row['longitude']),
            "weight": 1.0  # Simple raw unit weights
        })
    return points
