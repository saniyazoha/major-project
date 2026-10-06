from pydantic import BaseModel
from typing import List


class SearchResultItem(BaseModel):
    id: int
    lecture_id: int
    lecture_title: str
    subject_id: int
    chunk_text: str
    similarity_score: float


class SearchResponse(BaseModel):
    query: str
    subject_id: int
    results: List[SearchResultItem]
