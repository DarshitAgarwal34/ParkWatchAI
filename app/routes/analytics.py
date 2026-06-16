from fastapi import APIRouter, Depends
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

from app.database import get_db
from app.models.violation import Violation

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """Retrieves high-level dashboard metrics for the operations center in a highly optimized single query."""
    # Run a single aggregation query to prevent 5 sequential table scans on 293k rows
    result = db.query(
        func.count(Violation.id).label("total"),
        func.sum(case((Violation.validation_status.in_(["APPROVED", "RESOLVED", "CLOSED", "DISPATCHED"]), 1), else_=0)).label("resolved"),
        func.sum(case((Violation.is_peak_hour == 1, 1), else_=0)).label("peak_count"),
        func.avg(Violation.action_delay).label("avg_delay"),
        func.sum(case((Violation.data_sent_to_scita == True, 1), else_=0)).label("scita_synced")
    ).first()
    
    if not result or result.total == 0:
        return {
            "total_violations": 0,
            "active_violations": 0,
            "resolved_violations": 0,
            "peak_hour_ratio": 0.0,
            "average_action_delay_mins": 0.0,
            "scita_sync_rate": 0.0
        }
        
    total = result.total
    resolved = int(result.resolved or 0)
    active = total - resolved
    peak_count = int(result.peak_count or 0)
    peak_ratio = peak_count / total if total > 0 else 0.0
    avg_delay = float(result.avg_delay) if result.avg_delay is not None else 0.0
    scita_synced = int(result.scita_synced or 0)
    scita_rate = scita_synced / total if total > 0 else 0.0
    
    return {
        "total_violations": total,
        "active_violations": active,
        "resolved_violations": resolved,
        "peak_hour_ratio": round(peak_ratio, 4),
        "average_action_delay_mins": round(avg_delay, 2),
        "scita_sync_rate": round(scita_rate, 4)
    }


@router.get("/hourly")
def get_hourly_analytics(
    police_station: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves violation distribution grouped by hour of the day with filtering."""
    query = db.query(
        Violation.violation_hour,
        func.count(Violation.id).label("count")
    ).filter(Violation.violation_hour.isnot(None))
    
    if police_station:
        query = query.filter(Violation.police_station.ilike(police_station.strip()))
    if vehicle_type:
        query = query.filter(Violation.vehicle_type.ilike(vehicle_type.strip()))
        
    results = query.group_by(Violation.violation_hour)\
                   .order_by(Violation.violation_hour)\
                   .all()
     
    return [{"hour": r[0], "count": r[1]} for r in results]

@router.get("/types")
def get_type_breakdowns(
    police_station: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves categorical breakdown by violation type and vehicle type with filtering."""
    import json

    # Violation Type query
    vt_query = db.query(
        Violation.violation_type,
        func.count(Violation.id).label("count")
    )
    if police_station:
        vt_query = vt_query.filter(Violation.police_station.ilike(police_station.strip()))
    violation_types = vt_query.group_by(Violation.violation_type)\
                               .order_by(func.count(Violation.id).desc())\
                               .all()
     
    # Process violation type counts (flatten arrays/lists of strings)
    vt_counts = {}
    for vt_raw, count in violation_types:
        if not vt_raw:
            vt_counts["UNKNOWN"] = vt_counts.get("UNKNOWN", 0) + count
            continue
            
        vt_raw = vt_raw.strip()
        if not vt_raw:
            vt_counts["UNKNOWN"] = vt_counts.get("UNKNOWN", 0) + count
            continue
            
        parsed_types = []
        if vt_raw.startswith("[") and vt_raw.endswith("]"):
            try:
                parsed = json.loads(vt_raw)
                if isinstance(parsed, list):
                    parsed_types = [str(x).strip() for x in parsed if x]
                else:
                    parsed_types = [str(parsed).strip()]
            except Exception:
                # Fallback to splitting if JSON load fails
                parsed_types = [x.strip() for x in vt_raw.replace("[", "").replace("]", "").split(",") if x.strip()]
        else:
            if "," in vt_raw:
                parsed_types = [x.strip() for x in vt_raw.split(",") if x.strip()]
            else:
                parsed_types = [vt_raw]
                
        for t in parsed_types:
            t_clean = t.replace('"', '').replace("'", "").strip().upper()
            if t_clean:
                vt_counts[t_clean] = vt_counts.get(t_clean, 0) + count
            else:
                vt_counts["UNKNOWN"] = vt_counts.get("UNKNOWN", 0) + count

    # Convert to list sorted by count descending
    violation_type_dist = [{"type": k, "count": v} for k, v in vt_counts.items()]
    violation_type_dist.sort(key=lambda x: x["count"], reverse=True)

    # Vehicle Type query
    v_query = db.query(
        Violation.vehicle_type,
        func.count(Violation.id).label("count")
    )
    if police_station:
        v_query = v_query.filter(Violation.police_station.ilike(police_station.strip()))
    vehicle_types = v_query.group_by(Violation.vehicle_type)\
                           .order_by(func.count(Violation.id).desc())\
                           .all()
     
    return {
        "violation_type_distribution": violation_type_dist,
        "vehicle_type_distribution": [{"type": vt[0].strip().upper() if vt[0] else "UNKNOWN", "count": vt[1]} for vt in vehicle_types]
    }
