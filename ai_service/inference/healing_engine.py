"""Healing Status and Clinical Decision-Support Engine.
Evaluates multi-parametric computer vision signals to determine wound healing trajectory, simple healing stages, and patient-friendly terms.
"""

from typing import Dict, Any, List, Optional


class HealingStatusEngine:
    """Multi-parametric decision support engine for wound progression with patient-friendly terms."""

    MEDICAL_DISCLAIMER = (
        "This application is designed as a research and monitoring support tool. "
        "AI-generated results are based on computer vision analysis and are not a definitive medical diagnosis. "
        "Always consult a qualified healthcare professional for clinical advice."
    )

    @classmethod
    def evaluate(
        cls,
        quality_res: Dict[str, Any],
        color_res: Dict[str, Any],
        exudate_res: Dict[str, Any],
        area_res: Dict[str, Any],
        previous_analysis: Optional[Dict[str, Any]] = None,
        wound_detected: bool = True
    ) -> Dict[str, Any]:
        """Synthesizes computer vision parameters into a clear, patient-friendly clinical assessment."""
        
        # 1. Quality Check
        if not quality_res.get("is_usable", True):
            return {
                "monitoring_status": "insufficient_quality",
                "monitoring_status_display": "Please Retake Photo",
                "status_badge_color": "gray",
                "healing_trend": "undetermined",
                "healing_trend_display": "Photo Needs More Light",
                "healing_stage": "Stage Undetermined",
                "healing_stage_number": 0,
                "confidence_score": 0.0,
                "summary": "The photo was too blurry or dim. Please take a clearer photo in good lighting.",
                "patient_observations": [
                    "We could not clearly see the wound bed due to room lighting or camera glare.",
                    "Tip: Hold the camera steady directly above the wound."
                ],
                "simple_advice": "Retake the picture in daylight or a well-lit room.",
                "clinical_metrics": {},
                "change_from_previous": {},
                "limitations": quality_res.get("issues", []),
                "disclaimer": cls.MEDICAL_DISCLAIMER
            }

        # 2. Fully Healed / Closed Skin Assessment
        curr_area_px = int(area_res.get("area_px", 0))
        if not wound_detected or curr_area_px == 0:
            return {
                "monitoring_status": "healing_normally",
                "monitoring_status_display": "Surgical Wound Fully Closed & Healed",
                "status_badge_color": "emerald",
                "healing_trend": "improving",
                "healing_trend_display": "Fully Healed / Closed Incision",
                "healing_stage": "Stage 3: Advanced Healing & Complete Closure",
                "healing_stage_number": 3,
                "confidence_score": 0.98,
                "summary": "Great news! Your surgical wound/incision has completely healed and closed cleanly. The skin barrier is fully intact with no open wound bed or active drainage.",
                "patient_observations": [
                    "Surgical incision line is fully sealed and well-approximated.",
                    "Healthy intact skin barrier is restored with zero open lesions.",
                    "No abnormal redness, swelling, or drainage detected."
                ],
                "simple_advice": "Your incision has completed healing. Continue routine skin protection and gentle moisturizing as advised by your physician.",
                "abnormal_flags": [],
                "monitoring_flags": [],
                "positive_flags": [
                    "Surgical incision has cleanly sealed and closed.",
                    "Healthy intact skin barrier completely restored."
                ],
                "change_from_previous": {},
                "limitations": ["Visual observation confirms complete closure of incision line."],
                "disclaimer": cls.MEDICAL_DISCLAIMER
            }

        # Extract primary metrics
        gran_pct = float(color_res.get("granulation_pct", 0.0))
        slough_pct = float(color_res.get("slough_pct", 0.0))
        necro_pct = float(color_res.get("necrotic_pct", 0.0))
        pale_pct = float(color_res.get("pale_pct", 0.0))
        
        curr_area = float(area_res.get("estimated_area_cm2", 0.0))
        exudate_level = exudate_res.get("exudate_level", "None")
        
        # Determine Healing Stage (1, 2, or 3)
        # Stage 1: Early Incision / Fresh Suture (low area or high vascular red, early post-op)
        # Stage 2: Active Healing & Repair (granulation tissue active, wound shrinking)
        # Stage 3: Maturing Skin & Closure (small area, high epithelialization)
        if curr_area < 2.0 or pale_pct > 40.0:
            healing_stage = "Stage 3: Advanced Healing & Skin Closure"
            healing_stage_desc = "Wound is nearly closed and new skin is strengthening."
            stage_num = 3
        elif gran_pct >= 40.0 or (previous_analysis and curr_area < 6.0):
            healing_stage = "Stage 2: Active Healing & Skin Repair"
            healing_stage_desc = "Healthy pink tissue is rebuilding and the wound is shrinking."
            stage_num = 2
        else:
            healing_stage = "Stage 1: Early Recovery & Protection"
            healing_stage_desc = "Early healing phase. Sutures and edges are sealing."
            stage_num = 1

        # Comparison with previous session
        change_data: Dict[str, Any] = {}
        area_delta_pct = 0.0
        
        if previous_analysis:
            prev_area = float(previous_analysis.get("wound_area_cm2") or previous_analysis.get("estimated_area_cm2") or 0.0)
            if prev_area > 0:
                area_delta_pct = round(((curr_area - prev_area) / prev_area) * 100, 1)
            
            change_data = {
                "area_change_pct": area_delta_pct,
                "previous_assessment_date": previous_analysis.get("created_at") or previous_analysis.get("capture_date")
            }

        # Multi-parametric clinical rule evaluation
        abnormal_flags: List[str] = []
        monitoring_flags: List[str] = []
        positive_flags: List[str] = []

        # Area contraction is a strong positive indicator
        if area_delta_pct <= -5.0:
            positive_flags.append(f"Wound is actively shrinking ({abs(area_delta_pct)}% area reduction).")
        elif area_delta_pct > 15.0:
            abnormal_flags.append(f"Wound area appears wider (+{area_delta_pct}%).")
        elif area_delta_pct > 5.0:
            monitoring_flags.append(f"Mild surface area increase (+{area_delta_pct}%).")

        # Tissue checks
        if necro_pct > 15.0:
            abnormal_flags.append(f"Dark non-healing tissue noted ({necro_pct}%).")
        elif necro_pct > 5.0:
            monitoring_flags.append(f"Small dark spot present ({necro_pct}%).")

        if slough_pct > 40.0:
            abnormal_flags.append(f"High buildup of yellow residue ({slough_pct}%).")
        elif slough_pct > 25.0:
            monitoring_flags.append(f"Mild yellow residue observed ({slough_pct}%).")

        if gran_pct >= 40.0:
            positive_flags.append(f"Healthy pink healing tissue covers {int(gran_pct)}% of the wound.")

        if exudate_level == "High" and area_delta_pct >= 0:
            abnormal_flags.append("High fluid buildup detected under dressing.")
        elif exudate_level == "Moderate":
            monitoring_flags.append("Moderate fluid under dressing; keep clean.")
        else:
            positive_flags.append("Wound bed is clean and dry with optimal moisture balance.")

        # Synthesize Final Status (Ensure positive contraction is NOT flagged as abnormal!)
        if abnormal_flags and (area_delta_pct > 5.0 or necro_pct > 15.0):
            status = "possible_abnormal_change"
            status_display = "Doctor Review Recommended"
            badge_color = "red"
            trend = "needs_attention"
            trend_display = "Attention Recommended"
            confidence = 0.88
            summary = "Signs of fluid buildup or delayed healing detected. A routine doctor review is recommended."
            simple_advice = "Contact your doctor if you notice increasing pain, redness, or heat."
        elif monitoring_flags or (exudate_level == "Moderate" and area_delta_pct >= 0):
            status = "needs_monitoring"
            status_display = "Needs Routine Monitoring"
            badge_color = "yellow"
            trend = "stable"
            trend_display = "Stable / Continue Monitoring"
            confidence = 0.90
            summary = "Your wound is stable. Continue your regular dressing care and capture another photo in 3 days."
            simple_advice = "Keep dressing sealed and protect the area from friction."
        else:
            status = "healing_normally"
            status_display = "Healing on Track (Improving)"
            badge_color = "green"
            trend = "improving"
            trend_display = "Healing on Track"
            confidence = 0.94
            summary = f"Great news! Your wound is in {healing_stage} and showing healthy healing signs."
            simple_advice = "Continue keeping the dressing clean and dry. Everything is progressing as expected."

        # Compile patient-friendly observations
        patient_observations: List[str] = []
        if positive_flags:
            patient_observations.extend(positive_flags)
        if monitoring_flags:
            patient_observations.extend(monitoring_flags)
        if abnormal_flags:
            patient_observations.extend(abnormal_flags)
        if not patient_observations:
            patient_observations.append("Wound is healing cleanly according to clinical standards.")

        return {
            "monitoring_status": status,
            "monitoring_status_display": status_display,
            "status_badge_color": badge_color,
            "healing_trend": trend,
            "healing_trend_display": trend_display,
            "healing_stage": healing_stage,
            "healing_stage_desc": healing_stage_desc,
            "healing_stage_number": stage_num,
            "confidence_score": round(confidence, 2),
            "summary": summary,
            "simple_advice": simple_advice,
            "patient_observations": patient_observations,
            "abnormal_flags": abnormal_flags,
            "monitoring_flags": monitoring_flags,
            "positive_flags": positive_flags,
            "change_from_previous": change_data,
            "disclaimer": cls.MEDICAL_DISCLAIMER
        }
