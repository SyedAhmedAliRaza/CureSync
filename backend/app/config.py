"""CureSync Backend - Configuration management."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

# Set DashScope base URL for international region (Singapore)
# Must be set BEFORE importing dashscope modules
_dashscope_base = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope-intl.aliyuncs.com/api/v1")
os.environ["DASHSCOPE_BASE_URL"] = _dashscope_base


class Settings:
    """Application settings loaded from environment variables."""

    DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")
    ALIBABA_CLOUD_ACCESS_KEY_ID: str = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID", "")
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: str = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET", "")

    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))

    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")

    # Path to drug database
    DRUGS_DB_PATH: Path = Path(__file__).resolve().parent / "data" / "drugs_database.json"

    # Qwen model names
    QWEN_TEXT_MODEL: str = "qwen-plus"
    QWEN_VL_MODEL: str = "qwen-vl-plus"

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    @property
    def has_dashscope_key(self) -> bool:
        return bool(self.DASHSCOPE_API_KEY) and self.DASHSCOPE_API_KEY != "your_dashscope_api_key_here"

    @property
    def has_supabase(self) -> bool:
        return (
            bool(self.SUPABASE_URL)
            and bool(self.SUPABASE_ANON_KEY)
            and "your-project" not in self.SUPABASE_URL
            and "your-supabase" not in self.SUPABASE_ANON_KEY
        )

    @property
    def has_service_role_key(self) -> bool:
        return bool(self.SUPABASE_SERVICE_ROLE_KEY) and "paste_your" not in self.SUPABASE_SERVICE_ROLE_KEY


settings = Settings()
