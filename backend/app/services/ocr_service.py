"""CureSync Backend - OCR service for prescription scanning using DashScope Qwen-VL."""
import base64
import io
from dashscope import MultiModalConversation
from app.config import settings
from app.services.ai_service import ai_service


class OCRService:
    """Service for prescription image text extraction using Qwen-VL or Alibaba Cloud OCR."""

    def __init__(self):
        self.api_key = settings.DASHSCOPE_API_KEY
        self.vl_model = settings.QWEN_VL_MODEL
        self._available = settings.has_dashscope_key

    @property
    def available(self) -> bool:
        return self._available

    async def scan_prescription(self, image_data: bytes, filename: str = "prescription.jpg") -> dict:
        """
        Scan a prescription image and extract text + structured medicine data.

        Args:
            image_data: Raw image bytes
            filename: Original filename (for MIME type detection)

        Returns:
            dict with 'raw_text' and 'medicines' keys
        """
        # Encode image to base64
        image_b64 = base64.b64encode(image_data).decode("utf-8")

        # Determine MIME type from filename
        mime_type = self._get_mime_type(filename)

        # Step 1: Extract raw text from image
        raw_text = await self._extract_text(image_b64, mime_type)

        # Step 2: Use Qwen to parse the raw text into structured medicines
        medicines = ai_service.parse_prescription_text(raw_text)

        # Step 3: Save to Supabase if available
        prescription_id = None
        try:
            from app.services.db_service import db_service
            if db_service.available:
                prescription = db_service.create_prescription(
                    user_id="00000000-0000-0000-0000-000000000000",
                    source_type="ocr_scan",
                    raw_ocr_text=raw_text,
                )
                if prescription:
                    prescription_id = prescription["id"]
                    for med in medicines:
                        db_service.create_prescription_item(
                            prescription_id,
                            {
                                "raw_text": f"{med.get('name', '')} {med.get('dosage', '')} {med.get('frequency', '')}",
                                "dosage": med.get("dosage", ""),
                                "frequency": med.get("frequency", ""),
                            }
                        )
        except Exception as e:
            print(f"Failed to save prescription to DB: {e}")

        return {
            "raw_text": raw_text,
            "medicines": medicines,
            "prescription_id": prescription_id,
        }

    async def _extract_text(self, image_b64: str, mime_type: str) -> str:
        """Extract text from an image using Qwen-VL multimodal model."""
        if not self._available:
            return self._offline_message()

        data_url = f"data:{mime_type};base64,{image_b64}"

        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "text": (
                            "You are a prescription OCR assistant. Extract ALL text from the prescription image. "
                            "Include medicine names, dosages, frequencies, doctor name, date, and any other visible text. "
                            "Preserve the layout as much as possible. Return only the extracted text, nothing else."
                        )
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {"image": data_url},
                    {"text": "Please extract all text from this prescription image."},
                ],
            },
        ]

        try:
            response = MultiModalConversation.call(
                model=self.vl_model,
                messages=messages,
                api_key=self.api_key,
            )

            if response.status_code == 200:
                return response.output.choices[0].message.content[0]["text"]
            else:
                print(f"OCR API error: {response.code} - {response.message}")
                return f"[OCR extraction failed: {response.message}]"

        except Exception as e:
            print(f"OCR service error: {e}")
            return f"[OCR extraction failed: {str(e)}]"

    @staticmethod
    def _get_mime_type(filename: str) -> str:
        """Determine MIME type from filename extension."""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        mime_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "bmp": "image/bmp",
            "webp": "image/webp",
            "tiff": "image/tiff",
            "tif": "image/tiff",
        }
        return mime_map.get(ext, "image/jpeg")

    @staticmethod
    def _offline_message() -> str:
        return (
            "[OCR service is offline - DashScope API key not configured. "
            "Set DASHSCOPE_API_KEY in backend/.env to enable prescription scanning.]"
        )


# Singleton instance
ocr_service = OCRService()
