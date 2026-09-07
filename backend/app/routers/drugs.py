"""CureSync Backend - Drugs router for searching the drug database."""
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import DrugInfo
from app.services.drug_service import drug_service

router = APIRouter()


@router.get("/drugs/search", response_model=list[DrugInfo])
async def search_drugs(
    q: str = Query(..., min_length=1, description="Search query for drug name"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
):
    """Search for drugs by name (partial match, case-insensitive)."""
    return drug_service.search(q, limit=limit)


@router.get("/drugs/{drug_id}", response_model=DrugInfo)
async def get_drug(drug_id: str):
    """Get detailed information about a specific drug by its ID."""
    drug = drug_service.get_drug(drug_id)
    if not drug:
        raise HTTPException(status_code=404, detail=f"Drug '{drug_id}' not found")
    return drug


@router.get("/drugs", response_model=list[str])
async def list_all_drug_names():
    """Get a list of all drug names in the database."""
    return drug_service.all_drug_names
