import logging
import pandas as pd
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("recommendation_engine")

class RecommendationEngine:
    def __init__(self, risk_threshold_critical: float = 80.0, congestion_threshold_high: float = 0.7):
        self.risk_threshold_critical = risk_threshold_critical
        self.congestion_threshold_high = congestion_threshold_high

    def generate_recommendations(self, 
                                 risk_score: float, 
                                 congestion_impact: float, 
                                 repeat_vehicle_ratio: float, 
                                 enforcement_delay_mins: float, 
                                 peak_hour_ratio: float) -> list:
        """
        Generates action-oriented enforcement recommendations based on input risk parameters.
        
        Args:
            risk_score: Normalized risk score (0 to 100)
            congestion_impact: Bounded congestion factor (0.0 to 1.0)
            repeat_vehicle_ratio: Ratio of violations caused by repeat offenders (0.0 to 1.0)
            enforcement_delay_mins: Mean response delay in minutes (can be float or None/NaN)
            peak_hour_ratio: Ratio of violations occurring during peak hours (0.0 to 1.0)
            
        Returns:
            list: Active recommendations, each with reason, confidence, impact, and window.
        """
        recommendations = []
        
        # Handle nan values in enforcement delay
        has_delay = not (np.isnan(enforcement_delay_mins) if isinstance(enforcement_delay_mins, (int, float)) else enforcement_delay_mins is None)
        delay_val = enforcement_delay_mins if has_delay else 0.0

        # 1. Tow Away Zone
        # Trigger: High risk and significant traffic congestion impact
        if risk_score >= 70.0 and congestion_impact >= 0.6:
            recommendations.append({
                "action": "Tow Away Zone Designation",
                "priority": "CRITICAL" if risk_score >= 80.0 else "HIGH",
                "reason": (
                    f"Severe risk score ({risk_score:.1f}) combined with high congestion impact "
                    f"({congestion_impact:.2f}) indicates that parked vehicles are directly "
                    f"obstructing active moving lanes, requiring immediate physical removal."
                ),
                "confidence": 0.95,
                "expected_impact": "Instantly restores road throughput and provides a strong deterrent to other motorists.",
                "suggested_deployment_window": "24/7 continuous tow presence"
            })

        # 2. Peak Hour Enforcement
        # Trigger: Heavy peak hour traffic violation clustering
        if peak_hour_ratio >= 0.55 and risk_score >= 45.0:
            recommendations.append({
                "action": "Peak Hour Enforcement Patrolling",
                "priority": "HIGH" if peak_hour_ratio >= 0.70 else "MEDIUM",
                "reason": (
                    f"Over {peak_hour_ratio*100:.1f}% of violations are concentrated during peak "
                    f"commuting hours, triggering downstream bottleneck propagation."
                ),
                "confidence": 0.90,
                "expected_impact": "Reduces corridor delays and bottleneck queues during peak commuting windows by up to 25%.",
                "suggested_deployment_window": "Morning (08:00 - 11:00) and Evening (17:00 - 20:00) shift alerts"
            })

        # 3. Camera Monitoring (ANPR)
        # Trigger: High delay or physical patrol response is slow
        if (has_delay and delay_val >= 45.0 and risk_score >= 50.0) or (risk_score >= 75.0 and not has_delay):
            recommendations.append({
                "action": "CCTV & ANPR Automated Monitoring",
                "priority": "HIGH",
                "reason": (
                    f"High enforcement delay ({delay_val:.1f} mins) or high risk profile "
                    f"indicates that manual patrols are logistically bottlenecked. "
                    f"Automated camera enforcement is recommended."
                ),
                "confidence": 0.88,
                "expected_impact": "Achieves 100% enforcement coverage, eliminates physical travel delays for wardens, and logs violation patterns continuously.",
                "suggested_deployment_window": "Continuous (24/7 Automated System)"
            })

        # 4. Repeat Offender Action
        # Trigger: High ratio of repeat violators
        if repeat_vehicle_ratio >= 0.30:
            recommendations.append({
                "action": "Targeted Repeat Offender Escalation",
                "priority": "HIGH" if repeat_vehicle_ratio >= 0.45 else "MEDIUM",
                "reason": (
                    f"Repeat offenders represent {repeat_vehicle_ratio*100:.1f}% of total violations, "
                    f"demonstrating that standard fines are failing to deter chronic offenders."
                ),
                "confidence": 0.92,
                "expected_impact": "Imposes escalating penalties, tire booting, or towing prioritizing vehicle registration bans.",
                "suggested_deployment_window": "Flexible target patrols matching arrival schedule of repeat plates"
            })

        # 5. Signage & Marking Improvement
        # Trigger: High violation count but low repeat offender ratio (indicates zone is confusing)
        if repeat_vehicle_ratio < 0.15 and risk_score >= 40.0:
            recommendations.append({
                "action": "Signage & Road Marking Audit",
                "priority": "MEDIUM",
                "reason": (
                    f"Low repeat vehicle ratio ({repeat_vehicle_ratio*100:.1f}%) combined with moderate/high "
                    f"offences indicates that different drivers are repeatedly making accidental violations. "
                    f"Regulations are likely poorly marked."
                ),
                "confidence": 0.82,
                "expected_impact": "Reduces accidental violations by up to 30% through clear painted curbs and reflective signage.",
                "suggested_deployment_window": "Infrastructure rollout within 14 days"
            })

        # 6. Warning Campaign
        # Trigger: Low to moderate risk with new violations forming
        if 30.0 <= risk_score < 55.0 and repeat_vehicle_ratio < 0.20:
            recommendations.append({
                "action": "Public Warning & Education Campaign",
                "priority": "LOW",
                "reason": (
                    f"Emerging hotspot with low risk ({risk_score:.1f}) and mostly first-time offenders. "
                    f"Best resolved via initial warning notices and education before penalty enforcement."
                ),
                "confidence": 0.78,
                "expected_impact": "Improves public goodwill while establishing boundaries before active fining begins.",
                "suggested_deployment_window": "Mid-day shifts (11:00 - 15:00)"
            })

        # 7. Station Escalation
        # Trigger: Critical risk score requiring higher jurisdiction action
        if risk_score >= self.risk_threshold_critical:
            recommendations.append({
                "action": "Precinct Command Level Escalation",
                "priority": "CRITICAL",
                "reason": (
                    f"Critical risk level ({risk_score:.1f}) detected. Zone is a severe hazard "
                    f"requiring localized coordination at the jurisdictional precinct level."
                ),
                "confidence": 0.94,
                "expected_impact": "Secures precinct resource reallocation, dedicated towing slots, and coordinated police sweeps.",
                "suggested_deployment_window": "Immediate notification dispatch"
            })

        # 8. Routine Patrol
        # Trigger: Default fallback for lower risk zones where no other critical action is matched
        if len(recommendations) == 0 or (risk_score < 40.0 and peak_hour_ratio < 0.4):
            recommendations.append({
                "action": "Routine Patrol Allocation",
                "priority": "LOW",
                "reason": "Hotspot remains within safe limits. Standard periodic check-ins will prevent escalation.",
                "confidence": 0.85,
                "expected_impact": "Maintains low-level compliance presence and gathers baseline density metrics.",
                "suggested_deployment_window": "Weekly rotation during daytime hours"
            })

        return recommendations

    def process_hotspot_list(self, hotspots: list) -> list:
        """
        Takes a list of hotspot metadata dictionaries and appends recommendations to each.
        """
        logger.info(f"Generating recommendations for {len(hotspots)} hotspots...")
        
        for h in hotspots:
            risk = float(h.get("composite_rank_score", 50.0))
            
            # Extract inputs
            risk_inputs = h.get("risk_inputs", {})
            peak_ratio = float(risk_inputs.get("peak_hour_ratio", 0.0))
            repeat_ratio = float(risk_inputs.get("repeat_vehicle_ratio", 0.0))
            delay = risk_inputs.get("average_action_delay_mins")
            delay_val = float(delay) if delay is not None else np.nan
            
            # Map density to congestion impact (0 to 1 scale)
            # High violation counts correlate with higher lane occupancy / blockage
            count = h.get("violation_count", 0)
            congestion_est = min(1.0, count / 1000.0) # Normalized scale
            
            # Generate
            recs = self.generate_recommendations(
                risk_score=risk,
                congestion_impact=congestion_est,
                repeat_vehicle_ratio=repeat_ratio,
                enforcement_delay_mins=delay_val,
                peak_hour_ratio=peak_ratio
            )
            
            h["recommendations"] = recs
            
        logger.info("Recommendation processing complete.")
        return hotspots

if __name__ == "__main__":
    # Quick Test Execution
    engine = RecommendationEngine()
    test_recs = engine.generate_recommendations(
        risk_score=85.5,
        congestion_impact=0.82,
        repeat_vehicle_ratio=0.38,
        enforcement_delay_mins=95.0,
        peak_hour_ratio=0.68
    )
    import json
    print("Sample Recommendation Output:")
    print(json.dumps(test_recs, indent=2))
