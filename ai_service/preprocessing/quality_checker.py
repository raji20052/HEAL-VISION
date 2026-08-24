"""Image Quality Assessment Module.
Evaluates sharpness (Laplacian blur), illumination/exposure, contrast, glare on biopolymer dressing, and framing.
"""

from typing import Dict, Any, List, Tuple
import cv2
import numpy as np


class ImageQualityChecker:
    """Evaluates optical image quality for wound assessment."""

    BLUR_THRESHOLD_FAIL = 40.0
    BLUR_THRESHOLD_WARN = 90.0
    
    BRIGHTNESS_MIN = 45.0
    BRIGHTNESS_MAX = 225.0
    
    CONTRAST_MIN = 25.0
    GLARE_MAX_RATIO = 0.18  # Max acceptable specular reflection ratio on biopolymer dressing

    @classmethod
    def evaluate_image(cls, image: np.ndarray) -> Dict[str, Any]:
        """Runs multi-factor quality inspection on a BGR image array."""
        if image is None or image.size == 0:
            return {
                "status": "FAIL",
                "score": 0.0,
                "is_usable": False,
                "issues": ["Image data is empty or invalid."],
                "metrics": {},
                "patient_guidance": "Please select or capture a valid image file."
            }

        height, width = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 1. Sharpness / Blur Detection via Laplacian variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        
        # 2. Brightness & Exposure (mean luminance)
        mean_brightness = float(np.mean(gray))
        
        # 3. RMS Contrast
        contrast = float(np.std(gray))
        
        # 4. Glare detection (often caused by camera flash on transparent biopolymer dressings)
        # Saturated white specular pixels (V > 245 and S < 30 in HSV)
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        glare_mask = (val > 245) & (sat < 35)
        glare_ratio = float(np.sum(glare_mask) / (height * width))
        
        # 5. Aspect & Resolution check
        min_dim = min(height, width)
        
        # Score calculation & Issue identification
        issues: List[str] = []
        guidance: List[str] = []
        penalty = 0.0
        
        # Sharpness assessment
        if laplacian_var < cls.BLUR_THRESHOLD_FAIL:
            issues.append("Excessive motion blur or out of focus.")
            guidance.append("Hold camera steady or use tap-to-focus.")
            penalty += 45.0
        elif laplacian_var < cls.BLUR_THRESHOLD_WARN:
            issues.append("Mild blur detected.")
            guidance.append("Ensure camera is focused directly on the wound bed.")
            penalty += 15.0
            
        # Brightness assessment
        if mean_brightness < cls.BRIGHTNESS_MIN:
            issues.append("Image is too dark / underexposed.")
            guidance.append("Move to a well-lit area or turn on ambient room lights.")
            penalty += 35.0
        elif mean_brightness > cls.BRIGHTNESS_MAX:
            issues.append("Image is overexposed / washed out.")
            guidance.append("Reduce harsh direct light.")
            penalty += 35.0
            
        # Contrast assessment
        if contrast < cls.CONTRAST_MIN:
            issues.append("Low contrast / washed out details.")
            guidance.append("Improve lighting angle.")
            penalty += 20.0
            
        # Glare assessment on transparent biopolymer dressing
        if glare_ratio > cls.GLARE_MAX_RATIO:
            issues.append("High glare/flash reflection on transparent dressing.")
            guidance.append("Turn off camera flash and angle the camera slightly to avoid direct reflection on the dressing.")
            penalty += 25.0
            
        # Dimension assessment
        if min_dim < 200:
            issues.append("Resolution is too low for granular tissue assessment.")
            guidance.append("Capture at higher camera resolution.")
            penalty += 25.0

        raw_score = max(0.0, 100.0 - penalty)
        
        if penalty >= 45.0:
            status = "FAIL"
            is_usable = False
        elif penalty > 10.0:
            status = "WARNING"
            is_usable = True
        else:
            status = "PASS"
            is_usable = True

        patient_message = " ".join(guidance) if guidance else "Image quality is good for visual assessment."

        return {
            "status": status,
            "score": round(raw_score, 1),
            "is_usable": is_usable,
            "issues": issues,
            "metrics": {
                "blur_score": round(laplacian_var, 2),
                "brightness": round(mean_brightness, 2),
                "contrast": round(contrast, 2),
                "glare_ratio_pct": round(glare_ratio * 100, 2),
                "resolution": f"{width}x{height}"
            },
            "patient_guidance": patient_message
        }
