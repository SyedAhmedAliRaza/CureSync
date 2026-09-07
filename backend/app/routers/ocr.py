"""CureSync Backend - OCR router for prescription scanning."""
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import OCRScanResponse, ExtractedMedicine
from app.services.ocr_service import ocr_service

router = APIRouter()


@router.post("/ocr/scan", response_model=OCRScanResponse)
async def scan_prescription(file: UploadFile = File(...)):
    """
    Upload a prescription image for OCR scanning.
    Returns extracted text and structured medicine information.
    """
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp", "image/tiff"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Please upload an image file.",
        )

    # Read image data
    image_data = await file.read()

    # Validate file size (max 10MB)
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB.",
        )

    # Process the image
    result = await ocr_service.scan_prescription(image_data, file.filename or "prescription.jpg")

    # Build response
    medicines = []
    for med in result.get("medicines", []):
        medicines.append(
            ExtractedMedicine(
                name=med.get("name", "Unknown"),
                dosage=med.get("dosage", ""),
                frequency=med.get("frequency", ""),
                confidence=med.get("confidence", "low"),
            )
        )

    return OCRScanResponse(
        raw_text=result.get("raw_text", ""),
        medicines=medicines,
    )
