from typing import List
from sentence_transformers import SentenceTransformer

_model_instance: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    """Lazy singleton instantiation of local CPU sentence-transformers model."""
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer("all-MiniLM-L6-v2")
    return _model_instance


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate 384-dimensional float embeddings for a list of text chunks."""
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return [emb.tolist() for emb in embeddings]


def generate_query_embedding(query: str) -> List[float]:
    """Generate 384-dimensional float embedding for a search query string."""
    model = get_embedding_model()
    embedding = model.encode(query, convert_to_numpy=True)
    return embedding.tolist()
