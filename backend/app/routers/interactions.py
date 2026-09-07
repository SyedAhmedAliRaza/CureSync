"""CureSync Backend - Interactions router for drug interaction checking."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import InteractionCheckRequest, InteractionReport
from app.services.drug_service import drug_service
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/interactions/check", response_model=InteractionReport)
async def check_interactions(request: InteractionCheckRequest):
    """
    Check drug interactions for a list of medicines.
    Uses the local drug database for known interactions,
    then enhances with AI-powered analysis.
    """
    if len(request.medicines) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 medicines are required to check interactions",
        )

    # Step 1: Check local database
    interactions, has_emergency, emergency_message = drug_service.check_interactions(
        request.medicines
    )

    # Step 2: Get AI-enhanced analysis
    ai_analysis = ai_service.analyze_interactions(request.medicines, interactions, language=request.language)

    # Step 3: Build summary
    if not interactions:
        summary = (
            f"No known interactions found between {', '.join(request.medicines)} "
            "in our local database. However, this does not guarantee safety. "
            "Always consult a healthcare professional."
        )
    else:
        high_count = sum(1 for i in interactions if i.severity == "high")
        med_count = sum(1 for i in interactions if i.severity == "medium")
        low_count = sum(1 for i in interactions if i.severity == "low")

        parts = []
        if high_count:
            parts.append(f"{high_count} high-risk")
        if med_count:
            parts.append(f"{med_count} moderate")
        if low_count:
            parts.append(f"{low_count} low-risk")

        summary = f"Found {len(interactions)} interaction(s): {', '.join(parts)}."

    return InteractionReport(
        interactions=interactions,
        summary=summary,
        emergency_alert=has_emergency,
        emergency_message=emergency_message,
        ai_analysis=ai_analysis,
    )
