import numpy as np

# Severity Mapping for standard violation types
VIOLATION_SEVERITY_MAP = {
    "DOUBLE PARKING": 1.0,
    "OBSTRUCTION": 0.9,
    "HYDRANT BLOCK": 1.0,
    "EMERGENCY ZONE BLOCK": 1.0,
    "BUS LANE BLOCK": 0.8,
    "NO PARKING ZONE": 0.6,
    "FOOTPATH ENCROACHMENT": 0.4,
    "EXPIRED METER": 0.2,
    "UNKNOWN": 0.3
}

def get_severity_score(violation_type: str) -> float:
    """Maps a violation type string to a severity score between 0.0 and 1.0."""
    if not isinstance(violation_type, str):
        return VIOLATION_SEVERITY_MAP["UNKNOWN"]
    
    val_upper = violation_type.strip().upper()
    # Check for substring matches for robustness
    for key, severity in VIOLATION_SEVERITY_MAP.items():
        if key in val_upper:
            return severity
            
    return VIOLATION_SEVERITY_MAP["UNKNOWN"]

def normalize_density(density: float, max_density: float = 1000.0) -> float:
    """Normalizes density using a soft clipping logarithmic function."""
    if density <= 0:
        return 0.0
    # Use log scaling so extremely high outliers don't crush standard variations
    log_density = np.log1p(density)
    log_max = np.log1p(max_density)
    return float(min(1.0, log_density / log_max))

def normalize_delay(delay_mins: float, target_max_mins: float = 120.0) -> float:
    """Normalizes enforcement delay. Caps at target_max_mins (default 2 hours)."""
    if pd_isna(delay_mins) or delay_mins < 0:
        # Default fallback for active/unresolved violations (assume high vulnerability)
        return 0.5
    return float(min(1.0, delay_mins / target_max_mins))

def calculate_confidence(row: dict) -> tuple:
    """
    Computes confidence score (0.0 to 1.0) and confidence level string
    based on the quality and completeness of data inputs.
    """
    confidence_score = 1.0
    penalties = 0.0
    
    # Penalty if vehicle number is unvalidated/placeholder
    veh_num = str(row.get('vehicle_number', '')).upper()
    if not veh_num or veh_num in ['UNKNOWN', 'NOT_FOUND', 'SYSTEM_DEFAULT', 'NOT_UPDATED', 'NAN']:
        penalties += 0.25
        
    # Penalty if validation status is pending or rejected
    status = str(row.get('validation_status', '')).upper()
    if status == 'REJECTED':
        penalties += 0.50
    elif status == 'PENDING' or not status:
        penalties += 0.15
        
    # Penalty if coordinates are default or missing
    lat, lon = row.get('latitude'), row.get('longitude')
    if lat is None or lon is None or (lat == 0.0 and lon == 0.0):
        penalties += 0.30
        
    confidence_score = max(0.1, confidence_score - penalties)
    
    if confidence_score >= 0.8:
        level = "HIGH"
    elif confidence_score >= 0.5:
        level = "MEDIUM"
    else:
        level = "LOW"
        
    return confidence_score, level

def pd_isna(val) -> bool:
    """Null check helper for numpy/pandas compatibility."""
    import pandas as pd
    return pd.isna(val)
