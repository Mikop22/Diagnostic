"""Patient management routes — create + list patients with XRP wallets."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException
from app.models.patient_management import PatientCreate, PatientRecord
from app.services.xrp_wallet import create_patient_wallet

router = APIRouter(prefix="/api/v1", tags=["patients"])


@router.get("/patients", response_model=list[PatientRecord])
async def list_patients(request: Request):
    """Return all patients from MongoDB."""
    db = request.app.state.mongo_client[request.app.state.db_name]
    cursor = db.patients.find({}, {"_id": 0})
    patients = []
    for doc in cursor:
        patients.append(PatientRecord(**doc))
    return patients


@router.post("/patients", response_model=PatientRecord)
async def create_patient(body: PatientCreate, request: Request):
    """Create a new patient with an XRP Testnet wallet."""
    # Generate XRP wallet
    try:
        wallet_info = await create_patient_wallet()
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"XRP wallet creation failed: {str(e)}",
        )

    patient_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    record = PatientRecord(
        id=patient_id,
        name=body.name,
        email=body.email,
        xrp_wallet_address=wallet_info["address"],
        xrp_wallet_seed=wallet_info["seed"],
        created_at=now,
        status="Pending",
        concern="",
    )

    # Save to MongoDB
    db = request.app.state.mongo_client[request.app.state.db_name]
    db.patients.insert_one(record.model_dump())

    return record
