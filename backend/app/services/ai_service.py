"""CureSync Backend - AI service using Alibaba Cloud DashScope (Qwen models)."""
import json
import dashscope
from dashscope import Generation
from app.config import settings
from app.models.schemas import ChatMessage, InteractionDetail

# Set international endpoint for DashScope SDK
dashscope.base_http_api_url = "https://dashscope-intl.aliyuncs.com/api/v1"


# ── System prompts ──────────────────────────────────────────────────────────

CHAT_SYSTEM_PROMPT = """You are CureSync AI Health Assistant, a knowledgeable and empathetic medication information assistant.

TOPIC RESTRICTION - MEDICINES ONLY:
- You answer ONLY questions about medicines and medications: their uses, dosage, side
  effects, drug interactions, storage, precautions, missed doses, generic vs brand
  names, and medication safety.
- You may also answer follow-up questions about your own previous answers
  (clarifications, explanations, or summaries of medication information).
- If the user asks about ANYTHING else (general chat, technology, sports, politics,
  entertainment, or any other non-medication topic), politely decline in one or two
  sentences and remind them you can only answer medicine-related questions.
  Never answer off-topic questions, not even partially.

Your role (for medication questions):
- Provide clear, accurate, and easy-to-understand medication information
- Explain drug interactions, side effects, and dosage guidance in simple language
- Always recommend consulting a healthcare professional for medical decisions
- For high-risk situations, strongly advise immediate medical attention
- Be supportive and patient, especially with elderly users

SUMMARIES:
- When the user asks you to summarize your previous response or any part of the
  conversation, ALWAYS produce a summary of AT LEAST 50 words. Never shorter.
- Include the medicines discussed, their effects, risks, and key recommendations
  to naturally reach the minimum length.

IMPORTANT DISCLAIMERS you must communicate:
- You are NOT a substitute for professional medical advice
- Always recommend consulting a doctor or pharmacist for personalized advice
- In emergencies, advise calling emergency services

Keep responses concise, well-structured, and actionable."""

LANGUAGE_INSTRUCTION = """IMPORTANT: Respond entirely in the following language: {language}.
Use the native script and natural phrasing for that language.
Language codes: en=English, bal=Balochi, sd=Sindhi, ps=Pashto, pa=Punjabi.
If the language is not English, still keep medicine names in English alongside the local translation."""

INTERACTION_ANALYSIS_PROMPT = """You are a clinical pharmacology assistant analyzing drug interactions.

Given a list of medications and pre-checked interaction data from a drug database, provide:
1. A clear summary of the interaction risks in plain language
2. Specific symptoms to watch for
3. Practical recommendations for the patient
4. An overall risk assessment

Format your response as a brief, patient-friendly summary (2-4 paragraphs).
If there are HIGH severity interactions, begin with a clear warning.
Always end by recommending consultation with a healthcare provider."""

PRESCRIPTION_PARSE_PROMPT = """You are a prescription text parser. Given raw text extracted from a prescription image via OCR, identify and structure the medication information.

Return your response as a JSON array with objects containing:
- "name": the medicine name (generic name if possible)
- "dosage": the dosage (e.g., "500mg")
- "frequency": how often to take it (e.g., "twice daily")
- "confidence": "high", "medium", or "low" based on how clearly the text indicates the medicine

If the text is unclear or contains non-medical content, include what you can identify and set confidence to "low".

Return ONLY the JSON array, no other text. Example:
[{"name": "Amoxicillin", "dosage": "500mg", "frequency": "3 times daily", "confidence": "high"}]"""


class AIService:
    """Service for Qwen AI model interactions via DashScope SDK."""

    def __init__(self):
        self.api_key = settings.DASHSCOPE_API_KEY
        self.text_model = settings.QWEN_TEXT_MODEL
        self._available = settings.has_dashscope_key

    @property
    def available(self) -> bool:
        return self._available

    def health_chat(self, message: str, history: list[ChatMessage], language: str = "en") -> str:
        """
        Process a health-related chat message with conversation history.
        Returns the assistant's reply.
        """
        if not self._available:
            return self._offline_response(message)

        system_prompt = CHAT_SYSTEM_PROMPT
        if language and language != "en":
            system_prompt += "\n\n" + LANGUAGE_INSTRUCTION.format(language=language)

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        # Add current message
        messages.append({"role": "user", "content": message})

        try:
            response = Generation.call(
                model=self.text_model,
                messages=messages,
                api_key=self.api_key,
                result_format="message",
            )

            if response.status_code == 200:
                return response.output.choices[0].message.content
            else:
                print(f"DashScope API error: {response.code} - {response.message}")
                return self._offline_response(message)

        except Exception as e:
            print(f"AI service error: {e}")
            return self._offline_response(message)

    def analyze_interactions(
        self, medicine_names: list[str], local_interactions: list[InteractionDetail], language: str = "en"
    ) -> str:
        """
        Use Qwen to provide an AI-powered analysis of drug interactions.
        Combines local database results with AI reasoning.
        """
        if not self._available:
            return self._offline_interaction_analysis(medicine_names, local_interactions)

        # Build context from local database findings
        local_context = "No known interactions found in the local database."
        if local_interactions:
            parts = []
            for interaction in local_interactions:
                parts.append(
                    f"- {interaction.drug_a} + {interaction.drug_b}: "
                    f"{interaction.severity.upper()} severity - {interaction.description}"
                )
            local_context = "\n".join(parts)

        user_message = (
            f"Medications to analyze: {', '.join(medicine_names)}\n\n"
            f"Pre-checked interaction data:\n{local_context}\n\n"
            "Please provide a patient-friendly summary of the interaction risks."
        )

        messages = [
            {"role": "system", "content": INTERACTION_ANALYSIS_PROMPT},
            {"role": "user", "content": user_message},
        ]

        if language and language != "en":
            messages[0]["content"] += "\n\n" + LANGUAGE_INSTRUCTION.format(language=language)

        try:
            response = Generation.call(
                model=self.text_model,
                messages=messages,
                api_key=self.api_key,
                result_format="message",
            )

            if response.status_code == 200:
                return response.output.choices[0].message.content
            else:
                print(f"DashScope API error: {response.code} - {response.message}")
                return self._offline_interaction_analysis(medicine_names, local_interactions)

        except Exception as e:
            print(f"AI interaction analysis error: {e}")
            return self._offline_interaction_analysis(medicine_names, local_interactions)

    def parse_prescription_text(self, ocr_text: str) -> list[dict]:
        """
        Use Qwen to parse raw OCR text into structured medicine information.
        Returns a list of extracted medicine dicts.
        """
        if not self._available:
            return self._offline_parse(ocr_text)

        messages = [
            {"role": "system", "content": PRESCRIPTION_PARSE_PROMPT},
            {"role": "user", "content": f"Parse the following prescription text:\n\n{ocr_text}"},
        ]

        try:
            response = Generation.call(
                model=self.text_model,
                messages=messages,
                api_key=self.api_key,
                result_format="message",
            )

            if response.status_code == 200:
                content = response.output.choices[0].message.content.strip()
                # Try to parse as JSON
                # Strip markdown code fences if present
                if content.startswith("```"):
                    content = content.split("\n", 1)[-1]
                    if content.endswith("```"):
                        content = content[:-3]
                    content = content.strip()

                medicines = json.loads(content)
                if isinstance(medicines, list):
                    return medicines
                return [medicines] if isinstance(medicines, dict) else []
            else:
                print(f"DashScope API error: {response.code} - {response.message}")
                return self._offline_parse(ocr_text)

        except (json.JSONDecodeError, KeyError, Exception) as e:
            print(f"AI prescription parsing error: {e}")
            return self._offline_parse(ocr_text)

    # ── Offline fallback responses ──────────────────────────────────────────

    @staticmethod
    def _offline_response(message: str) -> str:
        """Provide a helpful offline response when AI service is unavailable."""
        return (
            "I'm currently operating in offline mode as the AI service (DashScope) is not configured.\n\n"
            "Note: I can only answer questions about medicines and medications.\n\n"
            "To enable the full AI-powered health assistant, please set your DASHSCOPE_API_KEY "
            "in the backend/.env file.\n\n"
            "In the meantime, I can tell you that:\n"
            "- You can still search for drugs and check interactions using our local database\n"
            "- Drug interaction checking works without AI\n"
            "- For medical emergencies, please contact your healthcare provider or emergency services\n\n"
            "For general health questions, I recommend consulting reliable sources like:\n"
            "- Your pharmacist or doctor\n"
            "- Official medication leaflets\n"
            "- Reputable health websites"
        )

    @staticmethod
    def _offline_interaction_analysis(
        medicines: list[str], interactions: list[InteractionDetail]
    ) -> str:
        """Provide offline interaction summary."""
        if not interactions:
            return (
                f"No known interactions found between: {', '.join(medicines)}.\n\n"
                "Note: This is based on our local database only. "
                "Always consult your pharmacist or doctor for a comprehensive interaction check."
            )

        lines = [f"Interaction Summary for: {', '.join(medicines)}\n"]
        for ix in interactions:
            emoji = {"high": "[!]", "medium": "[~]", "low": "[i]"}[ix.severity]
            lines.append(f"{emoji} {ix.drug_a} + {ix.drug_b} ({ix.severity.upper()}): {ix.description}")
            lines.append(f"   Recommendation: {ix.recommendation}\n")

        lines.append("Note: AI-enhanced analysis is offline. Configure DASHSCOPE_API_KEY for detailed AI insights.")
        return "\n".join(lines)

    @staticmethod
    def _offline_parse(ocr_text: str) -> list[dict]:
        """Basic offline prescription parsing (simple line-by-line extraction)."""
        medicines = []
        for line in ocr_text.strip().split("\n"):
            line = line.strip()
            if not line or len(line) < 3:
                continue
            # Very basic heuristic: look for lines that might contain drug names
            parts = line.split()
            name_parts = []
            dosage = ""
            for part in parts:
                if any(c.isdigit() for c in part) and any(c.isalpha() for c in part):
                    dosage = part
                elif any(c.isdigit() for c in part):
                    dosage = part
                else:
                    name_parts.append(part)

            if name_parts:
                medicines.append({
                    "name": " ".join(name_parts),
                    "dosage": dosage,
                    "frequency": "",
                    "confidence": "low",
                })

        return medicines


# Singleton instance
ai_service = AIService()
