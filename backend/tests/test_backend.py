"""Comprehensive Automated Test Suite for Smart Wound Healing Monitor Backend & AI Engine."""

import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.db.session import Base, engine, SessionLocal
from backend.app.db.models import User, Wound, WoundImage, SharedWound
from ai_service.preprocessing.quality_checker import ImageQualityChecker
from ai_service.segmentation.wound_detector import WoundDetector
from ai_service.features.color_analyzer import TissueColorAnalyzer
from ai_service.features.exudate_detector import ExudateDetector
from ai_service.features.area_estimator import AreaEstimator
from ai_service.inference.healing_engine import HealingStatusEngine
from ai_service.pipeline import ai_pipeline

client = TestClient(app)


# 1. AI Pipeline & Computer Vision Unit Tests
def test_image_quality_checker_normal():
    # Crisp, well-lit test image
    img = np.ones((400, 400, 3), dtype=np.uint8) * 180
    # Add high contrast edges for focus
    cv2.circle(img, (200, 200), 80, (40, 50, 220), -1)
    res = ImageQualityChecker.evaluate_image(img)
    assert res["status"] in ["PASS", "WARNING"]
    assert res["is_usable"] is True
    assert res["score"] > 50.0


def test_image_quality_checker_blurry():
    # Extremely blurred/blank image
    img = np.ones((400, 400, 3), dtype=np.uint8) * 128
    res = ImageQualityChecker.evaluate_image(img)
    # Uniform image has 0 Laplacian variance -> blur fail
    assert res["status"] in ["FAIL", "WARNING"]
    assert res["metrics"]["blur_score"] < 40.0


def test_image_quality_checker_too_dark():
    # Very dark underexposed image (mean < 30)
    img = np.ones((400, 400, 3), dtype=np.uint8) * 15
    res = ImageQualityChecker.evaluate_image(img)
    assert res["status"] == "FAIL"
    assert res["is_usable"] is False
    assert any("dark" in issue.lower() for issue in res["issues"])


def test_wound_segmentation_and_color_analysis():
    # Synthetic wound image with red granulation center and yellow slough margin
    img = np.ones((400, 400, 3), dtype=np.uint8) * 180
    # Red granulation bed (BGR: 35, 45, 230)
    cv2.circle(img, (200, 200), 60, (35, 45, 230), -1)
    # Yellow slough patch (BGR: 20, 210, 240)
    cv2.circle(img, (180, 180), 20, (20, 210, 240), -1)

    seg_res = WoundDetector.segment_wound(img)
    assert seg_res["area_px"] > 0
    assert "mask" in seg_res

    color_res = TissueColorAnalyzer.analyze_colors(img, seg_res["mask"])
    assert color_res["granulation_pct"] > 0
    assert "heatmap_image" in color_res


def test_healing_status_engine_abnormal_detection():
    quality_res = {"status": "PASS", "is_usable": True, "score": 95.0, "issues": []}
    color_res = {"granulation_pct": 30.0, "slough_pct": 50.0, "necrotic_pct": 15.0, "pale_pct": 5.0}
    exudate_res = {"exudate_level": "High", "exudate_area_pct": 35.0, "fluid_pooling_detected": True}
    area_res = {"estimated_area_cm2": 5.5, "area_px": 8000}
    prev_analysis = {"wound_area_cm2": 4.0, "color_granulation_pct": 60.0, "color_slough_pct": 20.0}

    eval_res = HealingStatusEngine.evaluate(
        quality_res=quality_res,
        color_res=color_res,
        exudate_res=exudate_res,
        area_res=area_res,
        previous_analysis=prev_analysis
    )

    assert eval_res["monitoring_status"] == "possible_abnormal_change"
    assert eval_res["status_badge_color"] == "red"
    assert "research and monitoring" in eval_res["disclaimer"].lower()


# 2. REST API Integration Tests
def test_health_check_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "medical_disclaimer" in data


def test_demo_credentials_endpoint():
    res = client.get("/api/v1/demo/credentials")
    assert res.status_code == 200
    data = res.json()
    assert len(data["patients"]) >= 3
    assert len(data["doctors"]) >= 1


def test_demo_login_patient():
    res = client.post("/api/v1/auth/demo-login?role=patient")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "patient"
    assert data["user"]["email"] == "sarah.jenkins@healvision.demo"


def test_demo_login_doctor():
    res = client.post("/api/v1/auth/demo-login?role=doctor")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "doctor"
    assert data["user"]["email"] == "dr.robert.chen@healvision.demo"


def test_patient_wounds_list_and_isolation():
    # Login as Sarah Jenkins
    login_res = client.post("/api/v1/auth/demo-login?role=patient")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch wounds
    wounds_res = client.get("/api/v1/wounds", headers=headers)
    assert wounds_res.status_code == 200
    wounds = wounds_res.json()
    assert len(wounds) >= 1
    sarah_wound_id = wounds[0]["id"]

    # Register a new patient account to test isolation
    new_patient_email = "test.patient.iso@healvision.demo"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": new_patient_email,
        "password": "Password123!",
        "full_name": "Isolation Test Patient",
        "role": "patient"
    })
    if reg_res.status_code == 201:
        iso_token = reg_res.json()["access_token"]
    else:
        iso_token = client.post("/api/v1/auth/login", json={
            "email": new_patient_email,
            "password": "Password123!"
        }).json()["access_token"]

    iso_headers = {"Authorization": f"Bearer {iso_token}"}

    # New patient attempts to access Sarah's wound -> MUST be 403 Forbidden
    forbidden_res = client.get(f"/api/v1/wounds/{sarah_wound_id}", headers=iso_headers)
    assert forbidden_res.status_code == 403


def test_doctor_dashboard_stats_and_patients():
    login_res = client.post("/api/v1/auth/demo-login?role=doctor")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    stats_res = client.get("/api/v1/doctor/dashboard-stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_assigned_patients" in stats
    assert stats["total_assigned_patients"] >= 1

    patients_res = client.get("/api/v1/doctor/patients", headers=headers)
    assert patients_res.status_code == 200
    patients = patients_res.json()
    assert len(patients) >= 1


def test_clinical_report_generation():
    # Login as patient
    login_res = client.post("/api/v1/auth/demo-login?role=patient")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    wounds = client.get("/api/v1/wounds", headers=headers).json()
    wound_id = wounds[0]["id"]

    report_res = client.post("/api/v1/reports/generate", json={
        "wound_id": wound_id,
        "title": "Automated Test Clinical Report"
    }, headers=headers)
    assert report_res.status_code == 201
    report = report_res.json()
    assert "summary_json" in report
    assert "html_content" in report
    assert "Smart Wound Healing Monitor" in report["html_content"]


def test_notifications_flow():
    login_res = client.post("/api/v1/auth/demo-login?role=patient")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    notifs_res = client.get("/api/v1/notifications", headers=headers)
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert isinstance(notifs, list)

    count_res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert count_res.status_code == 200
    assert "unread_count" in count_res.json()
