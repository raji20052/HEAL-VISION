"""Wound Monitoring Clinical Report Generation Endpoints."""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from ....core.security import get_current_user
from ....db.session import get_db
from ....db.models import User, Wound, WoundImage, AIAnalysis, DoctorNote, PatientNote, Report, SharedWound
from ....schemas.report import ReportGenerateRequest, ReportResponse

router = APIRouter()


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    req: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a complete clinical monitoring summary report for a wound with images, prescriptions, and next visit."""
    wound = db.query(Wound).filter(Wound.id == req.wound_id).first()
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found.")

    # Access control
    if current_user.role == "patient" and wound.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if current_user.role == "doctor":
        is_shared = db.query(SharedWound).filter(
            SharedWound.wound_id == wound.id,
            (SharedWound.doctor_id == current_user.id) | (SharedWound.doctor_email == current_user.email),
            SharedWound.is_revoked == False
        ).first()
        if not is_shared:
            raise HTTPException(status_code=403, detail="Access denied.")

    patient = db.query(User).filter(User.id == wound.patient_id).first()
    images = db.query(WoundImage).filter(WoundImage.wound_id == wound.id).order_by(WoundImage.capture_date.asc()).all()
    doctor_notes = db.query(DoctorNote).filter(DoctorNote.wound_id == wound.id).order_by(DoctorNote.created_at.desc()).all()

    first_img = images[0] if images else None
    latest_img = images[-1] if images else None
    
    first_an = first_img.ai_analysis if first_img else None
    latest_an = latest_img.ai_analysis if latest_img else None

    baseline_area = first_an.estimated_area_cm2 if first_an else 0.0
    current_area = latest_an.estimated_area_cm2 if latest_an else 0.0
    area_delta_pct = 0.0
    if baseline_area > 0 and current_area > 0:
        area_delta_pct = round(((baseline_area - current_area) / baseline_area) * 100, 1)

    # Compile uploaded wound images list
    uploaded_images_list = []
    for img in images:
        an = img.ai_analysis
        uploaded_images_list.append({
            "id": img.id,
            "capture_date": img.capture_date,
            "days_since_dressing": img.days_since_dressing,
            "image_url": img.image_url,
            "thumbnail_url": img.thumbnail_url or img.image_url,
            "overlay_url": img.overlay_url or img.image_url,
            "area_cm2": an.estimated_area_cm2 if an else 0.0,
            "status": an.monitoring_status if an else "healing_normally",
            "is_baseline": img.is_baseline
        })

    # Standard clinical prescriptions based on wound type and stage
    prescriptions = [
        {
            "category": "Topical Biopolymer Dressing",
            "medication": f"{wound.dressing_type or 'Chitosan-Gelatin Biopolymer Transparent Film'}",
            "dosage_frequency": "Apply thin semi-permeable film; replace every 3 to 4 days or if seal is compromised.",
            "instructions": "Clean periwound skin with sterile saline before application. Ensure good peripheral adhesion without tension."
        },
        {
            "category": "Cleansing & Irrigation",
            "medication": "0.9% Sterile Normal Saline Solution (NaCl)",
            "dosage_frequency": "Gentle irrigation prior to each dressing application",
            "instructions": "Flush wound bed gently at low pressure. Do NOT vigorously scrub newly vascularized granulation tissue."
        },
        {
            "category": "Topical Antimicrobial (As Indicated)",
            "medication": "Medical-Grade Silver Hydrogel / Bacitracin Ointment",
            "dosage_frequency": "Thin layer applied to periwound edge if erythema or slough is noted",
            "instructions": "Apply sparingly. Discontinue once healthy pink epithelialization margin is established."
        }
    ]

    # Calculate next scheduled monitoring visit / check-in
    now = datetime.now(timezone.utc)
    next_visit_date = (now + timedelta(days=3)).strftime("%d %b %Y")
    
    summary_payload = {
        "patient_name": patient.full_name if patient else "Patient",
        "patient_email": patient.email if patient else "N/A",
        "patient_phone": patient.phone if patient else "N/A",
        "patient_dob": patient.patient_profile.date_of_birth if (patient and patient.patient_profile) else "N/A",
        "wound_id": wound.id,
        "wound_name": wound.name,
        "wound_type": wound.wound_type,
        "body_location": wound.body_location,
        "dressing_type": wound.dressing_type,
        "monitoring_start_date": wound.first_observed_date,
        "total_monitoring_days": latest_img.days_since_dressing if latest_img else 1,
        "total_images_analyzed": len(images),
        "baseline_area_cm2": baseline_area,
        "current_area_cm2": current_area,
        "overall_area_reduction_pct": area_delta_pct,
        "latest_granulation_pct": latest_an.color_granulation_pct if latest_an else 0.0,
        "latest_slough_pct": latest_an.color_slough_pct if latest_an else 0.0,
        "latest_necrotic_pct": latest_an.color_necrotic_pct if latest_an else 0.0,
        "latest_exudate_level": latest_an.exudate_level if latest_an else "None",
        "latest_monitoring_status": latest_an.monitoring_status if latest_an else "healing_normally",
        "uploaded_images": uploaded_images_list,
        "prescriptions": prescriptions,
        "next_monitoring_visit": {
            "scheduled_date": next_visit_date,
            "timeline_text": "In 3 Days",
            "action": "Next Photo Capture & Dressing Assessment",
            "recommendation": "Perform next top-down image capture under steady lighting prior to dressing change."
        },
        "doctor_notes_count": len(doctor_notes),
        "latest_doctor_recommendation": doctor_notes[0].recommendations if doctor_notes else "Routine scheduled follow-up and monitoring.",
        "disclaimer": (
            "RESEARCH DECISION-SUPPORT REPORT: Visual assessments are AI-assisted indicators and do not constitute a medical diagnosis. "
            "Always consult a qualified healthcare professional."
        )
    }

    # Generate print-friendly HTML markup with images and prescription
    img_html_cards = ""
    for idx, uimg in enumerate(uploaded_images_list):
        img_html_cards += f"""
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
            <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 6px;">
                {'Baseline Observation' if uimg['is_baseline'] else f'Observation {idx+1}'} ({uimg['capture_date']})
            </div>
            <img src="{uimg['image_url']}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" />
            <div style="font-size: 11px; font-weight: 600; color: #0d9488; margin-top: 6px;">Area: {uimg['area_cm2']} cm²</div>
        </div>
        """

    rx_html_cards = ""
    for rx in prescriptions:
        rx_html_cards += f"""
        <div style="background: #f8fafc; border-left: 4px solid #0d9488; padding: 10px 14px; margin-bottom: 8px; border-radius: 4px;">
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">{rx['medication']} <span style="font-size: 10px; color: #64748b; font-weight: normal;">({rx['category']})</span></div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;"><strong>Dosage / Frequency:</strong> {rx['dosage_frequency']}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;"><strong>Instructions:</strong> {rx['instructions']}</div>
        </div>
        """

    html_markup = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Clinical Healing Report - {wound.name}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 25px; margin: 0; line-height: 1.4; }}
            .header {{ border-bottom: 3px solid #0d9488; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }}
            .brand {{ font-size: 22px; font-weight: 800; color: #0f172a; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #ccfbf1; color: #0f766e; }}
            .section {{ margin-bottom: 20px; }}
            .section-title {{ font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }}
            .grid-3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }}
            .grid-4 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }}
            .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }}
            .label {{ font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }}
            .val {{ font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; }}
            .visit-card {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }}
            .disclaimer-box {{ background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; border-radius: 4px; font-size: 11px; color: #92400e; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="brand">Smart Wound Healing Monitor</div>
                <div style="font-size: 12px; color: #64748b;">Clinical Decision-Support & Biopolymer Dressing Report</div>
            </div>
            <div style="text-align: right;">
                <span class="badge">CONFIDENTIAL CLINICAL REPORT</span>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: {datetime.now(timezone.utc).strftime("%d %b %Y")}</div>
            </div>
        </div>

        <!-- Section 1: Patient & Wound Info -->
        <div class="section">
            <div class="section-title">Patient & Wound Dossier</div>
            <div class="grid-3">
                <div class="card"><div class="label">Patient Name</div><div class="val">{summary_payload['patient_name']}</div></div>
                <div class="card"><div class="label">Wound Designation</div><div class="val">{wound.name}</div></div>
                <div class="card"><div class="label">Anatomical Location</div><div class="val">{wound.body_location}</div></div>
                <div class="card"><div class="label">Wound Etiology</div><div class="val">{wound.wound_type.title()}</div></div>
                <div class="card"><div class="label">Applied Dressing</div><div class="val">{wound.dressing_type}</div></div>
                <div class="card"><div class="label">Total Monitored</div><div class="val">{summary_payload['total_monitoring_days']} Days ({len(images)} Sessions)</div></div>
            </div>
        </div>

        <!-- Section 2: Uploaded Wound Images -->
        <div class="section">
            <div class="section-title">Patient Uploaded Wound Image Progression</div>
            <div class="grid-4">
                {img_html_cards}
            </div>
        </div>

        <!-- Section 3: Next Visit -->
        <div class="section">
            <div class="section-title">Next Scheduled Monitoring Visit</div>
            <div class="visit-card">
                <div>
                    <div style="font-size: 14px; font-weight: 800; color: #166534;">Next Assessment Date: {next_visit_date} ({summary_payload['next_monitoring_visit']['timeline_text']})</div>
                    <div style="font-size: 11px; color: #15803d; margin-top: 2px;">{summary_payload['next_monitoring_visit']['recommendation']}</div>
                </div>
                <div style="background: #16a34a; color: #fff; font-size: 11px; font-weight: bold; padding: 6px 12px; border-radius: 6px;">Scheduled</div>
            </div>
        </div>

        <!-- Section 4: Prescription -->
        <div class="section">
            <div class="section-title">Prescription & Wound Care Protocol</div>
            {rx_html_cards}
        </div>

        <!-- Section 5: Progression Summary -->
        <div class="section">
            <div class="section-title">Quantitative Progression Metrics</div>
            <div class="grid-3">
                <div class="card"><div class="label">Baseline Area</div><div class="val">{baseline_area} cm²</div></div>
                <div class="card"><div class="label">Current Estimated Area</div><div class="val">{current_area} cm²</div></div>
                <div class="card"><div class="label">Area Contraction</div><div class="val" style="color: {'#10b981' if area_delta_pct >= 0 else '#ef4444'}">{area_delta_pct}% Reduction</div></div>
            </div>
        </div>

        <div class="disclaimer-box">
            <strong>Mandatory Medical Notice:</strong> {summary_payload['disclaimer']}
        </div>
    </body>
    </html>
    """

    report = Report(
        wound_id=wound.id,
        patient_id=wound.patient_id,
        doctor_id=current_user.id if current_user.role == "doctor" else None,
        report_type=req.report_type,
        title=req.title or f"Clinical Healing Report - {wound.name}",
        summary_json=summary_payload,
        html_content=html_markup
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("/{report_id}/html", response_class=HTMLResponse)
def view_report_html(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Renders printable HTML view of the clinical monitoring report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return HTMLResponse(content=report.html_content)


@router.get("/wound/{wound_id}", response_model=List[ReportResponse])
def list_reports_for_wound(
    wound_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all previously generated clinical reports for a given wound."""
    reports = db.query(Report).filter(Report.wound_id == wound_id).order_by(Report.generated_at.desc()).all()
    return reports
