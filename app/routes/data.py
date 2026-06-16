import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.violation import Violation
from app.schemas.violation_schemas import (
    ViolationCreate, 
    ViolationResponse, 
    ViolationIngestResponse,
    ViolationActionUpdate,
    ActionSyncResponse
)
from risk_engine import RiskScoringEngine
from app.services.hotspot_service import invalidate_hotspots_cache


router = APIRouter(prefix="/violations", tags=["violations"])

@router.get("", response_model=List[ViolationResponse])
def list_violations(
    skip: int = 0,
    limit: int = 100,
    police_station: Optional[str] = None,
    validation_status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves list of violation records with filtering and pagination."""
    query = db.query(Violation)
    if police_station:
        query = query.filter(Violation.police_station.ilike(police_station.strip()))
    if validation_status:
        query = query.filter(Violation.validation_status.ilike(validation_status.strip()))
    if vehicle_type:
        query = query.filter(Violation.vehicle_type.ilike(vehicle_type.strip()))
        
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=ViolationIngestResponse, status_code=202)
def ingest_violation(payload: ViolationCreate, db: Session = Depends(get_db)):
    """
    Ingests a new parking violation event, computes real-time temporal features,
    applies risk scoring engine, and registers the incident in the database.
    """
    # 1. Generate unique identifier
    incident_id = str(uuid.uuid4())
    
    # 2. Extract temporal parameters
    created_dt = payload.created_datetime
    v_hour = created_dt.hour
    day_of_week = created_dt.weekday()
    is_wknd = 1 if day_of_week >= 5 else 0
    
    # Check peak hour
    import config
    is_peak = 0
    for start, end in config.PEAK_HOURS:
        if start <= v_hour < end:
            is_peak = 1
            break
            
    # 3. Resolve loc frequency and vehicle repeat stats from DB
    loc_freq = db.query(Violation).filter(Violation.location == payload.location).count() + 1
    veh_count = db.query(Violation).filter(Violation.vehicle_number == payload.vehicle_number).count() + 1
    is_repeat = 1 if veh_count > 1 else 0
    
    # 4. Construct DB record base dictionary to evaluate risk
    row_dict = {
        "location_repeat_frequency": loc_freq,
        "is_repeat_vehicle": is_repeat,
        "violation_type": payload.violation_type,
        "is_peak_hour": is_peak,
        "action_delay": np.nan,  # new violation has no delay
        "junction_name": payload.junction_name,
        "police_station_violation_rank": 10,  # nominal rank
        "validation_status": "PENDING",
        "vehicle_number": payload.vehicle_number
    }
    
    # Run risk evaluation
    import numpy as np
    risk_engine = RiskScoringEngine()
    risk_res = risk_engine.calculate_row_risk(row_dict)
    
    # 5. Populate db entry
    db_violation = Violation(
        id=incident_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location=payload.location,
        vehicle_number=payload.vehicle_number,
        vehicle_type=payload.vehicle_type,
        description=payload.description,
        violation_type=payload.violation_type,
        offence_code=payload.offence_code,
        created_datetime=payload.created_datetime,
        device_id=payload.device_id,
        created_by_id=payload.created_by_id,
        center_code=payload.center_code,
        police_station=payload.police_station,
        junction_name=payload.junction_name,
        validation_status="PENDING",
        data_sent_to_scita=False,
        
        # Computed features
        violation_hour=v_hour,
        violation_day_of_week=day_of_week,
        is_weekend=is_wknd,
        is_peak_hour=is_peak,
        month=created_dt.month,
        week_of_year=created_dt.isocalendar()[1],
        location_repeat_frequency=loc_freq,
        is_repeat_vehicle=is_repeat,
        vehicle_violation_count=veh_count,
        
        # Risk output
        risk_score=risk_res["risk_score"],
        risk_category=risk_res["risk_category"],
        risk_confidence_level=risk_res["confidence_level"],
        risk_explanation=risk_res["explanation"],
        
        # Components
        component_density=risk_res["breakdown"]["density_component"],
        component_repeat=risk_res["breakdown"]["repeat_pattern_component"],
        component_severity=risk_res["breakdown"]["offence_severity_component"],
        component_peak=risk_res["breakdown"]["peak_hour_component"],
        component_delay=risk_res["breakdown"]["enforcement_delay_component"],
        component_sensitivity=risk_res["breakdown"]["location_sensitivity_component"]
    )
    
    db.add(db_violation)
    db.commit()
    
    # Invalidate cache to reflect new geospatial coordinates
    invalidate_hotspots_cache()
    
    return {
        "status": "success",
        "message": "Incident successfully ingested and prioritized.",
        "incident_id": incident_id
    }

@router.get("/{incident_id}", response_model=ViolationResponse)
def get_violation(incident_id: str, db: Session = Depends(get_db)):
    """Retrieves a single violation incident record by its unique ID."""
    item = db.query(Violation).filter(Violation.id == incident_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Incident violation record not found.")
    return item

@router.patch("/{incident_id}/action", response_model=ActionSyncResponse)
def update_violation_action(
    incident_id: str, 
    payload: ViolationActionUpdate, 
    db: Session = Depends(get_db)
):
    """
    Logs physical action taken (towed/challan), calculates response latency, 
    and simulates instant synchronization with the SCITA gateway.
    """
    item = db.query(Violation).filter(Violation.id == incident_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Incident violation record not found.")
        
    # Apply modifications
    item.validation_status = payload.validation_status.upper()
    if payload.updated_vehicle_number:
        item.updated_vehicle_number = payload.updated_vehicle_number
    if payload.updated_vehicle_type:
        item.updated_vehicle_type = payload.updated_vehicle_type
        
    item.action_taken_timestamp = payload.action_taken_timestamp
    item.validation_timestamp = datetime.now()
    item.closed_datetime = datetime.now()
    
    # Calculate response latency in minutes
    latency = (item.action_taken_timestamp - item.created_datetime).total_seconds() / 60.0
    item.action_delay = latency
    
    # Update risk component delay with newly computed delay
    import numpy as np
    from scoring_utils import normalize_delay
    risk_engine = RiskScoringEngine()
    
    # Simulating SCITA synchronization pipeline
    item.data_sent_to_scita = True
    item.data_sent_to_scita_timestamp = datetime.now()
    
    db.commit()
    
    # Invalidate cache to reflect validation status updates (e.g. APPROVED/RESOLVED)
    invalidate_hotspots_cache()
    
    return {
        "status": "success",
        "message": "Enforcement action logged and saved.",
        "scita_sync_status": {
            "synced": True,
            "sync_timestamp": item.data_sent_to_scita_timestamp.isoformat(),
            "scita_transaction_id": f"TX-SCITA-AUTO-{uuid.uuid4().hex[:12].upper()}"
        }
    }
