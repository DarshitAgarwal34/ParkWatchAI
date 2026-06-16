import os

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = BASE_DIR
INPUT_DATA_PATH = os.path.join(DATA_DIR, "jan to may police violation_anonymized791b166.csv")
PREPROCESSED_DATA_PATH = os.path.join(DATA_DIR, "preprocessed_violations.csv")
FEATURE_ENGINEERED_DATA_PATH = os.path.join(DATA_DIR, "feature_engineered_violations.csv")

# Coordinate limits (For India / general urban validation, e.g. Bangalore center bounds if needed)
# Default is bounding box for India (Lat: 8.4 to 37.6, Lon: 68.7 to 97.2)
MIN_LATITUDE = 8.0
MAX_LATITUDE = 38.0
MIN_LONGITUDE = 68.0
MAX_LONGITUDE = 98.0

# Temporal Features Config
PEAK_HOURS = [
    (8, 11),   # Morning peak 8 AM - 11 AM
    (17, 20)   # Evening peak 5 PM - 8 PM
]

# Spatial Clustering Config (DBSCAN Parameters)
# eps: maximum distance between two samples for one to be considered as in the neighborhood of the other.
# For coordinates (degrees), 0.001 is roughly 110 meters. Let's use 0.0015 (approx 165 meters).
DBSCAN_EPS_DEGREES = 0.0015
DBSCAN_MIN_SAMPLES = 5

# Logging Config
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_LEVEL = "INFO"
