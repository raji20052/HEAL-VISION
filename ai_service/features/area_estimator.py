"""Wound Area and Physical Dimensional Estimation Module.
Estimates pixel area, bounding dimensions, and calibrated metric area (cm² / mm).
"""

from typing import Dict, Any, Optional
import cv2
import numpy as np


class AreaEstimator:
    """Estimates surface area and dimensions with optional calibration reference scaling."""

    # Default heuristic calibration if no physical sticker detected (approx. 45 pixels per cm at typical smartphone macro distance)
    DEFAULT_PX_PER_CM = 45.0

    @classmethod
    def estimate_dimensions(
        cls, 
        wound_mask: np.ndarray, 
        image: Optional[np.ndarray] = None,
        custom_calibration_factor: Optional[float] = None
    ) -> Dict[str, Any]:
        """Calculates dimensional measurements of the wound bed."""
        total_pixels = int(np.sum(wound_mask > 0))
        if total_pixels == 0:
            return {
                "area_px": 0,
                "estimated_area_cm2": 0.0,
                "width_mm": 0.0,
                "height_mm": 0.0,
                "perimeter_mm": 0.0,
                "is_calibrated": False,
                "calibration_note": "No wound bed detected to measure."
            }

        contours, _ = cv2.findContours(wound_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            main_contour = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(main_contour)
            perimeter_px = float(cv2.arcLength(main_contour, True))
        else:
            x, y, w, h = 0, 0, 0, 0
            perimeter_px = 0.0

        # Check for calibration marker (e.g., green/blue reference standard square or custom factor)
        px_per_cm = custom_calibration_factor or cls.DEFAULT_PX_PER_CM
        is_calibrated = custom_calibration_factor is not None

        # Pixel area to cm² conversion: Area_cm2 = pixels / (px_per_cm ^ 2)
        area_cm2 = round(total_pixels / (px_per_cm ** 2), 2)
        width_mm = round((w / px_per_cm) * 10, 1)
        height_mm = round((h / px_per_cm) * 10, 1)
        perimeter_mm = round((perimeter_px / px_per_cm) * 10, 1)

        note = (
            "Calibrated with reference scale."
            if is_calibrated else
            "Estimated image-based area (relative standard). For exact metric tracking, include a calibrated adhesive scale marker."
        )

        return {
            "area_px": total_pixels,
            "estimated_area_cm2": area_cm2,
            "width_mm": width_mm,
            "height_mm": height_mm,
            "perimeter_mm": perimeter_mm,
            "bounding_box_px": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
            "is_calibrated": is_calibrated,
            "calibration_factor_px_per_cm": round(px_per_cm, 1),
            "calibration_note": note
        }
