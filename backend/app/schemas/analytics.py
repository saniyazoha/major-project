from pydantic import BaseModel, ConfigDict
from datetime import datetime


class LectureAnalyticsResponse(BaseModel):
    id: int
    lecture_id: int
    avg_wpm: float
    wpm_by_segment_json: str
    word_frequency_json: str
    filler_word_counts_json: str
    keyword_frequency_json: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
