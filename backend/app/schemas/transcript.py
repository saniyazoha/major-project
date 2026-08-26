from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime


class TranscriptResponse(BaseModel):
    id: int
    lecture_id: int
    raw_text: str | None = None
    corrected_text: str | None = None
    segment_timestamps_json: str | None = None
    status: str
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TranscriptUpdate(BaseModel):
    corrected_text: str

    @field_validator("corrected_text")
    @classmethod
    def validate_corrected_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Corrected text cannot be empty or whitespace only")
        return v
