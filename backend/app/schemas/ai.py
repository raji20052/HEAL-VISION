"""AI Analysis and Evaluation Schemas."""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel


class AIAnalysisTrigger(BaseModel):
    custom_calibration_factor: Optional[float] = None
    force_reanalysis: Optional[bool] = False


class AIAnalysisResponse(BaseModel):
    id: str
    wound_image_id: str
    wound_id: str
    model_version: str
    image_quality_status: str
    quality_metrics_json: Dict[str, Any]
    wound_area_px: int
    estimated_area_cm2: float
    calibration_factor: Optional[float] = None
    color_granulation_pct: float
    color_slough_pct: float
    color_necrotic_pct: float
    color_pale_pct: float
    exudate_level: str
    exudate_area_pct: float
    perimeter_px: float
    tissue_classification: str
    change_from_previous_json: Dict[str, Any]
    healing_trend: str
    monitoring_status: str
    confidence_score: float
    limitations_json: List[str]
    observations_json: List[str]
    disclaimer: str
    created_at: datetime

    class Config:
        from_attributes = True


class TemporalComparisonResponse(BaseModel):
    total_points: int
    days_monitored: int
    baseline_area_cm2: float
    latest_area_cm2: float
    overall_area_reduction_pct: float
    healing_velocity_cm2_per_day: float
    area_progression: List[Dict[str, Any]]
    granulation_progression: List[Dict[str, Any]]
    slough_progression: List[Dict[str, Any]]
    status_progression: List[Dict[str, Any]]
    trajectory_assessment: str
