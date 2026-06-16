from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

# 1. Base Pydantic Schema
class ViolationBase(BaseModel):
    latitude: float = Field(..., example=12.9716)
    longitude: float = Field(..., example=77.5946)
    location: Optional[str] = Field(None, example="Hudson Circle, Bangalore")
    vehicle_number: Optional[str] = Field(None, example="KA03HA4598")
    vehicle_type: Optional[str] = Field(None, example="Car")
    description: Optional[str] = Field(None, example="Double parked near main entrance")
    violation_type: Optional[str] = Field(None, example="Double Parking")
    offence_code: Optional[str] = Field(None, example="OFF-SEC-122")
    created_datetime: datetime = Field(..., example="2026-06-16T10:25:00Z")

# 2. Ingestion Request Schema
class ViolationCreate(ViolationBase):
    device_id: Optional[str] = Field("CAMERA_DEFAULT", example="CAM-JUNC-098-NORTH")
    created_by_id: Optional[str] = Field("SYSTEM", example="SYSTEM_OCR")
    center_code: Optional[str] = Field("SYSTEM_DEFAULT", example="CNTR-560001")
    police_station: Optional[str] = Field("UNKNOWN_PRECINCT", example="Halasuru Police Station")
    junction_name: Optional[str] = Field("UNKNOWN_JUNCTION", example="Hudson Circle")

# 3. Ingest Response Schema
class ViolationIngestResponse(BaseModel):
    status: str
    message: str
    incident_id: str

# 4. Patch Enforcement Action Schema
class ViolationActionUpdate(BaseModel):
    validation_status: str = Field(..., example="APPROVED")
    updated_vehicle_number: Optional[str] = Field(None, example="KA03HA4598")
    updated_vehicle_type: Optional[str] = Field(None, example="Car")
    action_taken_timestamp: datetime = Field(..., example="2026-06-16T10:28:15Z")
    
    class Config:
        json_schema_extra = {
            "example": {
                "validation_status": "APPROVED",
                "updated_vehicle_number": "KA03HA4598",
                "updated_vehicle_type": "Car",
                "action_taken_timestamp": "2026-06-16T10:28:15Z"
            }
        }

# 5. Full Database Item Response
class ViolationResponse(ViolationBase):
    id: str
    closed_datetime: Optional[datetime] = None
    modified_datetime: Optional[datetime] = None
    action_taken_timestamp: Optional[datetime] = None
    data_sent_to_scita_timestamp: Optional[datetime] = None
    validation_timestamp: Optional[datetime] = None
    device_id: Optional[str] = None
    created_by_id: Optional[str] = None
    center_code: Optional[str] = None
    police_station: Optional[str] = None
    junction_name: Optional[str] = None
    data_sent_to_scita: bool
    updated_vehicle_number: Optional[str] = None
    updated_vehicle_type: Optional[str] = None
    validation_status: str
    
    # Feature engineered columns
    violation_hour: Optional[int] = None
    violation_day_of_week: Optional[int] = None
    is_weekend: Optional[int] = None
    is_peak_hour: Optional[int] = None
    month: Optional[int] = None
    week_of_year: Optional[int] = None
    violation_duration: Optional[float] = None
    action_delay: Optional[float] = None
    validation_delay: Optional[float] = None
    hotspot_cluster_id: Optional[int] = None
    location_repeat_frequency: Optional[int] = None
    
    # Risk assessment
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    risk_confidence_level: Optional[str] = None
    risk_explanation: Optional[str] = None
    
    class Config:
        from_attributes = True

# 6. Action Sync Response Schema
class ActionSyncResponse(BaseModel):
    status: str
    message: str
    scita_sync_status: Dict[str, Any]

# 7. Evaluate Scoring Schema (On-the-fly)
class ScoringEvaluateRequest(BaseModel):
    location_repeat_frequency: int = Field(1, example=450)
    is_repeat_vehicle: int = Field(0, example=1)
    violation_type: str = Field("UNKNOWN", example="Double Parking")
    is_peak_hour: int = Field(0, example=1)
    action_delay: Optional[float] = Field(None, example=95.0)
    junction_name: Optional[str] = Field(None, example="Silk Board")
    police_station_violation_rank: Optional[int] = Field(None, example=3)
    validation_status: Optional[str] = Field("PENDING", example="APPROVED")
    vehicle_number: Optional[str] = Field(None, example="KA51MC1234")

class ScoringEvaluateResponse(BaseModel):
    risk_score: float
    risk_category: str
    confidence_score: float
    confidence_level: str
    explanation: str
    breakdown: Dict[str, float]
