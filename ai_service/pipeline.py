"""Unified Computer Vision and AI Pipeline Coordinator.
Orchestrates pre-analysis wound verification, quality assessment, wound segmentation,
colorimetric feature extraction, exudate estimation, and clinical healing status determination.
"""

from typing import Dict, Any, Optional, List, Tuple
import os
import cv2
import numpy as np

from .preprocessing.wound_classifier import WoundClassifier
from .preprocessing.quality_checker import ImageQualityChecker
from .segmentation.wound_detector import WoundDetector
from .features.color_analyzer import TissueColorAnalyzer
from .features.exudate_detector import ExudateDetector
from .features.area_estimator import AreaEstimator
from .inference.healing_engine import HealingStatusEngine
from .inference.temporal_comparator import TemporalComparator


class WoundAIPipeline:
    """End-to-end computer vision and AI analysis pipeline for biopolymer wound dressings."""

    MODEL_VERSION = "v1.2.0-biopolymer-cv-research"

    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = storage_dir or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "storage")
        )
        os.makedirs(os.path.join(self.storage_dir, "images"), exist_ok=True)
        os.makedirs(os.path.join(self.storage_dir, "masks"), exist_ok=True)
        os.makedirs(os.path.join(self.storage_dir, "overlays"), exist_ok=True)
        os.makedirs(os.path.join(self.storage_dir, "heatmaps"), exist_ok=True)

    def analyze_image_file(
        self,
        image_path: str,
        image_id: str,
        previous_analysis: Optional[Dict[str, Any]] = None,
        custom_calibration_factor: Optional[float] = None
    ) -> Dict[str, Any]:
        """Reads an image from disk, executes the full AI analysis pipeline, saves generated visual layers, and returns structured assessment."""
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image at path: {image_path}")

        return self.analyze_image_array(
            image=image,
            image_id=image_id,
            previous_analysis=previous_analysis,
            custom_calibration_factor=custom_calibration_factor
        )

    def analyze_image_array(
        self,
        image: np.ndarray,
        image_id: str,
        previous_analysis: Optional[Dict[str, Any]] = None,
        custom_calibration_factor: Optional[float] = None
    ) -> Dict[str, Any]:
        """Executes AI pipeline directly on a BGR numpy image array."""
        height, width = image.shape[:2]
        
        # 1. Wound Image Classification & Verification
        # Validates whether the image is actually a clinical wound or a document/screenshot/random image
        classification = WoundClassifier.classify_image(image)
        
        # 2. Quality Assessment
        quality_res = ImageQualityChecker.evaluate_image(image)
        
        # If the image is NOT a valid wound image (e.g. certificate, document, UI screenshot, intact skin, object)
        if not classification["is_valid_wound"]:
            healing_res = {
                "monitoring_status": "no_wound_detected",
                "monitoring_status_display": "No Active Wound Detected",
                "status_badge_color": "blue",
                "healing_trend": "stable",
                "healing_trend_display": classification["label"],
                "confidence_score": classification["confidence"],
                "summary": classification["reason"],
                "patient_observations": [
                    classification["reason"],
                    "Please ensure the camera is positioned directly over the wound under a transparent dressing with good lighting."
                ],
                "abnormal_flags": [],
                "monitoring_flags": [],
                "positive_flags": [],
                "change_from_previous": {},
                "limitations": [
                    f"Classified as: {classification['label']}.",
                    "Non-wound documents, screenshots, and non-skin subjects cannot be clinically evaluated."
                ],
                "disclaimer": HealingStatusEngine.MEDICAL_DISCLAIMER
            }

            # Save clean empty mask & original overlay
            mask_filename = f"mask_{image_id}.png"
            overlay_filename = f"overlay_{image_id}.jpg"
            heatmap_filename = f"heatmap_{image_id}.jpg"

            mask_full_path = os.path.join(self.storage_dir, "masks", mask_filename)
            overlay_full_path = os.path.join(self.storage_dir, "overlays", overlay_filename)
            heatmap_full_path = os.path.join(self.storage_dir, "heatmaps", heatmap_filename)

            empty_mask = np.zeros((height, width), dtype=np.uint8)
            cv2.imwrite(mask_full_path, empty_mask)
            cv2.imwrite(overlay_full_path, image)
            cv2.imwrite(heatmap_full_path, image)

            return {
                "model_version": self.MODEL_VERSION,
                "image_classification": classification,
                "image_quality": quality_res,
                "segmentation": {
                    "area_px": 0,
                    "perimeter_px": 0.0,
                    "solidity": 1.0,
                    "bounding_box": {"x": 0, "y": 0, "width": 0, "height": 0}
                },
                "color_features": {
                    "granulation_pct": 0.0,
                    "slough_pct": 0.0,
                    "necrotic_pct": 0.0,
                    "pale_pct": 0.0,
                    "primary_tissue": "No Wound Detected",
                    "tissue_health_score": 100.0
                },
                "exudate_features": {
                    "exudate_level": "None",
                    "exudate_area_pct": 0.0,
                    "fluid_pooling_detected": False,
                    "visual_indicator_note": "No wound fluid present."
                },
                "dimensional_measurements": {
                    "estimated_area_cm2": 0.0,
                    "width_mm": 0.0,
                    "height_mm": 0.0,
                    "perimeter_mm": 0.0,
                    "is_calibrated": False,
                    "calibration_note": "No wound bed detected to measure."
                },
                "healing_assessment": healing_res,
                "relative_paths": {
                    "mask_path": f"/storage/masks/{mask_filename}",
                    "overlay_path": f"/storage/overlays/{overlay_filename}",
                    "heatmap_path": f"/storage/heatmaps/{heatmap_filename}"
                }
            }

        # If quality is completely unusable, stop before segmentation
        if not quality_res["is_usable"]:
            healing_res = HealingStatusEngine.evaluate(
                quality_res=quality_res,
                color_res={},
                exudate_res={},
                area_res={},
                previous_analysis=previous_analysis
            )
            return {
                "model_version": self.MODEL_VERSION,
                "image_classification": classification,
                "image_quality": quality_res,
                "segmentation": {},
                "color_features": {},
                "exudate_features": {},
                "dimensional_measurements": {},
                "healing_assessment": healing_res,
                "relative_paths": {
                    "mask_path": None,
                    "overlay_path": None,
                    "heatmap_path": None
                }
            }

        # 3. Wound Bed & Dressing Boundary Segmentation
        seg_res = WoundDetector.segment_wound(image)
        wound_mask = seg_res["mask"]
        overlay_img = seg_res["overlay_image"]
        wound_detected = seg_res.get("wound_detected", True)

        # 4. Tissue Color Composition Analysis
        color_res = TissueColorAnalyzer.analyze_colors(image, wound_mask)
        heatmap_img = color_res["heatmap_image"]

        # 5. Exudate and Fluid Pattern Detection
        exudate_res = ExudateDetector.detect_exudate(image, wound_mask)

        # 6. Dimensional and Metric Area Estimation
        area_res = AreaEstimator.estimate_dimensions(
            wound_mask=wound_mask,
            image=image,
            custom_calibration_factor=custom_calibration_factor
        )

        # 7. Healing Status & Clinical Decision-Support Reasoning
        healing_res = HealingStatusEngine.evaluate(
            quality_res=quality_res,
            color_res=color_res,
            exudate_res=exudate_res,
            area_res=area_res,
            previous_analysis=previous_analysis,
            wound_detected=wound_detected
        )

        # 8. Save Generated Artifact Images (Mask, Overlay, Heatmap)
        mask_filename = f"mask_{image_id}.png"
        overlay_filename = f"overlay_{image_id}.jpg"
        heatmap_filename = f"heatmap_{image_id}.jpg"

        mask_full_path = os.path.join(self.storage_dir, "masks", mask_filename)
        overlay_full_path = os.path.join(self.storage_dir, "overlays", overlay_filename)
        heatmap_full_path = os.path.join(self.storage_dir, "heatmaps", heatmap_filename)

        cv2.imwrite(mask_full_path, wound_mask)
        cv2.imwrite(overlay_full_path, overlay_img)
        cv2.imwrite(heatmap_full_path, heatmap_img)

        return {
            "model_version": self.MODEL_VERSION,
            "image_classification": classification,
            "image_quality": quality_res,
            "segmentation": {
                "area_px": seg_res["area_px"],
                "perimeter_px": seg_res["perimeter_px"],
                "solidity": seg_res["solidity"],
                "bounding_box": seg_res["bounding_box"]
            },
            "color_features": {
                "granulation_pct": color_res["granulation_pct"],
                "slough_pct": color_res["slough_pct"],
                "necrotic_pct": color_res["necrotic_pct"],
                "pale_pct": color_res["pale_pct"],
                "primary_tissue": color_res["primary_tissue"],
                "tissue_health_score": color_res["tissue_health_score"]
            },
            "exudate_features": {
                "exudate_level": exudate_res["exudate_level"],
                "exudate_area_pct": exudate_res["exudate_area_pct"],
                "fluid_pooling_detected": exudate_res["fluid_pooling_detected"],
                "visual_indicator_note": exudate_res["visual_indicator_note"]
            },
            "dimensional_measurements": {
                "estimated_area_cm2": area_res["estimated_area_cm2"],
                "width_mm": area_res["width_mm"],
                "height_mm": area_res["height_mm"],
                "perimeter_mm": area_res["perimeter_mm"],
                "is_calibrated": area_res["is_calibrated"],
                "calibration_note": area_res["calibration_note"]
            },
            "healing_assessment": healing_res,
            "relative_paths": {
                "mask_path": f"/storage/masks/{mask_filename}",
                "overlay_path": f"/storage/overlays/{overlay_filename}",
                "heatmap_path": f"/storage/heatmaps/{heatmap_filename}"
            }
        }


# Global singleton instance
ai_pipeline = WoundAIPipeline()
