from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class LectureResponse(BaseModel):
    id: int
    title: str
    subject_id: int
    batch_id: int
    faculty_id: int
    original_filename: str
    file_type: str
    file_size: int
    storage_path: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
