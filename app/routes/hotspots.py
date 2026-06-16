from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.services.hotspot_service import HotspotDbService

router = APIRouter(prefix="/hotspots", tags=["hotspots"])

@router.get("")
def get_all_hotspots(
    police_station: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    start_hour: Optional[int] = Query(None, ge=0, le=23),
    end_hour: Optional[int] = Query(None, ge=0, le=23),
    is_weekend: Optional[int] = Query(None, ge=0, le=1),
    validation_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Computes and retrieves a list of ranked traffic hotspots using DBSCAN clustering 
    applied directly to database records matching the query parameters.
    """
    filters = {
        "police_station": police_station,
        "vehicle_type": vehicle_type,
        "start_hour": start_hour,
        "end_hour": end_hour,
        "is_weekend": is_weekend,
        "validation_status": validation_status
    }
    
    service = HotspotDbService(db)
    return service.get_ranked_hotspots(filters)

@router.get("/{hotspot_id}")
def get_hotspot_details(
    hotspot_id: str,
    police_station: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    start_hour: Optional[int] = Query(None, ge=0, le=23),
    end_hour: Optional[int] = Query(None, ge=0, le=23),
    db: Session = Depends(get_db)
):
    """Retrieves detailed polygon and metrics for a specific hotspot ID."""
    filters = {
        "police_station": police_station,
        "vehicle_type": vehicle_type,
        "start_hour": start_hour,
        "end_hour": end_hour
    }
    
    service = HotspotDbService(db)
    hotspot = service.get_hotspot_by_id(hotspot_id, filters)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot ID not found under search criteria.")
    return hotspot
