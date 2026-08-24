"""Demo Data Management Endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ....db.session import get_db
from ....db.seed_demo import seed_demo_database

router = APIRouter()


@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """Initializes the database with authentic research demo cases, images, and clinical histories."""
    result = seed_demo_database(db)
    return result


@router.get("/credentials")
def get_demo_credentials():
    """Returns demo login credentials for quick evaluation."""
    return {
        "patients": [
            {
                "name": "Sarah Jenkins",
                "email": "sarah.jenkins@healvision.demo",
                "password": "PatientDemo2026!",
                "case_description": "Post-Op Abdominal Incision (Normal Healing Day 1 → 14)",
                "dressing": "Chitosan-Gelatin Biopolymer Film"
            },
            {
                "name": "Marcus Vance",
                "email": "marcus.vance@healvision.demo",
                "password": "PatientDemo2026!",
                "case_description": "Venous Stasis Lower Extremity Ulcer (Needs Monitoring)",
                "dressing": "Alginate-Hydrogel Biopolymer Sheet"
            },
            {
                "name": "Elena Rostova",
                "email": "elena.rostova@healvision.demo",
                "password": "PatientDemo2026!",
                "case_description": "Traumatic Forearm Laceration (Possible Abnormal Change Alert)",
                "dressing": "Polyurethane-Chitosan Dressing"
            }
        ],
        "doctors": [
            {
                "name": "Dr. Robert Chen, MD",
                "email": "dr.robert.chen@healvision.demo",
                "password": "DoctorDemo2026!",
                "specialty": "Wound Care & Regenerative Biopolymers Specialist",
                "hospital": "Memorial Center for Advanced Wound Healing"
            }
        ]
    }
