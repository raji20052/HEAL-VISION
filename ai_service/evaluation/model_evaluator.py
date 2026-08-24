"""AI Model and Computer Vision Evaluation Benchmark Module.
Computes Dice Similarity Coefficient (DSC), Jaccard Index (IoU), Precision, Recall, and Classification Confusion Metrics.
"""

from typing import Dict, Any, List
import numpy as np


class ModelEvaluator:
    """Provides clinical validation and benchmark metrics for wound segmentation and classification models."""

    @classmethod
    def evaluate_segmentation(cls, predicted_mask: np.ndarray, ground_truth_mask: np.ndarray) -> Dict[str, float]:
        """Calculates overlap and boundary accuracy metrics between predicted and ground-truth segmentation masks."""
        pred = (predicted_mask > 0).astype(bool)
        gt = (ground_truth_mask > 0).astype(bool)

        intersection = np.logical_and(pred, gt).sum()
        union = np.logical_or(pred, gt).sum()
        pred_sum = pred.sum()
        gt_sum = gt.sum()

        # Dice Similarity Coefficient (F1 Score for segmentation)
        dice = float((2.0 * intersection) / (pred_sum + gt_sum)) if (pred_sum + gt_sum) > 0 else 1.0

        # Jaccard Index / Intersection over Union (IoU)
        iou = float(intersection / union) if union > 0 else 1.0

        # Precision (Positive Predictive Value)
        precision = float(intersection / pred_sum) if pred_sum > 0 else 1.0

        # Recall (Sensitivity)
        recall = float(intersection / gt_sum) if gt_sum > 0 else 1.0

        return {
            "dice_coefficient": round(dice, 4),
            "jaccard_iou": round(iou, 4),
            "precision": round(precision, 4),
            "recall_sensitivity": round(recall, 4)
        }

    @classmethod
    def evaluate_classification_dataset(
        cls, 
        y_true: List[str], 
        y_pred: List[str],
        labels: List[str] = None
    ) -> Dict[str, Any]:
        """Calculates multi-class precision, recall, accuracy, and confusion matrix for monitoring status."""
        labels = labels or ["healing_normally", "needs_monitoring", "possible_abnormal_change"]
        
        total = len(y_true)
        if total == 0:
            return {"accuracy": 0.0, "total_samples": 0}

        correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
        accuracy = correct / total

        # Build confusion matrix dictionary
        matrix = {lbl: {other_lbl: 0 for other_lbl in labels} for lbl in labels}
        for t, p in zip(y_true, y_pred):
            if t in matrix and p in matrix[t]:
                matrix[t][p] += 1

        # Per-class metrics
        class_metrics = {}
        for lbl in labels:
            tp = matrix[lbl][lbl]
            fp = sum(matrix[other][lbl] for other in labels if other != lbl)
            fn = sum(matrix[lbl][other] for other in labels if other != lbl)
            
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
            
            class_metrics[lbl] = {
                "precision": round(prec, 3),
                "recall": round(rec, 3),
                "f1_score": round(f1, 3),
                "support": sum(matrix[lbl].values())
            }

        return {
            "model_version": "v1.2.0-biopolymer-cv",
            "overall_accuracy": round(accuracy, 4),
            "total_samples": total,
            "class_metrics": class_metrics,
            "confusion_matrix": matrix,
            "validation_note": "Research benchmark evaluation module. Not a substitute for peer-reviewed clinical trial validation."
        }
