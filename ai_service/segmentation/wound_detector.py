"""Wound Bed and Biopolymer Dressing Segmentation Module.
Accurately detects skin context and isolates genuine wound lesions, surgical incisions, and granulation tissue.
Prevents surrounding intact healthy skin from being falsely detected as wound tissue.
"""

from typing import Dict, Any, Tuple, Optional
import cv2
import numpy as np


class WoundDetector:
    """Performs biological tissue validation and high-precision color/contrast segmentation of wound lesions."""

    @classmethod
    def segment_wound(cls, image: np.ndarray) -> Dict[str, Any]:
        """Segments the actual wound bed or surgical incision from surrounding intact skin background."""
        height, width = image.shape[:2]
        total_pixels = height * width

        # 1. Biological Tissue Verification (Human Skin & Vascular Tissue)
        b = image[:, :, 0].astype(float)
        g = image[:, :, 1].astype(float)
        r = image[:, :, 2].astype(float)

        # Skin Chromaticity Range
        rgb_skin = (
            (r > 50) & (g > 30) & (b > 15) & 
            (r > g) & ((r - g) >= 8) & 
            (r > b) & ((r - b) >= 10)
        )

        ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]
        ycrcb_skin = (cr >= 132) & (cr <= 185) & (cb >= 75) & (cb <= 140)

        # Deep active vascular tissue
        vascular_red = (r >= 135) & (r > (g + 25)) & (r > (b + 25))

        bio_tissue_mask = ((rgb_skin & ycrcb_skin) | vascular_red).astype(np.uint8)
        bio_pixel_count = int(np.sum(bio_tissue_mask > 0))
        bio_ratio = bio_pixel_count / total_pixels

        if bio_ratio < 0.025:
            return cls._empty_detection(image, width, height, "No biological skin or wound tissue detected.")

        # 2. Advanced Multi-Space Contrast Extraction
        smooth = cv2.bilateralFilter(image, d=7, sigmaColor=50, sigmaSpace=50)
        
        # LAB color space: a* strictly represents red/green chromaticity (erythema / granulation)
        lab = cv2.cvtColor(smooth, cv2.COLOR_BGR2LAB)
        l_chan, a_chan, b_chan = cv2.split(lab)

        # HSV color space
        hsv = cv2.cvtColor(smooth, cv2.COLOR_BGR2HSV)
        h_chan, s_chan, v_chan = cv2.split(hsv)

        # Compute background healthy skin statistics
        bio_a_pixels = a_chan[bio_tissue_mask > 0]
        bio_l_pixels = l_chan[bio_tissue_mask > 0]
        
        skin_a_median = float(np.median(bio_a_pixels)) if len(bio_a_pixels) > 0 else 128.0
        skin_a_std = float(np.std(bio_a_pixels)) if len(bio_a_pixels) > 0 else 10.0
        skin_l_median = float(np.median(bio_l_pixels)) if len(bio_l_pixels) > 0 else 128.0

        # 3. Targeted Wound Component Detection:
        
        # A. Active Erythema / Granulation Bed (Significantly elevated a* above surrounding skin median)
        if skin_a_median > 145.0:
            a_threshold = 145.0
        else:
            a_threshold = max(145.0, skin_a_median + 1.2 * skin_a_std)
        erythema_mask = (a_chan >= a_threshold) & (bio_tissue_mask > 0)

        # B. Surgical Incision / Suture Line / Deep Scab (Darker contrast with distinct red/dark edge)
        # Luminance distinctly darker than surrounding skin + nearby biological context
        dark_incision_mask = (l_chan <= (skin_l_median - 28)) & (bio_tissue_mask > 0) & (v_chan < 160)

        # C. True Pathological Slough (High yellow saturation distinct from normal pale skin)
        # Normal skin has Hue 18-35 but Saturation 30-70. Real slough is thick/opaque yellow-green (Hue 22-45, Sat > 95, Val > 80)
        true_slough_mask = (h_chan >= 22) & (h_chan <= 45) & (s_chan > 105) & (v_chan > 80) & (bio_tissue_mask > 0)

        # D. Dark Necrotic Eschar (Very low brightness inside biological skin)
        dark_eschar_mask = (v_chan < 40) & (bio_tissue_mask > 0)

        # Combine true lesion components
        wound_candidate = (erythema_mask | dark_incision_mask | true_slough_mask | dark_eschar_mask).astype(np.uint8) * 255

        # 4. Morphological Refinement: Bridge incision lines, remove isolated skin noise
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        morphed = cv2.morphologyEx(wound_candidate, cv2.MORPH_CLOSE, kernel_close)
        morphed = cv2.morphologyEx(morphed, cv2.MORPH_OPEN, kernel_open)

        # 5. Connected Component Analysis
        contours, _ = cv2.findContours(morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        min_area = total_pixels * 0.0015  # Minimum 0.15% of image area (handles fine surgical incisions)
        max_area = total_pixels * 0.70    # Maximum 70%

        valid_contours = [c for c in contours if min_area <= cv2.contourArea(c) <= max_area]

        # If no distinct wound lesion contrast found on intact skin
        if not valid_contours:
            # Check for central surgical incision using gradient magnitude
            gray = cv2.cvtColor(smooth, cv2.COLOR_BGR2GRAY)
            grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            grad_mag = cv2.magnitude(grad_x, grad_y)
            grad_thresh = float(np.percentile(grad_mag, 96))
            edge_lesion = ((grad_mag > grad_thresh) & (bio_tissue_mask > 0) & (l_chan < skin_l_median)).astype(np.uint8) * 255
            edge_morphed = cv2.morphologyEx(edge_lesion, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)))
            edge_contours, _ = cv2.findContours(edge_morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            valid_contours = [c for c in edge_contours if min_area <= cv2.contourArea(c) <= max_area]

        if not valid_contours:
            return cls._empty_detection(image, width, height, "No active wound lesion or broken skin detected.")

        # Aggregate the primary wound region
        mask = np.zeros((height, width), dtype=np.uint8)
        
        # Sort contours by distance to center of image & area to prioritize the central wound
        img_center = np.array([width / 2.0, height / 2.0])
        
        def contour_score(cnt):
            area = cv2.contourArea(cnt)
            M = cv2.moments(cnt)
            if M["m00"] > 0:
                cx = M["m10"] / M["m00"]
                cy = M["m01"] / M["m00"]
                dist = np.linalg.norm(np.array([cx, cy]) - img_center)
            else:
                dist = width
            # Higher area, lower distance to center
            return area / (1.0 + (dist / width) * 2.0)

        valid_contours.sort(key=contour_score, reverse=True)
        primary_contour = valid_contours[0]
        cv2.drawContours(mask, [primary_contour], -1, 255, thickness=-1)

        # Include adjacent satellite fragments within reasonable proximity of primary
        M_prim = cv2.moments(primary_contour)
        if M_prim["m00"] > 0:
            prim_center = np.array([M_prim["m10"] / M_prim["m00"], M_prim["m01"] / M_prim["m00"]])
            for c in valid_contours[1:]:
                M_c = cv2.moments(c)
                if M_c["m00"] > 0:
                    c_center = np.array([M_c["m10"] / M_c["m00"], M_c["m01"] / M_c["m00"]])
                    dist = np.linalg.norm(c_center - prim_center)
                    if dist < (width * 0.35) and cv2.contourArea(c) > min_area:
                        cv2.drawContours(mask, [c], -1, 255, thickness=-1)

        # Final smooth mask
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
        final_contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not final_contours:
            return cls._empty_detection(image, width, height, "No wound contours resolved.")

        main_contour = max(final_contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(main_contour)
        area_px = int(np.sum(mask > 0))
        perimeter_px = float(cv2.arcLength(main_contour, True))
        hull = cv2.convexHull(main_contour)
        solidity = float(area_px / cv2.contourArea(hull)) if cv2.contourArea(hull) > 0 else 1.0

        # Generate Visual Overlay (Emerald transparent tint with gold boundary line)
        overlay = image.copy()
        color_tint = np.zeros_like(image, dtype=np.uint8)
        color_tint[mask > 0] = [35, 185, 65]  # Emerald green tint
        alpha = 0.30
        cv2.addWeighted(color_tint, alpha, overlay, 1 - alpha, 0, overlay)
        cv2.drawContours(overlay, final_contours, -1, (0, 240, 255), 2, cv2.LINE_AA)

        return {
            "wound_detected": True,
            "mask": mask,
            "overlay_image": overlay,
            "bounding_box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "area_px": area_px,
            "perimeter_px": round(perimeter_px, 1),
            "solidity": round(solidity, 3),
            "image_dimensions": {"width": width, "height": height}
        }

    @classmethod
    def _empty_detection(cls, image: np.ndarray, width: int, height: int, reason: str) -> Dict[str, Any]:
        """Returns clean empty detection without false-positive wound masks."""
        return {
            "wound_detected": False,
            "detection_message": reason,
            "mask": np.zeros((height, width), dtype=np.uint8),
            "overlay_image": image.copy(),
            "bounding_box": {"x": 0, "y": 0, "width": 0, "height": 0},
            "area_px": 0,
            "perimeter_px": 0.0,
            "solidity": 1.0,
            "image_dimensions": {"width": width, "height": height}
        }
