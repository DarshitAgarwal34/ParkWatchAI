import logging
import pandas as pd
import numpy as np
import config
from scoring_utils import (
    get_severity_score,
    normalize_density,
    normalize_delay,
    calculate_confidence
)

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format=config.LOG_FORMAT)
logger = logging.getLogger("risk_engine")

class RiskScoringEngine:
    def __init__(self, max_density: float = None):
        # We can pass or compute max density scale factor
        self.max_density = max_density or 500.0

    def calculate_row_risk(self, row: dict) -> dict:
        """
        Calculates the risk score and detailed explainable breakdown for a single violation incident.
        """
        # 1. Spatial Violation Density (30%)
        # Map density from the local repeat frequency
        density_raw = float(row.get('location_repeat_frequency', 1.0))
        density_score = normalize_density(density_raw, self.max_density)
        
        # 2. Repeat Violation Pattern (20%)
        # Check if vehicle has historical offences
        is_repeat = int(row.get('is_repeat_vehicle', 0))
        repeat_score = 1.0 if is_repeat == 1 else 0.0
        
        # 3. Offence Severity (15%)
        # Maps specific offence codes/types to severity weights
        severity_score = get_severity_score(row.get('violation_type', 'UNKNOWN'))
        
        # 4. Peak Hour Occurrence (15%)
        # Time of day risk factor
        peak_score = float(row.get('is_peak_hour', 0))
        
        # 5. Enforcement Delay (10%)
        # Captures lag in active obstruction clearance
        delay_score = normalize_delay(float(row.get('action_delay', np.nan)))
        
        # 6. Location Sensitivity (10%)
        # Proximity to critical traffic junctions and areas
        is_junction = 1.0 if (row.get('junction_name') and row.get('junction_name') != 'UNKNOWN_JUNCTION') else 0.0
        # Check precinct criticality
        precinct_rank = float(row.get('police_station_violation_rank', 100.0))
        precinct_score = 0.3 if precinct_rank <= 5.0 else 0.0
        sensitivity_score = min(1.0, 0.2 + is_junction * 0.5 + precinct_score)
        
        # Calculate Weighted Composite Score (scale 0-100)
        weighted_score = (
            density_score * 0.30 +
            repeat_score * 0.20 +
            severity_score * 0.15 +
            peak_score * 0.15 +
            delay_score * 0.10 +
            sensitivity_score * 0.10
        ) * 100.0
        
        # Categorization based on specification
        # 0-30 Low | 31-60 Medium | 61-80 High | 81-100 Critical
        if weighted_score <= 30.0:
            category = "LOW"
        elif weighted_score <= 60.0:
            category = "MEDIUM"
        elif weighted_score <= 80.0:
            category = "HIGH"
        else:
            category = "CRITICAL"
            
        # Confidence calculation
        conf_score, conf_level = calculate_confidence(row)
        
        # Construct human-readable explainable text
        top_drivers = []
        if density_score > 0.7: top_drivers.append("High violation density")
        if repeat_score > 0.7: top_drivers.append("Repeat offending vehicle")
        if severity_score > 0.7: top_drivers.append("Severe obstruction type")
        if peak_score > 0.7: top_drivers.append("Peak commuting hour blockage")
        if delay_score > 0.7: top_drivers.append("Prolonged enforcement delay")
        if sensitivity_score > 0.7: top_drivers.append("Junction/critical zone location")
        
        explanation = " - ".join(top_drivers) if top_drivers else "Standard traffic hazard profiles"
        
        return {
            "risk_score": round(weighted_score, 2),
            "risk_category": category,
            "confidence_score": round(conf_score, 2),
            "confidence_level": conf_level,
            "explanation": explanation,
            "breakdown": {
                "density_component": round(density_score * 30.0, 2),
                "repeat_pattern_component": round(repeat_score * 20.0, 2),
                "offence_severity_component": round(severity_score * 15.0, 2),
                "peak_hour_component": round(peak_score * 15.0, 2),
                "enforcement_delay_component": round(delay_score * 10.0, 2),
                "location_sensitivity_component": round(sensitivity_score * 10.0, 2)
            }
        }

    def process_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Processes a pandas DataFrame, computes risk metrics, and returns it with 
        explainable risk score columns appended.
        """
        logger.info("Computing risk scores for violation dataset...")
        
        # Calculate dynamic max density if not explicitly defined
        if 'location_repeat_frequency' in df.columns:
            self.max_density = float(df['location_repeat_frequency'].max())
            logger.info(f"Dynamically set max density scaling parameter to: {self.max_density}")
            
        # Pre-allocate risk arrays for performance
        scores = []
        categories = []
        conf_levels = []
        explanations = []
        
        # Components for UI charts
        comp_density = []
        comp_repeat = []
        comp_severity = []
        comp_peak = []
        comp_delay = []
        comp_sensitivity = []
        
        # Process rows
        for _, row in df.iterrows():
            res = self.calculate_row_risk(row.to_dict())
            scores.append(res["risk_score"])
            categories.append(res["risk_category"])
            conf_levels.append(res["confidence_level"])
            explanations.append(res["explanation"])
            
            breakdown = res["breakdown"]
            comp_density.append(breakdown["density_component"])
            comp_repeat.append(breakdown["repeat_pattern_component"])
            comp_severity.append(breakdown["offence_severity_component"])
            comp_peak.append(breakdown["peak_hour_component"])
            comp_delay.append(breakdown["enforcement_delay_component"])
            comp_sensitivity.append(breakdown["location_sensitivity_component"])
            
        # Assign to dataframe
        df['risk_score'] = scores
        df['risk_category'] = categories
        df['risk_confidence_level'] = conf_levels
        df['risk_explanation'] = explanations
        
        df['component_density'] = comp_density
        df['component_repeat'] = comp_repeat
        df['component_severity'] = comp_severity
        df['component_peak'] = comp_peak
        df['component_delay'] = comp_delay
        df['component_sensitivity'] = comp_sensitivity
        
        # Print summary
        category_counts = df['risk_category'].value_counts().to_dict()
        logger.info(f"Risk processing complete. Distribution: {category_counts}")
        
        return df

if __name__ == "__main__":
    # Test block
    engine = RiskScoringEngine()
    test_row = {
        "location_repeat_frequency": 450,
        "is_repeat_vehicle": 1,
        "violation_type": "Double Parking",
        "is_peak_hour": 1,
        "action_delay": 95.0,
        "junction_name": "Silk Board",
        "police_station_violation_rank": 3,
        "validation_status": "APPROVED",
        "vehicle_number": "KA51MC1234"
    }
    result = engine.calculate_row_risk(test_row)
    import json
    print("Test Row Risk Output:")
    print(json.dumps(result, indent=2))
