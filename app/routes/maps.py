from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.hotspot_service import HotspotDbService

router = APIRouter(prefix="/maps", tags=["maps"])

@router.get("/heatmap")
def get_heatmap(
    precision: int = Query(4, ge=1, le=8),
    police_station: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    start_hour: Optional[int] = Query(None, ge=0, le=23),
    end_hour: Optional[int] = Query(None, ge=0, le=23),
    db: Session = Depends(get_db)
):
    """
    Generates a GeoJSON FeatureCollection of aggregated coordinate grid cells,
    complete with normalization weights for frontend mapping display.
    """
    filters = {
        "police_station": police_station,
        "vehicle_type": vehicle_type,
        "start_hour": start_hour,
        "end_hour": end_hour
    }
    
    service = HotspotDbService(db)
    return service.get_heatmap_geojson(filters, precision=precision)
