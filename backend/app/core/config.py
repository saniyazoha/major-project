from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import urllib.parse
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "SABHA API"
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/sabha_db"

    # JWT Settings
    SECRET_KEY: str = "sabha-secret-key-phase1-backend-dev-mode-32bytes"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Supabase Storage Settings
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "lectures"

    # Groq ASR & LLM Settings
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "whisper-large-v3"
    GROQ_LLM_MODEL: str = "llama-3.3-70b-versatile"

    # Local Storage Settings (Fallback / Dev)
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None) -> str:
        if not v:
            return "postgresql+psycopg://postgres:postgres@localhost:5432/sabha_db"
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+psycopg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+psycopg://"):
            v = v.replace("postgresql://", "postgresql+psycopg://", 1)

        try:
            if "://" in v:
                scheme, rest = v.split("://", 1)
                if "@" in rest:
                    user_pass, host_db = rest.rsplit("@", 1)
                    if ":" in user_pass:
                        user, pwd = user_pass.split(":", 1)
                        unquoted_pwd = urllib.parse.unquote(pwd)
                        quoted_pwd = urllib.parse.quote(unquoted_pwd, safe="")
                        return f"{scheme}://{user}:{quoted_pwd}@{host_db}"
        except Exception:
            pass

        return v


settings = Settings()
