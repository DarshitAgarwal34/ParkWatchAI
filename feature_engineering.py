import logging
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
import config

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format=config.LOG_FORMAT)
logger = logging.getLogger("feature_engineering")

def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes time-based features from violation timestamps."""
    logger.info("Engineering temporal features...")
    
    # 1. violation_hour (0 - 23)
    df['violation_hour'] = df['created_datetime'].dt.hour
    
    # 2. violation_day_of_week (0 = Monday, 6 = Sunday)
    df['violation_day_of_week'] = df['created_datetime'].dt.weekday
    
    # 3. is_weekend (1 if Saturday/Sunday, else 0)
    df['is_weekend'] = (df['violation_day_of_week'] >= 5).astype(int)
    
    # 4. is_peak_hour (1 if in config peak hours, else 0)
    df['is_peak_hour'] = 0
    for start, end in config.PEAK_HOURS:
        df.loc[(df['violation_hour'] >= start) & (df['violation_hour'] < end), 'is_peak_hour'] = 1
        
    # 5. month (1 - 12)
    df['month'] = df['created_datetime'].dt.month
    
    # 6. week_of_year (1 - 53)
    # Using isocalendar().week for compatibility with newer pandas versions
    df['week_of_year'] = df['created_datetime'].dt.isocalendar().week.astype(int)
    
    # Helper to calculate duration in minutes
    def delta_in_minutes(start_col, end_col):
        # Result will be NaN if either start_col or end_col is null (NaT)
        return (df[end_col] - df[start_col]).dt.total_seconds() / 60.0

    # 7. violation_duration (closed_datetime - created_datetime)
    df['violation_duration'] = delta_in_minutes('created_datetime', 'closed_datetime')
    
    # 8. action_delay (action_taken_timestamp - created_datetime)
    df['action_delay'] = delta_in_minutes('created_datetime', 'action_taken_timestamp')
    
    # 9. validation_delay (validation_timestamp - created_datetime)
    df['validation_delay'] = delta_in_minutes('created_datetime', 'validation_timestamp')
    
    # Log summary statistics of time features
    logger.info(f"Temporal features added. Peak hour violations: {df['is_peak_hour'].sum()} / {len(df)}")
    return df

def add_location_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes location-based features using geographical and administrative metadata."""
    logger.info("Engineering spatial features...")
    
    # 1. hotspot_cluster_id using DBSCAN (haversine for spherical distance)
    logger.info("Computing spatial clusters (DBSCAN)...")
    coords = df[['latitude', 'longitude']].values
    
    # Convert lat/lon to radians for scikit-learn haversine
    coords_radians = np.radians(coords)
    
    # Radius of earth in km
    kms_per_radian = 6371.0088
    # 0.15 km = 150m search radius
    epsilon_radians = 0.15 / kms_per_radian 
    
    db = DBSCAN(
        eps=epsilon_radians, 
        min_samples=config.DBSCAN_MIN_SAMPLES, 
        metric='haversine', 
        algorithm='ball_tree'
    )
    df['hotspot_cluster_id'] = db.fit_predict(coords_radians)
    num_clusters = len(df['hotspot_cluster_id'].unique()) - (1 if -1 in df['hotspot_cluster_id'].values else 0)
    logger.info(f"Identified {num_clusters} spatial clusters. Outliers: {np.sum(df['hotspot_cluster_id'] == -1)}")
    
    # 2. location_repeat_frequency (how often the location name appears)
    df['location_repeat_frequency'] = df.groupby('location')['location'].transform('count')
    
    # 3. police_station_violation_rank
    # Rank 1 represents the police station with the highest number of violations
    station_counts = df['police_station'].value_counts()
    station_ranks = station_counts.rank(ascending=False, method='min')
    df['police_station_violation_rank'] = df['police_station'].map(station_ranks)
    
    # 4. junction_violation_rank
    # Rank 1 represents the junction with the highest number of violations
    junction_counts = df['junction_name'].value_counts()
    junction_ranks = junction_counts.rank(ascending=False, method='min')
    df['junction_violation_rank'] = df['junction_name'].map(junction_ranks)
    
    return df

def add_vehicle_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes vehicle violation history metrics."""
    logger.info("Engineering vehicle history features...")
    
    # Resolve the effective vehicle number (updated vehicle number if present, else original)
    # This prevents using incorrect OCR data when manual validation corrected it
    df['effective_vehicle_num'] = np.where(
        (df['updated_vehicle_number'] != 'NOT_UPDATED') & (df['updated_vehicle_number'].notnull()),
        df['updated_vehicle_number'],
        df['vehicle_number']
    )
    
    # Group by vehicle number to find counts
    vehicle_counts = df.groupby('effective_vehicle_num')['effective_vehicle_num'].transform('count')
    df['vehicle_violation_count'] = vehicle_counts
    
    # 1. is_repeat_vehicle (1 if vehicle has > 1 violation, else 0)
    df['is_repeat_vehicle'] = (df['vehicle_violation_count'] > 1).astype(int)
    
    # Handle placeholder vehicle numbers (like 'UNKNOWN', 'NOT_FOUND', 'SYSTEM_DEFAULT')
    # If the vehicle number is an unknown placeholder, reset counts to prevent false group tracking
    placeholders = ['UNKNOWN', 'NOT_FOUND', 'SYSTEM_DEFAULT', 'NOT_UPDATED', 'nan']
    is_placeholder = df['effective_vehicle_num'].str.upper().isin(placeholders) | df['effective_vehicle_num'].isna()
    
    df.loc[is_placeholder, 'vehicle_violation_count'] = 1
    df.loc[is_placeholder, 'is_repeat_vehicle'] = 0
    
    # Drop intermediate column
    df = df.drop(columns=['effective_vehicle_num'])
    
    repeat_count = df['is_repeat_vehicle'].sum()
    logger.info(f"Vehicle features engineered. Repeat offender vehicles flagged: {repeat_count}")
    return df

def run_feature_engineering(input_path: str, output_path: str) -> pd.DataFrame:
    """Loads preprocessed data and runs the entire feature engineering pipeline."""
    try:
        df = pd.read_csv(input_path, low_memory=False)
        # Convert created_datetime back to datetime series after CSV reading
        df['created_datetime'] = pd.to_datetime(df['created_datetime'], utc=True)
        
        # Action, validation, closed timestamps also need conversion for calculations
        for col in ['closed_datetime', 'action_taken_timestamp', 'validation_timestamp']:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], utc=True)
                
    except FileNotFoundError:
        logger.error(f"Preprocessed file not found at {input_path}. Please run preprocessing first.")
        raise
        
    df = add_time_features(df)
    df = add_location_features(df)
    df = add_vehicle_features(df)
    
    logger.info(f"Saving feature-engineered dataset with shape {df.shape} to {output_path}...")
    df.to_csv(output_path, index=False)
    logger.info("Feature engineering pipeline completed successfully.")
    return df

if __name__ == "__main__":
    run_feature_engineering(config.PREPROCESSED_DATA_PATH, config.FEATURE_ENGINEERED_DATA_PATH)
