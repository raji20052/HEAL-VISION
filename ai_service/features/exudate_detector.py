"""Exudate and Fluid Pattern Detection Module for Biopolymer Dressings.
Detects specular reflectance patterns, fluid pooling, and moisture accumulation beneath transparent biopolymer dressings.
"""

from typing import Dict, Any
import cv2
import numpy as np


class ExudateDetector:
    """Estimates visible exudate and fluid accumulation beneath biopolymer dressings."""

    @classmethod
    def detect_exudate(cls, image: np.ndarray, wound_mask: np.ndarray) -> Dict[str, Any]:
        """Detects fluid-like glistening and moisture accumulation within the wound bed."""
        total_wound_pixels = int(np.sum(wound_mask > 0))
        if total_wound_pixels == 0:
            return {
                "exudate_level": "None",
                "exudate_area_pct": 0.0,
                "fluid_pooling_detected": False,
                "confidence": 0.0,
                "visual_indicator_note": "No wound bed detected to evaluate fluid."
            }

        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        hue = hsv[:, :, 0]
        
        in_wound = wound_mask > 0
        
        # 1. Specular glistening on fluid surface:
        # High brightness (val > 215) with low/medium saturation (sat < 90) inside the wound
        glistening_mask = in_wound & (val > 215) & (sat < 95)
        
        # 2. Yellow/Amber viscous fluid pooling:
        # Hue between 15 and 38, high saturation (> 80), brightness > 100
        serous_fluid_mask = in_wound & (hue >= 15) & (hue <= 38) & (sat > 80) & (val > 100)
        
        combined_fluid_mask = glistening_mask | serous_fluid_mask
        
        # Apply morphological smoothing to capture coalesced fluid pools
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fluid_morphed = cv2.morphologyEx(combined_fluid_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        
        fluid_pixel_count = int(np.sum(fluid_morphed > 0))
        fluid_ratio = float(fluid_pixel_count / total_wound_pixels)
        fluid_pct = round(fluid_ratio * 100, 1)
        
        # Determine categorical exudate level
        if fluid_pct < 4.0:
            exudate_level = "None"
            pooling = False
            note = "Minimal or no visible fluid accumulation under dressing."
        elif fluid_pct < 15.0:
            exudate_level = "Low"
            pooling = False
            note = "Slight moisture / low serous fluid present, expected for moist wound healing under biopolymer dressing."
        elif fluid_pct < 32.0:
            exudate_level = "Moderate"
            pooling = True
            note = "Moderate fluid pooling visible. Monitor for dressing saturation or strike-through."
        else:
            exudate_level = "High"
            pooling = True
            note = "Significant fluid accumulation detected beneath dressing. Dressing change or clinical review may be warranted if accompanied by swelling or discomfort."

        return {
            "exudate_level": exudate_level,
            "exudate_area_pct": fluid_pct,
            "fluid_pooling_detected": pooling,
            "confidence": round(min(0.95, 0.70 + (fluid_ratio * 0.5)), 2),
            "visual_indicator_note": note
        }
