"""Wound Management Endpoints."""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.security import get_current_user
from ....db.session import get_db
from ....db.models import User, Wound, WoundImage, AIAnalysis, SharedWound, DoctorNote, PatientNote
from ....schemas.wound import WoundCreate, WoundUpdate, WoundSummary, WoundDetailResponse

router = APIRouter()


@router.get("", response_model=List[WoundSummary])
def list_wounds(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists wounds for current patient, or shared wounds if user is a doctor."""
    query = db.query(Wound)

    if current_user.role == "patient":
        query = query.filter(Wound.patient_id == current_user.id)
    elif current_user.role == "doctor":
        # Doctors see shared wounds
        shared_wound_ids = db.query(SharedWound.wound_id).filter(
            (SharedWound.doctor_id == current_user.id) | (SharedWound.doctor_email == current_user.email),
            SharedWound.is_revoked == False
        ).subquery()
        query = query.filter(Wound.id.in_(shared_wound_ids))
    
    if status_filter:
        query = query.filter(Wound.status == status_filter)

    wounds = query.order_by(Wound.updated_at.desc()).all()
    results = []

    for w in wounds:
        # Compute summary metrics
        images = db.query(WoundImage).filter(WoundImage.wound_id == w.id).order_by(WoundImage.capture_date.asc()).all()
        img_count = len(images)
        latest_img = images[-1] if images else None
        first_img = images[0] if images else None
        
        latest_analysis = latest_img.ai_analysis if latest_img else None
        first_analysis = first_img.ai_analysis if first_img else None

        latest_status = latest_analysis.monitoring_status if latest_analysis else "healing_normally"
        
        status_display_map = {
            "healing_normally": "Healing Normally",
            "needs_monitoring": "Needs Monitoring",
            "possible_abnormal_change": "Possible Abnormal Change",
            "insufficient_quality": "Insufficient Image Quality"
        }
        latest_status_display = status_display_map.get(latest_status, "Healing Normally")
        
        latest_area = latest_analysis.estimated_area_cm2 if latest_analysis else 0.0
        first_area = first_analysis.estimated_area_cm2 if first_analysis else latest_area
        
        reduction_pct = 0.0
        if first_area > 0 and latest_area > 0:
            reduction_pct = round(((first_area - latest_area) / first_area) * 100, 1)

        days_count = 1
        if images:
            days_count = max(1, latest_img.days_since_dressing)

        shared_count = db.query(SharedWound).filter(SharedWound.wound_id == w.id, SharedWound.is_revoked == False).count()

        results.append(WoundSummary(
            id=w.id,
            patient_id=w.patient_id,
            name=w.name,
            wound_type=w.wound_type,
            body_location=w.body_location,
            first_observed_date=w.first_observed_date,
            dressing_applied_date=w.dressing_applied_date,
            dressing_type=w.dressing_type,
            status=w.status,
            description=w.description,
            notes=w.notes,
            created_at=w.created_at,
            updated_at=w.updated_at,
            image_count=img_count,
            latest_image_url=latest_img.image_url if latest_img else None,
            latest_status=latest_status,
            latest_status_display=latest_status_display,
            latest_area_cm2=latest_area,
            area_reduction_pct=reduction_pct,
            days_in_monitoring=days_count,
            shared_with_doctor_count=shared_count
        ))

    return results


@router.post("", response_model=WoundDetailResponse, status_code=status.HTTP_201_CREATED)
def create_wound(
    wound_in: WoundCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registers a new wound record for monitoring."""
    if current_user.role != "patient" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only patients can register new wound profiles.")

    wound = Wound(
        patient_id=current_user.id,
        name=wound_in.name,
        wound_type=wound_in.wound_type,
        body_location=wound_in.body_location,
        first_observed_date=wound_in.first_observed_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        dressing_applied_date=wound_in.dressing_applied_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        dressing_type=wound_in.dressing_type or "Chitosan Biopolymer Transparent Film",
        status=wound_in.status or "active",
        description=wound_in.description,
        notes=wound_in.notes
    )
    db.add(wound)
    db.commit()
    db.refresh(wound)

    return WoundDetailResponse(
        id=wound.id,
        patient_id=wound.patient_id,
        name=wound.name,
        wound_type=wound.wound_type,
        body_location=wound.body_location,
        first_observed_date=wound.first_observed_date,
        dressing_applied_date=wound.dressing_applied_date,
        dressing_type=wound.dressing_type,
        status=wound.status,
        description=wound.description,
        notes=wound.notes,
        created_at=wound.created_at,
        updated_at=wound.updated_at,
        images=[],
        doctor_notes=[],
        patient_notes=[],
        shared_records=[],
        latest_analysis=None
    )


@router.get("/{wound_id}", response_model=WoundDetailResponse)
def get_wound_detail(
    wound_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches full wound profile with images, analyses, notes, and sharing state."""
    wound = db.query(Wound).filter(Wound.id == wound_id).first()
    if not wound:
        raise HTTPException(status_code=404, detail="Wound record not found.")

    # Access control verification
    if current_user.role == "patient" and wound.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this wound record.")
    
    if current_user.role == "doctor":
        is_shared = db.query(SharedWound).filter(
            SharedWound.wound_id == wound_id,
            (SharedWound.doctor_id == current_user.id) | (SharedWound.doctor_email == current_user.email),
            SharedWound.is_revoked == False
        ).first()
        if not is_shared:
            raise HTTPException(status_code=403, detail="Access denied: This wound has not been shared with you.")

    # Fetch related records
    images = db.query(WoundImage).filter(WoundImage.wound_id == wound_id).order_by(WoundImage.capture_date.asc()).all()
    doctor_notes = db.query(DoctorNote).filter(DoctorNote.wound_id == wound_id).order_by(DoctorNote.created_at.desc()).all()
    patient_notes = db.query(PatientNote).filter(PatientNote.wound_id == wound_id).order_by(PatientNote.created_at.desc()).all()
    shared_records = db.query(SharedWound).filter(SharedWound.wound_id == wound_id, SharedWound.is_revoked == False).all()

    # Format images and attach analyses
    formatted_images = []
    latest_analysis_dict = None
    for img in images:
        analysis_data = None
        if img.ai_analysis:
            an = img.ai_analysis
            analysis_data = {
                "id": an.id,
                "model_version": an.model_version,
                "image_quality_status": an.image_quality_status,
                "quality_metrics": an.quality_metrics_json,
                "wound_area_px": an.wound_area_px,
                "estimated_area_cm2": an.estimated_area_cm2,
                "color_granulation_pct": an.color_granulation_pct,
                "color_slough_pct": an.color_slough_pct,
                "color_necrotic_pct": an.color_necrotic_pct,
                "color_pale_pct": an.color_pale_pct,
                "exudate_level": an.exudate_level,
                "exudate_area_pct": an.exudate_area_pct,
                "tissue_classification": an.tissue_classification,
                "healing_trend": an.healing_trend,
                "monitoring_status": an.monitoring_status,
                "confidence_score": an.confidence_score,
                "change_from_previous": an.change_from_previous_json,
                "limitations": an.limitations_json,
                "observations": an.observations_json,
                "disclaimer": an.disclaimer
            }
            latest_analysis_dict = analysis_data

        formatted_images.append({
            "id": img.id,
            "wound_id": img.wound_id,
            "image_url": img.image_url,
            "thumbnail_url": img.thumbnail_url,
            "mask_url": img.mask_url,
            "overlay_url": img.overlay_url,
            "heatmap_url": img.heatmap_url,
            "capture_date": img.capture_date,
            "days_since_dressing": img.days_since_dressing,
            "notes": img.notes,
            "image_width": img.image_width,
            "image_height": img.image_height,
            "file_size_kb": img.file_size_kb,
            "image_quality_score": img.image_quality_score,
            "is_baseline": img.is_baseline,
            "created_at": img.created_at,
            "ai_analysis": analysis_data
        })

    return WoundDetailResponse(
        id=wound.id,
        patient_id=wound.patient_id,
        name=wound.name,
        wound_type=wound.wound_type,
        body_location=wound.body_location,
        first_observed_date=wound.first_observed_date,
        dressing_applied_date=wound.dressing_applied_date,
        dressing_type=wound.dressing_type,
        status=wound.status,
        description=wound.description,
        notes=wound.notes,
        created_at=wound.created_at,
        updated_at=wound.updated_at,
        images=formatted_images,
        doctor_notes=[{
            "id": n.id,
            "doctor_id": n.doctor_id,
            "doctor_name": n.doctor_name,
            "clinical_observation": n.clinical_observation,
            "recommendations": n.recommendations,
            "follow_up_date": n.follow_up_date,
            "review_status": n.review_status,
            "created_at": n.created_at
        } for n in doctor_notes],
        patient_notes=[{
            "id": pn.id,
            "pain_score": pn.pain_score,
            "symptoms": pn.symptoms_json,
            "note_text": pn.note_text,
            "created_at": pn.created_at
        } for pn in patient_notes],
        shared_records=[{
            "id": sr.id,
            "doctor_id": sr.doctor_id,
            "doctor_email": sr.doctor_email,
            "share_token": sr.share_token,
            "permissions": sr.permissions,
            "created_at": sr.created_at
        } for sr in shared_records],
        latest_analysis=latest_analysis_dict
    )


@router.put("/{wound_id}", response_model=WoundDetailResponse)
def update_wound(
    wound_id: str,
    wound_update: WoundUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates wound profile metadata."""
    wound = db.query(Wound).filter(Wound.id == wound_id).first()
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found.")
    if current_user.role == "patient" and wound.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    for field, val in wound_update.model_dump(exclude_unset=True).items():
        setattr(wound, field, val)

    wound.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wound)
    return get_wound_detail(wound_id=wound.id, current_user=current_user, db=db)


@router.delete("/{wound_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wound(
    wound_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes or archives a wound record."""
    wound = db.query(Wound).filter(Wound.id == wound_id).first()
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found.")
    if current_user.role == "patient" and wound.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    db.delete(wound)
    db.commit()
    return None
