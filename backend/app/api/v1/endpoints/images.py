"""Image Upload, Camera Capture, and File Serving Endpoints."""

import os
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import cv2
import numpy as np

from ....core.config import settings
from ....core.security import get_current_user
from ....db.session import get_db
from ....db.models import User, Wound, WoundImage, AIAnalysis, PatientNote, Notification, AuditLog
from ai_service.pipeline import ai_pipeline

router = APIRouter()


@router.post("/upload")
async def upload_wound_image(
    wound_id: str = Form(...),
    capture_date: Optional[str] = Form(None),
    days_since_dressing: Optional[int] = Form(1),
    notes: Optional[str] = Form(None),
    pain_score: Optional[int] = Form(0),
    symptoms: Optional[str] = Form(""),  # comma-separated string e.g. "redness,warmth"
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Receives a wound photo uploaded or captured via camera, stores it, runs AI analysis, and saves results."""
    wound = db.query(Wound).filter(Wound.id == wound_id).first()
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found.")
    if current_user.role == "patient" and wound.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Read image contents
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Decode image to numpy array
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file format.")

    height, width = image.shape[:2]
    image_id = str(uuid.uuid4())
    filename = f"img_{image_id}.jpg"
    image_storage_path = os.path.join(settings.STORAGE_DIR, "images", filename)
    
    # Save original image
    cv2.imwrite(image_storage_path, image)
    file_size_kb = round(len(contents) / 1024.0, 1)

    # Check for previous analysis on this wound for temporal comparison
    last_image = db.query(WoundImage).filter(WoundImage.wound_id == wound_id).order_by(WoundImage.capture_date.desc()).first()
    prev_analysis_dict = None
    if last_image and last_image.ai_analysis:
        prev_an = last_image.ai_analysis
        prev_analysis_dict = {
            "wound_area_cm2": prev_an.estimated_area_cm2,
            "color_granulation_pct": prev_an.color_granulation_pct,
            "color_slough_pct": prev_an.color_slough_pct,
            "capture_date": last_image.capture_date,
            "days_since_dressing": last_image.days_since_dressing
        }

    # Execute AI Pipeline
    ai_result = ai_pipeline.analyze_image_array(
        image=image,
        image_id=image_id,
        previous_analysis=prev_analysis_dict
    )

    quality = ai_result.get("image_quality", {})
    quality_score = quality.get("score", 90.0)
    is_baseline = (last_image is None)

    # Relative URLs
    image_rel_url = f"/storage/images/{filename}"
    mask_rel_url = ai_result["relative_paths"]["mask_path"]
    overlay_rel_url = ai_result["relative_paths"]["overlay_path"]
    heatmap_rel_url = ai_result["relative_paths"]["heatmap_path"]

    # Record WoundImage in DB
    wound_image = WoundImage(
        id=image_id,
        wound_id=wound_id,
        image_url=image_rel_url,
        thumbnail_url=image_rel_url,
        mask_url=mask_rel_url,
        overlay_url=overlay_rel_url,
        heatmap_url=heatmap_rel_url,
        capture_date=capture_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        days_since_dressing=days_since_dressing or 1,
        notes=notes,
        image_width=width,
        image_height=height,
        file_size_kb=file_size_kb,
        image_quality_score=quality_score,
        is_baseline=is_baseline
    )
    db.add(wound_image)
    db.flush()

    # Record AI Analysis in DB
    seg = ai_result.get("segmentation", {})
    color = ai_result.get("color_features", {})
    exudate = ai_result.get("exudate_features", {})
    dim = ai_result.get("dimensional_measurements", {})
    healing = ai_result.get("healing_assessment", {})

    ai_analysis_record = AIAnalysis(
        wound_image_id=wound_image.id,
        wound_id=wound_id,
        model_version=ai_result.get("model_version", "v1.2.0-biopolymer-cv-research"),
        image_quality_status=quality.get("status", "PASS"),
        quality_metrics_json=quality.get("metrics", {}),
        wound_area_px=seg.get("area_px", 0),
        estimated_area_cm2=dim.get("estimated_area_cm2", 0.0),
        calibration_factor=dim.get("calibration_factor_px_per_cm"),
        color_granulation_pct=color.get("granulation_pct", 0.0),
        color_slough_pct=color.get("slough_pct", 0.0),
        color_necrotic_pct=color.get("necrotic_pct", 0.0),
        color_pale_pct=color.get("pale_pct", 0.0),
        exudate_level=exudate.get("exudate_level", "None"),
        exudate_area_pct=exudate.get("exudate_area_pct", 0.0),
        perimeter_px=seg.get("perimeter_px", 0.0),
        tissue_classification=color.get("primary_tissue", "Granulation"),
        change_from_previous_json=healing.get("change_from_previous", {}),
        healing_trend=healing.get("healing_trend", "improving"),
        monitoring_status=healing.get("monitoring_status", "healing_normally"),
        confidence_score=healing.get("confidence_score", 0.90),
        limitations_json=healing.get("limitations", []),
        observations_json=healing.get("patient_observations", []),
        disclaimer=healing.get("disclaimer", "AI assessment is an experimental decision-support indicator.")
    )
    db.add(ai_analysis_record)

    # Save Patient Note if pain/symptoms provided
    symptoms_list = [s.strip() for s in symptoms.split(",") if s.strip()] if symptoms else []
    if pain_score > 0 or symptoms_list or notes:
        pat_note = PatientNote(
            wound_id=wound_id,
            wound_image_id=wound_image.id,
            patient_id=current_user.id,
            pain_score=pain_score,
            symptoms_json=symptoms_list,
            note_text=notes
        )
        db.add(pat_note)

    # Create Notifications if abnormal or quality issues
    if healing.get("monitoring_status") == "possible_abnormal_change":
        notif = Notification(
            user_id=current_user.id,
            title="Monitoring Notice: Visual Change Detected",
            message=f"A visual change was detected on '{wound.name}'. Consider reviewing the results and contacting your care provider.",
            type="alert",
            related_wound_id=wound_id
        )
        db.add(notif)
    elif quality.get("status") == "WARNING":
        notif = Notification(
            user_id=current_user.id,
            title="Image Quality Warning",
            message=f"Photo for '{wound.name}' had minor lighting/glare issues on the dressing. Results are approximate.",
            type="quality_warning",
            related_wound_id=wound_id
        )
        db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="IMAGE_UPLOAD_AND_ANALYZE",
        resource_type="wound_image",
        resource_id=image_id,
        details_json={"status": healing.get("monitoring_status"), "quality": quality.get("status")}
    )
    db.add(audit)

    # Update wound timestamp
    wound.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "image_id": wound_image.id,
        "wound_id": wound_id,
        "image_url": image_rel_url,
        "mask_url": mask_rel_url,
        "overlay_url": overlay_rel_url,
        "heatmap_url": heatmap_rel_url,
        "quality": quality,
        "ai_analysis": {
            "model_version": ai_analysis_record.model_version,
            "monitoring_status": ai_analysis_record.monitoring_status,
            "monitoring_status_display": healing.get("monitoring_status_display"),
            "healing_trend": ai_analysis_record.healing_trend,
            "confidence_score": ai_analysis_record.confidence_score,
            "estimated_area_cm2": ai_analysis_record.estimated_area_cm2,
            "color_granulation_pct": ai_analysis_record.color_granulation_pct,
            "color_slough_pct": ai_analysis_record.color_slough_pct,
            "color_necrotic_pct": ai_analysis_record.color_necrotic_pct,
            "exudate_level": ai_analysis_record.exudate_level,
            "observations": healing.get("patient_observations", []),
            "limitations": healing.get("limitations", []),
            "disclaimer": ai_analysis_record.disclaimer
        }
    }
