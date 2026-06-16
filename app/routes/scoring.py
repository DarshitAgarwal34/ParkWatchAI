from fastapi import APIRouter, HTTPException
from app.schemas.violation_schemas import ScoringEvaluateRequest, ScoringEvaluateResponse
from risk_engine import RiskScoringEngine

router = APIRouter(prefix="/scoring", tags=["scoring"])

@router.post("/evaluate", response_model=ScoringEvaluateResponse)
def evaluate_risk_on_the_fly(payload: ScoringEvaluateRequest):
    """
    Evaluates violation metrics on-the-fly and returns normalized risk scores 
    and complete component breakdowns. Does not save records to database.
    """
    try:
        # Convert Pydantic request model to dictionary
        row_dict = payload.dict()
        
        # Inject default logic for empty/none parameters
        if not row_dict.get("vehicle_number"):
            row_dict["vehicle_number"] = "UNKNOWN"
            
        # Initialize and evaluate
        risk_engine = RiskScoringEngine()
        result = risk_engine.calculate_row_risk(row_dict)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk scoring evaluation failed: {str(e)}")
