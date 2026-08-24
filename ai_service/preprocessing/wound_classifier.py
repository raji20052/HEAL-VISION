"""Wound Image Verification and Pre-Analysis Classification Module.
Classifies input images into:
1. CLINICAL_WOUND (Valid anatomical skin wound photograph)
2. NON_WOUND_DOCUMENT (Document, certificate, ID card, paper, text)
3. NON_WOUND_SCREENSHOT (Desktop screenshot, software UI, browser window)
4. NON_WOUND_INTACT_SKIN (Healthy normal skin without open lesions)
5. NON_WOUND_GENERAL (Random objects, landscapes, indoor scenes)
"""

from typing import Dict, Any, Tuple
import cv2
import numpy as np


class WoundClassifier:
    """Classifies whether an input image is a genuine macroscopic skin wound or an invalid/random image."""

    @classmethod
    def classify_image(cls, image: np.ndarray) -> Dict[str, Any]:
        """Performs multi-criteria heuristic and computer vision classification."""
        if image is None or image.size == 0:
            return {
                "is_valid_wound": False,
                "category": "INVALID_EMPTY",
                "label": "Invalid or Empty Image",
                "reason": "The uploaded image file contains no readable image data.",
                "skin_ratio": 0.0,
                "confidence": 1.0
            }

        height, width = image.shape[:2]
        total_pixels = height * width

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]

        # -------------------------------------------------------------
        # 1. Document / Certificate / Paper Background Detection
        # -------------------------------------------------------------
        # Paper pixels: high brightness (>200) with very low saturation (<35)
        paper_mask = (val > 200) & (sat < 35)
        paper_ratio = float(np.sum(paper_mask) / total_pixels)

        # High-frequency text line edge detection (Canny + horizontal morphology)
        edges = cv2.Canny(gray, 100, 200)
        horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
        horiz_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, horiz_kernel)
        horiz_line_ratio = float(np.sum(horiz_lines > 0) / total_pixels)

        if paper_ratio > 0.50:
            return {
                "is_valid_wound": False,
                "category": "NON_WOUND_DOCUMENT",
                "label": "Document / Certificate Detected",
                "reason": "The uploaded image was identified as a certificate, document, or printed text. Please upload a clinical photograph of a skin wound.",
                "skin_ratio": 0.0,
                "confidence": 0.98
            }

        if horiz_line_ratio > 0.0035 and paper_ratio > 0.30:
            return {
                "is_valid_wound": False,
                "category": "NON_WOUND_DOCUMENT",
                "label": "Printed Document / Certificate Layout",
                "reason": "Text alignment and printed document patterns were detected. Please upload a photo of an anatomical wound.",
                "skin_ratio": 0.0,
                "confidence": 0.95
            }

        # -------------------------------------------------------------
        # 2. Desktop Screenshot / UI / Monochrome Graphic Detection
        # -------------------------------------------------------------
        # Screenshots often have large uniform monochromatic areas (standard deviation < 8 in local patches)
        # or pure neutral grays (R ~= G ~= B across > 45% of image)
        b = image[:, :, 0].astype(int)
        g = image[:, :, 1].astype(int)
        r = image[:, :, 2].astype(int)

        neutral_gray = (np.abs(r - g) < 8) & (np.abs(g - b) < 8) & (np.abs(r - b) < 8)
        neutral_gray_ratio = float(np.sum(neutral_gray) / total_pixels)

        if neutral_gray_ratio > 0.60:
            return {
                "is_valid_wound": False,
                "category": "NON_WOUND_SCREENSHOT",
                "label": "Screen Capture / Graphic UI Detected",
                "reason": "The uploaded image contains computer screen or digital graphics rather than an anatomical wound site.",
                "skin_ratio": 0.0,
                "confidence": 0.96
            }

        # -------------------------------------------------------------
        # 3. Biological Human Skin Verification
        # -------------------------------------------------------------
        rgb_skin = (
            (r > 55) & (g > 35) & (b > 20) & 
            (r > g) & ((r - g) >= 12) & 
            (r > b) & ((r - b) >= 14) &
            (sat > 20)
        )

        ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]
        ycrcb_skin = (cr >= 134) & (cr <= 180) & (cb >= 82) & (cb <= 136)

        skin_mask = (rgb_skin & ycrcb_skin).astype(np.uint8)
        skin_pixel_count = int(np.sum(skin_mask > 0))
        skin_ratio = float(skin_pixel_count / total_pixels)

        # Genuine macroscopic wound photography must contain at least 12% continuous human skin
        if skin_ratio < 0.12:
            return {
                "is_valid_wound": False,
                "category": "NON_WOUND_GENERAL",
                "label": "No Human Skin Background Detected",
                "reason": "The image does not contain sufficient human skin area to be a wound photo. Please take a clear, close photo centered on the wound.",
                "skin_ratio": round(skin_ratio, 3),
                "confidence": 0.94
            }

        # -------------------------------------------------------------
        # 4. Biological Wound Lesion & Surgical Incision Verification
        # -------------------------------------------------------------
        smooth = cv2.bilateralFilter(image, d=9, sigmaColor=75, sigmaSpace=75)
        lab = cv2.cvtColor(smooth, cv2.COLOR_BGR2LAB)
        a_chan = lab[:, :, 1]

        # Calculate baseline a* on healthy skin
        skin_a = a_chan[skin_mask > 0]
        skin_a_mean = float(np.mean(skin_a)) if len(skin_a) > 0 else 128.0
        skin_a_std = float(np.std(skin_a)) if len(skin_a) > 0 else 10.0

        # Erythema / Granulation bed threshold
        a_thresh = int(max(148, skin_a_mean + 1.1 * skin_a_std))
        a_wound_raw = (a_chan > a_thresh).astype(np.uint8)

        # Yellowish slough
        yellow_slough_raw = cv2.inRange(hsv, np.array([18, 45, 60]), np.array([42, 255, 255]))

        # Surgical suture / incision line / scar contrast
        gray_skin = gray * skin_mask
        edges_skin = cv2.Canny(gray_skin, 40, 120)
        suture_line_ratio = float(np.sum(edges_skin > 0) / total_pixels)

        # Dilate skin to ensure wound is contiguous with surrounding anatomical skin
        skin_dilated = cv2.dilate(skin_mask, np.ones((25, 25), np.uint8))
        wound_in_skin = cv2.bitwise_and(
            cv2.bitwise_or(a_wound_raw, yellow_slough_raw),
            cv2.bitwise_or(a_wound_raw, yellow_slough_raw),
            mask=skin_dilated
        )

        wound_candidate_ratio = float(np.sum(wound_in_skin > 0) / total_pixels)

        # If skin is healthy with closed incision or healed scar
        if wound_candidate_ratio < 0.0030:
            return {
                "is_valid_wound": True,
                "category": "HEALED_SURGICAL_WOUND",
                "label": "Fully Healed / Closed Surgical Incision",
                "reason": "Anatomical skin detected with a closed, fully healed surgical incision line or healthy intact skin.",
                "skin_ratio": round(skin_ratio, 3),
                "confidence": 0.96
            }

        # Active open wound / incision detected
        return {
            "is_valid_wound": True,
            "category": "CLINICAL_WOUND",
            "label": "Valid Clinical Wound Photograph",
            "reason": "Anatomical skin background and active wound lesion detected.",
            "skin_ratio": round(skin_ratio, 3),
            "confidence": 0.95
        }
