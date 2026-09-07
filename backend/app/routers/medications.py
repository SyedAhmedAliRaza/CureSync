"""CureSync Backend - Medications router for schedule management."""
from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
)
from app.services.medication_service import medication_service
from app.routers.auth import get_current_user_id

router = APIRouter()


@router.get("/medications", response_model=list[MedicationResponse])
async def list_medications(request: Request, active_only: bool = True):
    """List all scheduled medications."""
    user_id = get_current_user_id(request)
    return medication_service.get_all_medications(active_only=active_only, user_id=user_id)


@router.post("/medications", response_model=MedicationResponse, status_code=201)
async def create_medication(data: MedicationCreate, request: Request):
    """Add a new medication to the schedule."""
    user_id = get_current_user_id(request)
    return medication_service.create_medication(data, user_id=user_id)


@router.get("/medications/{med_id}", response_model=MedicationResponse)
async def get_medication(med_id: str, request: Request):
    """Get details of a specific scheduled medication."""
    user_id = get_current_user_id(request)
    med = medication_service.get_medication(med_id, user_id=user_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    return med


@router.put("/medications/{med_id}", response_model=MedicationResponse)
async def update_medication(med_id: str, data: MedicationUpdate, request: Request):
    """Update an existing scheduled medication."""
    med = medication_service.update_medication(med_id, data)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    return med


@router.delete("/medications/{med_id}", status_code=204)
async def delete_medication(med_id: str, request: Request):
    """Remove a medication from the schedule."""
    if not medication_service.delete_medication(med_id):
        raise HTTPException(status_code=404, detail="Medication not found")


@router.post("/medications/{med_id}/deactivate", response_model=MedicationResponse)
async def deactivate_medication(med_id: str, request: Request):
    """Mark a medication as inactive (stopped/completed)."""
    med = medication_service.deactivate_medication(med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    return med
