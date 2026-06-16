from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.services.hotspot_service import HotspotDbService, invalidate_hotspots_cache
from app.models.violation import Violation

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("")
def get_recommendations_queue(
    police_station: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Exposes a unified queue of enforcement recommendation actions grouped by hotspots,
    sorted by their risk priority level.
    """
    filters = {
        "police_station": police_station,
        "vehicle_type": vehicle_type
    }
    
    service = HotspotDbService(db)
    hotspots = service.get_ranked_hotspots(filters)
    
    # Flatten the hotspots to extract only recommendations, enriched with hotspot context
    recommendation_queue = []
    for h in hotspots:
        for rec in h.get("recommendations", []):
            recommendation_queue.append({
                "hotspot_id": h["hotspot_id"],
                "location": h["location"],
                "centroid": h["centroid"],
                "violation_count": h["violation_count"],
                "composite_risk_score": h["composite_rank_score"],
                "recommended_action": rec["action"],
                "priority": rec["priority"],
                "reason": rec["reason"],
                "confidence": rec["confidence"],
                "expected_impact": rec["expected_impact"],
                "suggested_deployment_window": rec["suggested_deployment_window"]
            })
            
    # Sort by priority level (CRITICAL -> HIGH -> MEDIUM -> LOW)
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    recommendation_queue = sorted(
        recommendation_queue, 
        key=lambda x: (priority_order.get(x["priority"], 99), -x["composite_risk_score"])
    )
    
    return recommendation_queue

@router.post("/{hotspot_id}/apply")
def apply_recommendation(
    hotspot_id: str,
    action_type: str = Query(..., example="Tow Away Zone Designation"),
    asset_id: str = Query(..., example="TOW-UNIT-04"),
    db: Session = Depends(get_db)
):
    """
    Approves a recommended action for a hotspot, simulates mobile dispatch to the
    target asset_id (tow truck/officer), and locks relevant local violations in a 'DISPATCHED' status.
    """
    service = HotspotDbService(db)
    hotspot = service.get_hotspot_by_id(hotspot_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot ID not found.")
        
    # Get spatial coordinates of the boundary polygon vertices to find matching violations in DB
    vertices = hotspot["polygon_vertices"]
    if not vertices:
        raise HTTPException(status_code=400, detail="Cannot apply spatial operations on a hotspot without coordinates.")
        
    # Standard bounding box fallback to update violation entries
    lats = [v[0] for v in vertices]
    lons = [v[1] for v in vertices]
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    
    # Find all pending violations inside this bounding box
    affected_violations = db.query(Violation).filter(
        Violation.latitude >= min_lat,
        Violation.latitude <= max_lat,
        Violation.longitude >= min_lon,
        Violation.longitude <= max_lon,
        Violation.validation_status == "PENDING"
    ).all()
    
    for v in affected_violations:
        v.validation_status = "DISPATCHED"
        v.modified_datetime = datetime.now()
        
    db.commit()
    
    # Invalidate cache to reflect validation status updates (e.g. APPROVED/RESOLVED/DISPATCHED)
    invalidate_hotspots_cache()
    
    from datetime import datetime
    return {
        "status": "success",
        "message": f"Successfully dispatched recommendation '{action_type}' to asset '{asset_id}'.",
        "hotspot_id": hotspot_id,
        "affected_records_count": len(affected_violations),
        "dispatch_details": {
            "dispatch_id": f"DISP-{uuid.uuid4().hex[:10].upper()}",
            "timestamp": datetime.now().isoformat(),
            "target_location": hotspot["location"],
            "target_centroid": hotspot["centroid"]
        }
    }
