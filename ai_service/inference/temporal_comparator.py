"""Temporal Comparison and Longitudinal Healing Trajectory Module.
Analyzes time-series image sequences (Day 1, Day 3, Day 7, Day 14) and computes healing velocity.
"""

from typing import List, Dict, Any, Optional
import numpy as np


class TemporalComparator:
    """Compares historical time-points across multi-day wound monitoring."""

    @classmethod
    def compare_timeline(cls, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates trajectory metrics across time-ordered historical analyses."""
        if not history:
            return {
                "total_points": 0,
                "overall_area_reduction_pct": 0.0,
                "healing_velocity_cm2_day": 0.0,
                "granulation_progression": [],
                "area_progression": [],
                "trajectory_assessment": "Insufficient data points for trend calculation."
            }

        # Sort history by date/order
        sorted_history = sorted(
            history, 
            key=lambda x: x.get("capture_date") or x.get("days_since_dressing") or 0
        )

        area_progression = []
        granulation_progression = []
        slough_progression = []
        status_progression = []

        for item in sorted_history:
            day_label = f"Day {item.get('days_since_dressing', 0)}" if item.get('days_since_dressing') is not None else item.get('capture_date', '')
            area_cm2 = float(item.get("wound_area_cm2") or item.get("estimated_area_cm2") or 0.0)
            gran_pct = float(item.get("color_granulation_pct") or item.get("granulation_pct") or 0.0)
            slough_pct = float(item.get("color_slough_pct") or item.get("slough_pct") or 0.0)
            
            area_progression.append({"label": day_label, "area_cm2": area_cm2, "date": item.get("capture_date")})
            granulation_progression.append({"label": day_label, "granulation_pct": gran_pct, "date": item.get("capture_date")})
            slough_progression.append({"label": day_label, "slough_pct": slough_pct, "date": item.get("capture_date")})
            status_progression.append({"label": day_label, "status": item.get("monitoring_status") or item.get("status")})

        first_point = sorted_history[0]
        latest_point = sorted_history[-1]

        first_area = float(first_point.get("wound_area_cm2") or first_point.get("estimated_area_cm2") or 0.0)
        latest_area = float(latest_point.get("wound_area_cm2") or latest_point.get("estimated_area_cm2") or 0.0)

        overall_reduction_pct = 0.0
        if first_area > 0:
            overall_reduction_pct = round(((first_area - latest_area) / first_area) * 100, 1)

        # Healing velocity
        days_span = max(1, int(latest_point.get("days_since_dressing", 1) - first_point.get("days_since_dressing", 0)))
        velocity = round((first_area - latest_area) / days_span, 3)

        if overall_reduction_pct > 25.0:
            trajectory = f"Positive healing progression: {overall_reduction_pct}% area contraction observed over {days_span} days."
        elif overall_reduction_pct > 0:
            trajectory = f"Gradual healing progression: {overall_reduction_pct}% area reduction over {days_span} days."
        elif overall_reduction_pct == 0:
            trajectory = f"Stable wound dimensions across {days_span} days."
        else:
            trajectory = f"Wound area increased by {abs(overall_reduction_pct)}% across {days_span} days. Clinical review advised."

        return {
            "total_points": len(sorted_history),
            "days_monitored": days_span,
            "baseline_area_cm2": first_area,
            "latest_area_cm2": latest_area,
            "overall_area_reduction_pct": overall_reduction_pct,
            "healing_velocity_cm2_per_day": velocity,
            "area_progression": area_progression,
            "granulation_progression": granulation_progression,
            "slough_progression": slough_progression,
            "status_progression": status_progression,
            "trajectory_assessment": trajectory
        }
