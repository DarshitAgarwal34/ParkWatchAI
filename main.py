import logging
import time
import json
import pandas as pd
import config
from preprocess import run_preprocessing
from feature_engineering import run_feature_engineering
from risk_engine import RiskScoringEngine
from hotspot_service import HotspotService

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format=config.LOG_FORMAT)
logger = logging.getLogger("main_pipeline")

def main():
    start_time = time.time()
    logger.info("Starting ParkWatch AI Data Pipeline, Risk Engine & Hotspots...")
    
    # Step 1: Preprocessing
    logger.info("----------------------------------------")
    logger.info("STEP 1: Starting Data Preprocessing...")
    logger.info("----------------------------------------")
    run_preprocessing(config.INPUT_DATA_PATH, config.PREPROCESSED_DATA_PATH)
    
    # Step 2: Feature Engineering
    logger.info("----------------------------------------")
    logger.info("STEP 2: Starting Feature Engineering...")
    logger.info("----------------------------------------")
    df_engineered = run_feature_engineering(config.PREPROCESSED_DATA_PATH, config.FEATURE_ENGINEERED_DATA_PATH)
    
    # Step 2.5: Risk Score Calculation
    logger.info("----------------------------------------")
    logger.info("STEP 2.5: Starting Risk Scoring Engine...")
    logger.info("----------------------------------------")
    risk_engine = RiskScoringEngine()
    df_scored = risk_engine.process_dataframe(df_engineered)
    
    # Overwrite the feature-engineered dataset with risk scores included
    df_scored.to_csv(config.FEATURE_ENGINEERED_DATA_PATH, index=False)
    logger.info(f"Saved risk-scored dataset to: {config.FEATURE_ENGINEERED_DATA_PATH}")
    
    # Step 3: Hotspot Detection and Service Caching
    logger.info("----------------------------------------")
    logger.info("STEP 3: Running Hotspot Detection & Heatmap Generation...")
    logger.info("----------------------------------------")
    
    service = HotspotService()
    
    # Detect and Rank Hotspots
    logger.info("Running spatial cluster-ranking engine...")
    hotspots = service.get_hotspots()
    
    # Save hotspots metadata
    hotspots_out_path = config.FEATURE_ENGINEERED_DATA_PATH.replace(".csv", "_hotspots.json")
    with open(hotspots_out_path, 'w') as f:
        json.dump(hotspots, f, indent=2)
    logger.info(f"Saved {len(hotspots)} ranked hotspots to: {hotspots_out_path}")
    
    # Generate Heatmap GeoJSON
    logger.info("Generating aggregated coordinate heatmap GeoJSON...")
    heatmap = service.get_heatmap(precision=4)
    
    heatmap_out_path = config.FEATURE_ENGINEERED_DATA_PATH.replace(".csv", "_heatmap.geojson")
    with open(heatmap_out_path, 'w') as f:
        json.dump(heatmap, f, indent=2)
    logger.info(f"Saved heatmap containing {heatmap['metadata']['grid_cells']} nodes to: {heatmap_out_path}")
    
    elapsed_time = time.time() - start_time
    logger.info("----------------------------------------")
    logger.info(f"Pipeline completed successfully in {elapsed_time:.2f} seconds.")
    logger.info("All deliverables generated and validated.")
    logger.info("----------------------------------------")

if __name__ == "__main__":
    main()
