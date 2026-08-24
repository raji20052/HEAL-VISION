"""Realistic Synthetic Image Generator and Database Seeder for Research Demonstrations."""

import os
import uuid
from datetime import datetime, timedelta, timezone
import cv2
import numpy as np
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.security import get_password_hash
from .models import (
    User, PatientProfile, DoctorProfile, Wound, WoundImage, AIAnalysis,
    DoctorPatientRelationship, SharedWound, DoctorNote, PatientNote,
    Report, Notification, AuditLog
)
from ai_service.pipeline import ai_pipeline


def generate_synthetic_wound_image(
    stage: str,
    filename: str
) -> str:
    """Generates a realistic synthetic wound image simulating imaging through transparent biopolymer dressing."""
    width, height = 640, 480
    
    # 1. Base skin tone (warm Caucasian / light Fitzpatrick II-III tone)
    # BGR format: B=170, G=195, R=235
    img = np.zeros((height, width, 3), dtype=np.uint8)
    img[:] = [170, 195, 235]
    
    # Add realistic photographic skin texture noise
    rng = np.random.RandomState(42 + hash(filename) % 1000)
    texture = rng.normal(0, 14, (height, width, 3)).astype(np.int16)
    img = np.clip(img.astype(np.int16) + texture, 0, 255).astype(np.uint8)
    
    # Add micro dermal lines/skin pores
    for _ in range(40):
        pt1 = (rng.randint(0, width), rng.randint(0, height))
        pt2 = (pt1[0] + rng.randint(-15, 15), pt1[1] + rng.randint(-15, 15))
        cv2.line(img, pt1, pt2, (155, 180, 220), 1, cv2.LINE_AA)

    center_x, center_y = width // 2, height // 2
    
    # 2. Transparent Biopolymer Dressing Boundary Outline & Sheen
    dressing_w, dressing_h = int(width * 0.72), int(height * 0.72)
    dx1, dy1 = center_x - dressing_w // 2, center_y - dressing_h // 2
    dx2, dy2 = center_x + dressing_w // 2, center_y + dressing_h // 2
    
    # Draw crisp biopolymer adhesive film edge line
    cv2.rectangle(img, (dx1, dy1), (dx2, dy2), (245, 250, 255), 2, cv2.LINE_AA)
    cv2.rectangle(img, (dx1 - 3, dy1 - 3), (dx2 + 3, dy2 + 3), (195, 210, 235), 1, cv2.LINE_AA)

    # 3. Draw Wound bed based on stage
    if stage == "surgical_d1":
        # Day 1: Fresh surgical incision with erythema border (4.2 cm²)
        cv2.ellipse(img, (center_x, center_y), (145, 45), 5, 0, 360, (110, 120, 240), -1)
        cv2.ellipse(img, (center_x, center_y), (115, 28), 5, 0, 360, (30, 40, 225), -1)
        # Surgical suture line & knots
        cv2.line(img, (center_x - 95, center_y - 2), (center_x + 95, center_y + 12), (30, 160, 220), 3, cv2.LINE_AA)
        for sx in range(center_x - 80, center_x + 90, 25):
            cv2.circle(img, (sx, center_y + int((sx - center_x) * 0.08)), 4, (20, 20, 120), -1)
            cv2.circle(img, (sx + 2, center_y - 8), 2, (30, 190, 230), -1)
            
    elif stage == "surgical_d3":
        # Day 3: Active granulation forming (3.6 cm²)
        cv2.ellipse(img, (center_x, center_y), (125, 38), 5, 0, 360, (135, 145, 240), -1)
        cv2.ellipse(img, (center_x, center_y), (100, 22), 5, 0, 360, (25, 35, 235), -1)
        cv2.line(img, (center_x - 80, center_y - 1), (center_x + 80, center_y + 10), (35, 170, 225), 2, cv2.LINE_AA)
        for sx in range(center_x - 70, center_x + 80, 25):
            cv2.circle(img, (sx, center_y + int((sx - center_x) * 0.08)), 3, (25, 25, 110), -1)
        # Specular glisten on biopolymer
        cv2.circle(img, (center_x + 25, center_y - 6), 8, (250, 252, 255), -1)

    elif stage == "surgical_d7":
        # Day 7: Wound contracting, healthy vascular granulation (2.7 cm²)
        cv2.ellipse(img, (center_x, center_y), (100, 28), 5, 0, 360, (145, 165, 240), -1)
        cv2.ellipse(img, (center_x, center_y), (75, 16), 5, 0, 360, (30, 45, 230), -1)
        # Pale epithelial edge advancing
        cv2.ellipse(img, (center_x, center_y), (82, 19), 5, 0, 360, (210, 225, 250), 2, cv2.LINE_AA)
        cv2.line(img, (center_x - 60, center_y - 1), (center_x + 60, center_y + 7), (40, 50, 210), 2, cv2.LINE_AA)

    elif stage == "surgical_d14":
        # Day 14: Near closure, pink linear scar tissue (1.4 cm²)
        cv2.ellipse(img, (center_x, center_y), (70, 16), 5, 0, 360, (160, 180, 240), -1)
        cv2.ellipse(img, (center_x, center_y), (48, 10), 5, 0, 360, (60, 75, 225), -1)
        cv2.ellipse(img, (center_x, center_y), (54, 12), 5, 0, 360, (220, 230, 252), 2, cv2.LINE_AA)

    elif stage == "ulcer_d1":
        # Venous Ulcer Day 1: Irregular, slough (yellow) and granulation (red) (6.5 cm²)
        cv2.ellipse(img, (center_x, center_y), (135, 105), -15, 0, 360, (115, 125, 235), -1)
        cv2.ellipse(img, (center_x, center_y), (110, 80), -15, 0, 360, (25, 35, 220), -1)
        cv2.circle(img, (center_x - 28, center_y - 18), 35, (20, 195, 240), -1)
        cv2.circle(img, (center_x + 22, center_y + 22), 28, (30, 185, 230), -1)

    elif stage == "ulcer_d5":
        # Venous Ulcer Day 5: 6.1 cm²
        cv2.ellipse(img, (center_x, center_y), (128, 98), -15, 0, 360, (125, 135, 240), -1)
        cv2.ellipse(img, (center_x, center_y), (104, 74), -15, 0, 360, (25, 35, 225), -1)
        cv2.circle(img, (center_x - 22, center_y - 12), 28, (25, 190, 235), -1)
        cv2.circle(img, (center_x + 18, center_y + 18), 22, (30, 180, 225), -1)

    elif stage == "ulcer_d9":
        # Venous Ulcer Day 9: 5.8 cm²
        cv2.ellipse(img, (center_x, center_y), (118, 88), -15, 0, 360, (135, 145, 240), -1)
        cv2.ellipse(img, (center_x, center_y), (94, 66), -15, 0, 360, (25, 40, 230), -1)
        cv2.circle(img, (center_x - 16, center_y - 8), 20, (25, 185, 230), -1)

    elif stage == "abnormal_d1":
        # Laceration Day 1: 3.8 cm²
        cv2.ellipse(img, (center_x, center_y), (120, 50), 25, 0, 360, (125, 135, 240), -1)
        cv2.ellipse(img, (center_x, center_y), (90, 28), 25, 0, 360, (30, 40, 230), -1)

    elif stage == "abnormal_d4":
        # Laceration Day 4: 3.7 cm² with early slough & margin erythema
        cv2.ellipse(img, (center_x, center_y), (150, 70), 25, 0, 360, (95, 105, 245), -1)
        cv2.ellipse(img, (center_x, center_y), (92, 32), 25, 0, 360, (30, 40, 220), -1)
        cv2.circle(img, (center_x - 18, center_y), 20, (20, 190, 240), -1)

    elif stage == "abnormal_d8":
        # Laceration Day 8: 4.6 cm² EXPANDED! Prominent erythema, necrotic edges, high yellow exudate
        cv2.ellipse(img, (center_x, center_y), (190, 95), 25, 0, 360, (70, 80, 255), -1)
        cv2.ellipse(img, (center_x, center_y), (115, 46), 25, 0, 360, (25, 30, 210), -1)
        cv2.circle(img, (center_x - 22, center_y - 6), 34, (20, 200, 250), -1)
        cv2.circle(img, (center_x + 28, center_y + 12), 28, (25, 190, 240), -1)
        cv2.circle(img, (center_x + 48, center_y + 20), 18, (25, 25, 30), -1)

    # 4. Add subtle high-frequency granulation stippling for sharp focal definition
    gran_noise = rng.normal(0, 12, (height, width, 3)).astype(np.int16)
    img = np.clip(img.astype(np.int16) + gran_noise, 0, 255).astype(np.uint8)

    # 5. Dressing sheen
    overlay_sheen = img.copy()
    cv2.circle(overlay_sheen, (dx1 + 45, dy1 + 45), 30, (255, 255, 255), -1)
    cv2.addWeighted(overlay_sheen, 0.10, img, 0.90, 0, img)

    # Save to disk
    full_path = os.path.join(settings.STORAGE_DIR, "images", filename)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    cv2.imwrite(full_path, img)
    return full_path


def seed_demo_database(db: Session) -> dict:
    """Populates the database with 3 comprehensive research clinical cases."""
    
    # Check if already seeded
    existing_patient = db.query(User).filter(User.email == "sarah.jenkins@healvision.demo").first()
    if existing_patient:
        return {"status": "already_seeded", "message": "Demo data already present in database."}

    # 1. Create Demo Doctor (Dr. Robert Chen, MD)
    doc_user = User(
        email="demo.doctor@example.com",
        hashed_password=get_password_hash("DoctorDemo2026!"),
        full_name="Dr. Robert Chen, MD",
        role="doctor",
        phone="+1 (555) 234-8901",
        avatar_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
    )
    db.add(doc_user)
    db.flush()

    doc_profile = DoctorProfile(
        user_id=doc_user.id,
        specialty="Wound Care & Regenerative Biopolymers",
        license_number="MD-NY-849201",
        hospital_clinic="Memorial Center for Advanced Wound Healing",
        contact_phone="+1 (555) 234-8901"
    )
    db.add(doc_profile)

    # 2. Create Demo Patient 1: Sarah Jenkins (Normal Healing Progression)
    pat1 = User(
        email="demo.patient@example.com",
        hashed_password=get_password_hash("PatientDemo2026!"),
        full_name="Sarah Jenkins",
        role="patient",
        phone="+1 (555) 912-3456",
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    )
    db.add(pat1)
    db.flush()

    pat1_profile = PatientProfile(
        user_id=pat1.id,
        date_of_birth="1988-06-14",
        gender="Female",
        emergency_contact="Mark Jenkins (Husband) - (555) 912-3457",
        medical_history="Post-laparoscopic surgery. No diabetes. Non-smoker."
    )
    db.add(pat1_profile)

    # Patient 1 Wound: Post-Op Incision
    w1 = Wound(
        patient_id=pat1.id,
        name="Post-Op Abdominal Incision",
        wound_type="surgical",
        body_location="Lower Abdomen",
        first_observed_date=(datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%d"),
        dressing_applied_date=(datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%d"),
        dressing_type="Chitosan-Gelatin Biopolymer Transparent Film",
        status="healing",
        description="Surgical incision following laparoscopic procedure. Transparent biopolymer film applied for moist wound healing.",
        notes="Patient captures image every 3-4 days as instructed."
    )
    db.add(w1)
    db.flush()

    # Share Wound 1 with Dr. Chen
    share1 = SharedWound(
        wound_id=w1.id,
        patient_id=pat1.id,
        doctor_id=doc_user.id,
        doctor_email=doc_user.email,
        share_token=f"share_{uuid.uuid4().hex[:16]}",
        permissions="can_comment",
        expires_at=datetime.now(timezone.utc) + timedelta(days=60)
    )
    db.add(share1)

    rel1 = DoctorPatientRelationship(
        doctor_id=doc_user.id,
        patient_id=pat1.id,
        status="active"
    )
    db.add(rel1)

    # Generate Image Sequence for Wound 1: Day 1 -> Day 3 -> Day 7 -> Day 14
    w1_stages = [
        ("surgical_d1", 1, 14, "Baseline post-op image right after biopolymer dressing placement."),
        ("surgical_d3", 3, 11, "Day 3 follow-up. Mild initial erythema receding."),
        ("surgical_d7", 7, 7, "Day 7 follow-up. Wound contracting well, good edge alignment."),
        ("surgical_d14", 14, 0, "Day 14 follow-up. Clean closure, healthy epithelialization.")
    ]

    last_img_id = None
    for stage_name, day_num, days_ago, note_text in w1_stages:
        img_id = str(uuid.uuid4())
        fname = f"demo_w1_d{day_num}_{img_id[:8]}.jpg"
        full_img_path = generate_synthetic_wound_image(stage_name, fname)
        
        c_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        # Run AI analysis on the image
        ai_res = ai_pipeline.analyze_image_file(
            image_path=full_img_path,
            image_id=img_id
        )

        w_img = WoundImage(
            id=img_id,
            wound_id=w1.id,
            image_url=f"/storage/images/{fname}",
            thumbnail_url=f"/storage/images/{fname}",
            mask_url=ai_res["relative_paths"]["mask_path"],
            overlay_url=ai_res["relative_paths"]["overlay_path"],
            heatmap_url=ai_res["relative_paths"]["heatmap_path"],
            capture_date=c_date,
            days_since_dressing=day_num,
            notes=note_text,
            image_width=640,
            image_height=480,
            file_size_kb=84.5,
            image_quality_score=ai_res["image_quality"]["score"],
            is_baseline=(day_num == 1)
        )
        db.add(w_img)
        db.flush()

        seg = ai_res["segmentation"]
        color = ai_res["color_features"]
        exudate = ai_res["exudate_features"]
        dim = ai_res["dimensional_measurements"]
        healing = ai_res["healing_assessment"]

        ai_an = AIAnalysis(
            wound_image_id=w_img.id,
            wound_id=w1.id,
            model_version=ai_res["model_version"],
            image_quality_status=ai_res["image_quality"]["status"],
            quality_metrics_json=ai_res["image_quality"]["metrics"],
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
            confidence_score=healing.get("confidence_score", 0.92),
            limitations_json=healing.get("limitations", []),
            observations_json=healing.get("patient_observations", []),
            disclaimer=healing.get("disclaimer", "")
        )
        db.add(ai_an)
        last_img_id = img_id

    # Add Doctor note for Wound 1
    doc_note1 = DoctorNote(
        wound_id=w1.id,
        wound_image_id=last_img_id,
        doctor_id=doc_user.id,
        doctor_name=doc_user.full_name,
        clinical_observation="Wound contraction is progressing nicely with no signs of peri-incisional infection or dressing breakdown. Granulation bed is well vascularized.",
        recommendations="Continue keeping the biopolymer film dry during showering. Plan dressing removal in 5 days.",
        follow_up_date=(datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d"),
        review_status="reviewed"
    )
    db.add(doc_note1)

    # 3. Create Demo Patient 2: Marcus Vance (Needs Monitoring - Venous Ulcer)
    pat2 = User(
        email="marcus.vance@healvision.demo",
        hashed_password=get_password_hash("PatientDemo2026!"),
        full_name="Marcus Vance",
        role="patient",
        phone="+1 (555) 438-9921",
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    )
    db.add(pat2)
    db.flush()

    pat2_profile = PatientProfile(
        user_id=pat2.id,
        date_of_birth="1964-11-22",
        gender="Male",
        emergency_contact="Clara Vance (Wife) - (555) 438-9922",
        medical_history="Chronic venous insufficiency. Stage 2 hypertension."
    )
    db.add(pat2_profile)

    w2 = Wound(
        patient_id=pat2.id,
        name="Left Medial Malleolus Venous Ulcer",
        wound_type="ulcer",
        body_location="Left Lower Leg / Ankle",
        first_observed_date=(datetime.now(timezone.utc) - timedelta(days=9)).strftime("%Y-%m-%d"),
        dressing_applied_date=(datetime.now(timezone.utc) - timedelta(days=9)).strftime("%Y-%m-%d"),
        dressing_type="Alginate-Hydrogel Biopolymer Membrane",
        status="active",
        description="Venous stasis ulcer on left lower leg under hydrating alginate-hydrogel transparent biopolymer sheet."
    )
    db.add(w2)
    db.flush()

    # Share Wound 2 with Dr. Chen
    share2 = SharedWound(
        wound_id=w2.id,
        patient_id=pat2.id,
        doctor_id=doc_user.id,
        doctor_email=doc_user.email,
        share_token=f"share_{uuid.uuid4().hex[:16]}",
        permissions="can_comment"
    )
    db.add(share2)

    # Generate Image Sequence for Wound 2: Day 1 -> Day 5 -> Day 9
    w2_stages = [
        ("ulcer_d1", 1, 9, "Initial baseline image of venous ulcer under hydrogel biopolymer membrane."),
        ("ulcer_d5", 5, 4, "Day 5 monitoring. Moderate slough persists, exudate stable."),
        ("ulcer_d9", 9, 0, "Day 9 monitoring. Fibrin reducing gradually.")
    ]

    for stage_name, day_num, days_ago, note_text in w2_stages:
        img_id = str(uuid.uuid4())
        fname = f"demo_w2_d{day_num}_{img_id[:8]}.jpg"
        full_img_path = generate_synthetic_wound_image(stage_name, fname)
        c_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        ai_res = ai_pipeline.analyze_image_file(image_path=full_img_path, image_id=img_id)

        w_img = WoundImage(
            id=img_id,
            wound_id=w2.id,
            image_url=f"/storage/images/{fname}",
            thumbnail_url=f"/storage/images/{fname}",
            mask_url=ai_res["relative_paths"]["mask_path"],
            overlay_url=ai_res["relative_paths"]["overlay_path"],
            heatmap_url=ai_res["relative_paths"]["heatmap_path"],
            capture_date=c_date,
            days_since_dressing=day_num,
            notes=note_text,
            image_width=640,
            image_height=480,
            file_size_kb=92.1,
            image_quality_score=ai_res["image_quality"]["score"],
            is_baseline=(day_num == 1)
        )
        db.add(w_img)
        db.flush()

        seg = ai_res["segmentation"]
        color = ai_res["color_features"]
        exudate = ai_res["exudate_features"]
        dim = ai_res["dimensional_measurements"]
        healing = ai_res["healing_assessment"]

        ai_an = AIAnalysis(
            wound_image_id=w_img.id,
            wound_id=w2.id,
            model_version=ai_res["model_version"],
            image_quality_status=ai_res["image_quality"]["status"],
            quality_metrics_json=ai_res["image_quality"]["metrics"],
            wound_area_px=seg.get("area_px", 0),
            estimated_area_cm2=dim.get("estimated_area_cm2", 0.0),
            calibration_factor=dim.get("calibration_factor_px_per_cm"),
            color_granulation_pct=color.get("granulation_pct", 0.0),
            color_slough_pct=color.get("slough_pct", 0.0),
            color_necrotic_pct=color.get("necrotic_pct", 0.0),
            color_pale_pct=color.get("pale_pct", 0.0),
            exudate_level=exudate.get("exudate_level", "Moderate"),
            exudate_area_pct=exudate.get("exudate_area_pct", 0.0),
            perimeter_px=seg.get("perimeter_px", 0.0),
            tissue_classification=color.get("primary_tissue", "Slough"),
            change_from_previous_json=healing.get("change_from_previous", {}),
            healing_trend=healing.get("healing_trend", "stable"),
            monitoring_status="needs_monitoring",
            confidence_score=0.88,
            limitations_json=healing.get("limitations", []),
            observations_json=healing.get("patient_observations", []),
            disclaimer=healing.get("disclaimer", "")
        )
        db.add(ai_an)

    # 4. Create Demo Patient 3: Elena Rostova (Possible Abnormal Change Alert)
    pat3 = User(
        email="elena.rostova@healvision.demo",
        hashed_password=get_password_hash("PatientDemo2026!"),
        full_name="Elena Rostova",
        role="patient",
        phone="+1 (555) 771-0034",
        avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    )
    db.add(pat3)
    db.flush()

    pat3_profile = PatientProfile(
        user_id=pat3.id,
        date_of_birth="1995-02-18",
        gender="Female",
        emergency_contact="Dmitri Rostov (Brother) - (555) 771-0035",
        medical_history="Trauma laceration. No prior health conditions."
    )
    db.add(pat3_profile)

    w3 = Wound(
        patient_id=pat3.id,
        name="Forearm Laceration Under Biopolymer Film",
        wound_type="traumatic",
        body_location="Right Forearm",
        first_observed_date=(datetime.now(timezone.utc) - timedelta(days=8)).strftime("%Y-%m-%d"),
        dressing_applied_date=(datetime.now(timezone.utc) - timedelta(days=8)).strftime("%Y-%m-%d"),
        dressing_type="Polyurethane-Chitosan Transparent Dressing",
        status="active",
        description="Traumatic laceration sustained during outdoor sports. Treated with transparent film dressing."
    )
    db.add(w3)
    db.flush()

    # Share Wound 3 with Dr. Chen
    share3 = SharedWound(
        wound_id=w3.id,
        patient_id=pat3.id,
        doctor_id=doc_user.id,
        doctor_email=doc_user.email,
        share_token=f"share_{uuid.uuid4().hex[:16]}",
        permissions="can_comment"
    )
    db.add(share3)

    # Generate Image Sequence for Wound 3: Day 1 -> Day 4 -> Day 8 (Abnormal escalation)
    w3_stages = [
        ("abnormal_d1", 1, 8, "Baseline Day 1 capture.", "healing_normally"),
        ("abnormal_d4", 4, 4, "Day 4 capture. Minor discomfort and warmth reported.", "needs_monitoring"),
        ("abnormal_d8", 8, 0, "Day 8 capture. Noticeable margin expansion and yellow fluid accumulation.", "possible_abnormal_change")
    ]

    last_w3_img_id = None
    for stage_name, day_num, days_ago, note_text, forced_status in w3_stages:
        img_id = str(uuid.uuid4())
        fname = f"demo_w3_d{day_num}_{img_id[:8]}.jpg"
        full_img_path = generate_synthetic_wound_image(stage_name, fname)
        c_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        ai_res = ai_pipeline.analyze_image_file(image_path=full_img_path, image_id=img_id)

        w_img = WoundImage(
            id=img_id,
            wound_id=w3.id,
            image_url=f"/storage/images/{fname}",
            thumbnail_url=f"/storage/images/{fname}",
            mask_url=ai_res["relative_paths"]["mask_path"],
            overlay_url=ai_res["relative_paths"]["overlay_path"],
            heatmap_url=ai_res["relative_paths"]["heatmap_path"],
            capture_date=c_date,
            days_since_dressing=day_num,
            notes=note_text,
            image_width=640,
            image_height=480,
            file_size_kb=88.4,
            image_quality_score=ai_res["image_quality"]["score"],
            is_baseline=(day_num == 1)
        )
        db.add(w_img)
        db.flush()

        seg = ai_res["segmentation"]
        color = ai_res["color_features"]
        exudate = ai_res["exudate_features"]
        dim = ai_res["dimensional_measurements"]
        healing = ai_res["healing_assessment"]

        ai_an = AIAnalysis(
            wound_image_id=w_img.id,
            wound_id=w3.id,
            model_version=ai_res["model_version"],
            image_quality_status=ai_res["image_quality"]["status"],
            quality_metrics_json=ai_res["image_quality"]["metrics"],
            wound_area_px=seg.get("area_px", 0),
            estimated_area_cm2=dim.get("estimated_area_cm2", 0.0),
            calibration_factor=dim.get("calibration_factor_px_per_cm"),
            color_granulation_pct=color.get("granulation_pct", 0.0),
            color_slough_pct=color.get("slough_pct", 0.0),
            color_necrotic_pct=color.get("necrotic_pct", 0.0),
            color_pale_pct=color.get("pale_pct", 0.0),
            exudate_level="High" if day_num == 8 else exudate.get("exudate_level", "Low"),
            exudate_area_pct=exudate.get("exudate_area_pct", 0.0),
            perimeter_px=seg.get("perimeter_px", 0.0),
            tissue_classification=color.get("primary_tissue", "Granulation"),
            change_from_previous_json=healing.get("change_from_previous", {}),
            healing_trend="worsening" if day_num == 8 else "stable",
            monitoring_status=forced_status,
            confidence_score=0.91,
            limitations_json=healing.get("limitations", []),
            observations_json=healing.get("patient_observations", []),
            disclaimer=healing.get("disclaimer", "")
        )
        db.add(ai_an)
        last_w3_img_id = img_id

    # Create Notifications
    notif_elena = Notification(
        user_id=pat3.id,
        title="Visual Change Alert",
        message="Visual assessment detected an increase in wound area and fluid pooling under the dressing. Please schedule an examination.",
        type="alert",
        related_wound_id=w3.id
    )
    db.add(notif_elena)

    notif_doc = Notification(
        user_id=doc_user.id,
        title="Clinical Triage Alert: Elena Rostova",
        message="Patient Elena Rostova's wound has triggered a 'Possible Abnormal Change' status. Clinical review recommended.",
        type="alert",
        related_wound_id=w3.id
    )
    db.add(notif_doc)

    db.commit()

    return {
        "status": "success",
        "message": "Demo research dataset seeded successfully.",
        "accounts": {
            "patient_1": {"email": "sarah.jenkins@healvision.demo", "password": "PatientDemo2026!", "name": "Sarah Jenkins", "case": "Normal Healing Progression"},
            "patient_2": {"email": "marcus.vance@healvision.demo", "password": "PatientDemo2026!", "name": "Marcus Vance", "case": "Needs Monitoring (Venous Ulcer)"},
            "patient_3": {"email": "elena.rostova@healvision.demo", "password": "PatientDemo2026!", "name": "Elena Rostova", "case": "Possible Abnormal Change Alert"},
            "doctor": {"email": "dr.robert.chen@healvision.demo", "password": "DoctorDemo2026!", "name": "Dr. Robert Chen, MD", "role": "Wound Care Specialist"}
        }
    }
