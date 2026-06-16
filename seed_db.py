import logging
import pandas as pd
import numpy as np
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.database import engine, Base
from app.models.violation import Violation
import config

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("seed_db")

def clean_value(val):
    """Replaces NaNs, NaTs, and infinite float structures with None for DB inserting."""
    if pd.isna(val) or val is pd.NaT:
        return None
    if isinstance(val, (int, float)) and np.isnan(val):
        return None
    return val

def seed_database():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Check if database is already populated
    existing_count = db.query(Violation).count()
    if existing_count > 0:
        logger.info(f"Database already contains {existing_count} records. Skipping seeding.")
        db.close()
        return
        
    logger.info(f"Loading feature-engineered data from {config.FEATURE_ENGINEERED_DATA_PATH}...")
    try:
        df = pd.read_csv(config.FEATURE_ENGINEERED_DATA_PATH, low_memory=False)
    except FileNotFoundError:
        logger.error("Feature engineered dataset not found. Please run the pipeline first.")
        db.close()
        return
        
    logger.info(f"Found {len(df)} records. Beginning batch insertion in chunks...")
    
    # Standardize columns to match SQL DB model
    # Convert dates
    date_cols = [
        'created_datetime', 'closed_datetime', 'modified_datetime',
        'action_taken_timestamp', 'data_sent_to_scita_timestamp', 'validation_timestamp'
    ]
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce', utc=True)
            
    # Batch insertion loop
    chunk_size = 1000
    violations_to_insert = []
    
    for idx, row in df.iterrows():
        # Map row keys to model properties
        violation = Violation(
            id=str(row['id']),
            latitude=float(row['latitude']),
            longitude=float(row['longitude']),
            location=clean_value(row.get('location')),
            vehicle_number=clean_value(row.get('vehicle_number')),
            vehicle_type=clean_value(row.get('vehicle_type')),
            description=clean_value(row.get('description')),
            violation_type=clean_value(row.get('violation_type')),
            offence_code=clean_value(row.get('offence_code')),
            created_datetime=row['created_datetime'],
            closed_datetime=clean_value(row.get('closed_datetime')),
            modified_datetime=clean_value(row.get('modified_datetime')),
            action_taken_timestamp=clean_value(row.get('action_taken_timestamp')),
            data_sent_to_scita_timestamp=clean_value(row.get('data_sent_to_scita_timestamp')),
            validation_timestamp=clean_value(row.get('validation_timestamp')),
            device_id=clean_value(row.get('device_id')),
            created_by_id=clean_value(row.get('created_by_id')),
            center_code=clean_value(row.get('center_code')),
            police_station=clean_value(row.get('police_station')),
            junction_name=clean_value(row.get('junction_name')),
            data_sent_to_scita=bool(row.get('data_sent_to_scita', False)),
            updated_vehicle_number=clean_value(row.get('updated_vehicle_number')),
            updated_vehicle_type=clean_value(row.get('updated_vehicle_type')),
            validation_status=str(row.get('validation_status', 'PENDING')).upper(),
            
            # Engineered Time Features
            violation_hour=clean_value(row.get('violation_hour')),
            violation_day_of_week=clean_value(row.get('violation_day_of_week')),
            is_weekend=clean_value(row.get('is_weekend')),
            is_peak_hour=clean_value(row.get('is_peak_hour')),
            month=clean_value(row.get('month')),
            week_of_year=clean_value(row.get('week_of_year')),
            violation_duration=clean_value(row.get('violation_duration')),
            action_delay=clean_value(row.get('action_delay')),
            validation_delay=clean_value(row.get('validation_delay')),
            
            # Engineered Location Features
            hotspot_cluster_id=clean_value(row.get('hotspot_cluster_id')),
            location_repeat_frequency=clean_value(row.get('location_repeat_frequency')),
            police_station_violation_rank=clean_value(row.get('police_station_violation_rank')),
            junction_violation_rank=clean_value(row.get('junction_violation_rank')),
            
            # Engineered Vehicle Features
            is_repeat_vehicle=clean_value(row.get('is_repeat_vehicle')),
            vehicle_violation_count=clean_value(row.get('vehicle_violation_count')),
            
            # Risk Engine Scores
            risk_score=clean_value(row.get('risk_score')),
            risk_category=clean_value(row.get('risk_category')),
            risk_confidence_level=clean_value(row.get('risk_confidence_level')),
            risk_explanation=clean_value(row.get('risk_explanation')),
            
            # Components
            component_density=clean_value(row.get('component_density')),
            component_repeat=clean_value(row.get('component_repeat')),
            component_severity=clean_value(row.get('component_severity')),
            component_peak=clean_value(row.get('component_peak')),
            component_delay=clean_value(row.get('component_delay')),
            component_sensitivity=clean_value(row.get('component_sensitivity'))
        )
        violations_to_insert.append(violation)
        
        # Flush to DB in chunks for memory safety
        if len(violations_to_insert) >= chunk_size:
            db.bulk_save_objects(violations_to_insert)
            db.commit()
            violations_to_insert = []
            if idx % 10000 == 0 and idx > 0:
                logger.info(f"Inserted {idx} records...")
                
    # Final flush
    if violations_to_insert:
        db.bulk_save_objects(violations_to_insert)
        db.commit()
        
    logger.info("Database successfully seeded with historical pipeline data.")
    db.close()

if __name__ == "__main__":
    seed_database()
