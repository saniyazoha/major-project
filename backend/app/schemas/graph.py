from pydantic import BaseModel
from typing import List


class GraphNode(BaseModel):
    id: str
    label: str


class GraphEdge(BaseModel):
    id: int
    source: str
    target: str
    label: str


class KnowledgeGraphResponse(BaseModel):
    subject_id: int
    nodes: List[GraphNode]
    edges: List[GraphEdge]
