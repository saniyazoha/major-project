from pydantic import BaseModel, ConfigDict
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
