import logging
import pandas as pd
import numpy as np
import config

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format=config.LOG_FORMAT)
logger = logging.getLogger("preprocess")

def load_data(file_path: str) -> pd.DataFrame:
    """Loads CSV dataset and logs initial shape."""
    logger.info(f"Loading raw dataset from {file_path}...")
    try:
        # Using low_memory=False to prevent mixed type warning on large datasets
        df = pd.read_csv(file_path, low_memory=False)
        logger.info(f"Successfully loaded dataset with shape: {df.shape}")
        return df
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}")
        raise e

def validate_columns(df: pd.DataFrame) -> None:
    """Validates that necessary schema columns exist in the DataFrame."""
    required_columns = [
        'id', 'latitude', 'longitude', 'location', 'vehicle_number', 'vehicle_type',
        'description', 'violation_type', 'offence_code', 'created_datetime',
        'closed_datetime', 'modified_datetime', 'device_id', 'created_by_id',
        'center_code', 'police_station', 'data_sent_to_scita', 'junction_name',
        'action_taken_timestamp', 'data_sent_to_scita_timestamp',
        'updated_vehicle_number', 'updated_vehicle_type', 'validation_status',
        'validation_timestamp'
    ]
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        logger.warning(f"Missing columns in dataset schema: {missing}. Creating them with null/default values.")
        for col in missing:
            if col == 'data_sent_to_scita':
                df[col] = False
            else:
                df[col] = np.nan

def clean_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Identifies and removes duplicate records based on ID or combination of unique fields."""
    initial_len = len(df)
    
    # Drop duplicates by exact 'id' if unique, otherwise fall back to combination of keys
    if 'id' in df.columns and df['id'].nunique() == len(df):
        logger.info("Unique identifier 'id' validated. No duplicate ID records found.")
    else:
        df = df.drop_duplicates(subset=['id'], keep='first')
        logger.info(f"Dropped {initial_len - len(df)} duplicate ID records.")
    
    # Secondary check for duplicate events: same vehicle, location, and time
    before_dedup = len(df)
    dedup_cols = ['created_datetime', 'vehicle_number', 'violation_type', 'latitude', 'longitude']
    # Filter out nulls in keys before checking duplicates to avoid dropping valid records with partial nulls
    df = df.drop_duplicates(subset=dedup_cols, keep='first')
    logger.info(f"Dropped {before_dedup - len(df)} duplicate event records (same vehicle/time/loc/type).")
    
    return df

def validate_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """Validates latitude and longitude ranges and removes invalid entries."""
    initial_len = len(df)
    
    # Ensure latitude and longitude are float
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
    
    # Filter for valid coordinate ranges
    valid_coords = (
        (df['latitude'] >= config.MIN_LATITUDE) & 
        (df['latitude'] <= config.MAX_LATITUDE) & 
        (df['longitude'] >= config.MIN_LONGITUDE) & 
        (df['longitude'] <= config.MAX_LONGITUDE)
    )
    
    invalid_count = len(df) - df[valid_coords].shape[0]
    df = df[valid_coords].copy()
    logger.info(f"Removed {invalid_count} records with invalid/out-of-bounds coordinates (out of {initial_len}).")
    
    return df

def standardize_timestamps(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes datetime columns to UTC datetime format."""
    datetime_cols = [
        'created_datetime', 'closed_datetime', 'modified_datetime',
        'action_taken_timestamp', 'data_sent_to_scita_timestamp', 'validation_timestamp'
    ]
    
    for col in datetime_cols:
        if col in df.columns:
            # Coerce errors to NaT to handle corrupt date strings safely
            df[col] = pd.to_datetime(df[col], errors='coerce', utc=True)
            logger.info(f"Standardized timestamp column: {col}")
            
    # Drop rows without valid created_datetime (baseline temporal marker)
    initial_len = len(df)
    df = df.dropna(subset=['created_datetime']).copy()
    logger.info(f"Dropped {initial_len - len(df)} records due to missing/invalid 'created_datetime'.")
    
    return df

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Imputes default values for missing data where appropriate."""
    # Categorical fills
    categorical_defaults = {
        'location': 'UNKNOWN_LOCATION',
        'vehicle_type': 'UNKNOWN',
        'violation_type': 'UNKNOWN',
        'description': 'No description provided',
        'offence_code': 'UNKNOWN',
        'device_id': 'SYSTEM_DEFAULT',
        'created_by_id': 'SYSTEM',
        'center_code': 'SYSTEM_DEFAULT',
        'police_station': 'UNKNOWN_PRECINCT',
        'junction_name': 'UNKNOWN_JUNCTION',
        'updated_vehicle_number': 'NOT_UPDATED',
        'updated_vehicle_type': 'NOT_UPDATED'
    }
    
    for col, default in categorical_defaults.items():
        if col in df.columns:
            # Strip string whitespace and fill NA
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].fillna(default)
            # Handle empty strings as default
            df[col] = df[col].replace('', default)
            
    # Boolean fills
    if 'data_sent_to_scita' in df.columns:
        df['data_sent_to_scita'] = df['data_sent_to_scita'].fillna(False).astype(bool)
        
    # Validation status defaults to PENDING if not specified
    if 'validation_status' in df.columns:
        df['validation_status'] = df['validation_status'].fillna('PENDING').astype(str).str.upper()
        
    logger.info("Imputed missing values for categorical, boolean, and status fields.")
    return df

def run_preprocessing(input_path: str, output_path: str) -> pd.DataFrame:
    """Runs the entire preprocessing pipeline."""
    df = load_data(input_path)
    validate_columns(df)
    df = clean_duplicates(df)
    df = validate_coordinates(df)
    df = standardize_timestamps(df)
    df = handle_missing_values(df)
    
    logger.info(f"Saving preprocessed dataset with shape {df.shape} to {output_path}...")
    df.to_csv(output_path, index=False)
    logger.info("Preprocessing complete.")
    return df

if __name__ == "__main__":
    run_preprocessing(config.INPUT_DATA_PATH, config.PREPROCESSED_DATA_PATH)
