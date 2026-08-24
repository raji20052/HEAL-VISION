"""Tissue Color Spectrum and Composition Analysis Module.
Quantifies Granulation (Red/Pink), Slough (Yellow), Necrotic (Black/Dark), and Epithelial/Pale tissue within the segmented wound bed.
"""

from typing import Dict, Any, Tuple
import cv2
import numpy as np


class TissueColorAnalyzer:
    """Classifies tissue types based on colorimetry in HSV and CIELAB spaces."""

    @classmethod
    def analyze_colors(cls, image: np.ndarray, wound_mask: np.ndarray) -> Dict[str, Any]:
        """Analyzes color distribution within the wound mask and generates a segmented tissue heatmap."""
        total_wound_pixels = int(np.sum(wound_mask > 0))
        if total_wound_pixels == 0:
            return {
                "granulation_pct": 0.0,
                "slough_pct": 0.0,
                "necrotic_pct": 0.0,
                "pale_pct": 0.0,
                "primary_tissue": "Unknown",
                "tissue_health_score": 0.0,
                "heatmap_image": image.copy()
            }

        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        
        h_chan, s_chan, v_chan = cv2.split(hsv)
        l_chan, a_chan, b_chan = cv2.split(lab)
        
        # Binary masks initialized
        height, width = image.shape[:2]
        necrotic_mask = np.zeros((height, width), dtype=bool)
        slough_mask = np.zeros((height, width), dtype=bool)
        granulation_mask = np.zeros((height, width), dtype=bool)
        pale_mask = np.zeros((height, width), dtype=bool)
        
        in_wound = wound_mask > 0
        
        # 1. Necrotic / Eschar: Very dark pixels or dull grey-black eschar
        necrotic_cond = in_wound & (v_chan < 55)
        necrotic_mask[necrotic_cond] = True
        
        # 2. Slough / Fibrin: Yellowish-tan tones (Hue 18-42, Saturation > 40, Value > 60)
        slough_cond = in_wound & (~necrotic_mask) & (h_chan >= 18) & (h_chan <= 42) & (s_chan >= 40) & (v_chan >= 60)
        slough_mask[slough_cond] = True
        
        # 3. Pale / Epithelial / Macerated: High brightness, low saturation
        pale_cond = in_wound & (~necrotic_mask) & (~slough_mask) & (v_chan > 195) & (s_chan < 50)
        pale_mask[pale_cond] = True
        
        # 4. Granulation Tissue: Red, pink, healthy vascular tissue (Hue < 20 or Hue > 160, a* elevated > 145)
        granulation_cond = in_wound & (~necrotic_mask) & (~slough_mask) & (~pale_mask) & ((h_chan < 20) | (h_chan > 160) | (a_chan > 145))
        granulation_mask[granulation_cond] = True
        
        # Any remaining unassigned wound pixels defaulted to closest type based on a* channel
        unassigned = in_wound & (~necrotic_mask) & (~slough_mask) & (~pale_mask) & (~granulation_mask)
        granulation_mask[unassigned & (a_chan >= 128)] = True
        pale_mask[unassigned & (a_chan < 128)] = True

        # Calculate percentages
        granulation_count = int(np.sum(granulation_mask))
        slough_count = int(np.sum(slough_mask))
        necrotic_count = int(np.sum(necrotic_mask))
        pale_count = int(np.sum(pale_mask))
        
        gran_pct = round((granulation_count / total_wound_pixels) * 100, 1)
        slough_pct = round((slough_count / total_wound_pixels) * 100, 1)
        necro_pct = round((necrotic_count / total_wound_pixels) * 100, 1)
        pale_pct = round(max(0.0, 100.0 - (gran_pct + slough_pct + necro_pct)), 1)
        
        # Determine primary tissue presentation
        tissue_dict = {
            "Granulation (Healthy Red/Pink)": gran_pct,
            "Slough (Fibrinous Yellow)": slough_pct,
            "Necrotic (Dark/Eschar)": necro_pct,
            "Epithelial/Pale (Advancing Margin)": pale_pct
        }
        primary_tissue = max(tissue_dict, key=tissue_dict.get)
        
        # Tissue Health Score (0-100): High granulation + epithelial is good (+), slough/necrotic is penalty (-)
        health_score = max(0.0, min(100.0, (gran_pct * 1.0) + (pale_pct * 0.7) - (slough_pct * 0.8) - (necro_pct * 1.5)))

        # Generate Segmented Tissue Heatmap Image
        # Red: [30, 30, 220] (Granulation)
        # Yellow: [20, 220, 240] (Slough)
        # Dark Gray/Black: [40, 40, 40] (Necrotic)
        # Light Cyan: [240, 230, 160] (Pale/Epithelial)
        heatmap = image.copy()
        color_layer = np.zeros_like(image, dtype=np.uint8)
        
        color_layer[granulation_mask] = [35, 45, 230]   # Bright Red/Pink (BGR)
        color_layer[slough_mask] = [20, 215, 245]       # Bright Yellow/Amber
        color_layer[necrotic_mask] = [30, 30, 30]       # Dark Necrotic
        color_layer[pale_mask] = [225, 210, 140]        # Light Cyan/Epithelial
        
        # Blend 50% heatmap over original inside the wound
        blend_mask = in_wound
        heatmap[blend_mask] = cv2.addWeighted(image, 0.45, color_layer, 0.55, 0)[blend_mask]

        return {
            "granulation_pct": gran_pct,
            "slough_pct": slough_pct,
            "necrotic_pct": necro_pct,
            "pale_pct": pale_pct,
            "primary_tissue": primary_tissue,
            "tissue_health_score": round(health_score, 1),
            "heatmap_image": heatmap
        }
