import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.concept_edge import ConceptEdge
from app.services import generation_service


def build_concept_extraction_prompt(
    glossary_items: List[Dict[str, Any]], notes_markdown: str
) -> str:
    """Build a structured prompt requesting concept relationship edges extracted strictly from lecture content."""
    glossary_text = json.dumps(glossary_items, indent=2) if glossary_items else "None"
    return f"""You are an educational AI assistant specializing in knowledge domain modeling.
Analyze the following lecture glossary items and notes, and extract conceptual relationships (concept edges) between key domain concepts.

LECTURE GLOSSARY:
\"\"\"
{glossary_text}
\"\"\"

LECTURE NOTES:
\"\"\"
{notes_markdown}
\"\"\"

MANDATORY INSTRUCTIONS & ANTI-HALLUCINATION RULES:
1. Extract concept relationships (source_term, target_term, relationship_label) grounded ONLY in the supplied glossary and notes content.
2. Do NOT invent facts, extrapolate beyond the text, or introduce outside domain knowledge.
3. If the content lacks clear conceptual relationships, return an empty list for "concept_edges".
4. Output MUST be a single valid JSON object strictly matching the specified JSON schema below.
5. Do NOT include markdown code blocks, conversational commentary, or text outside the JSON object.

EXPECTED JSON SCHEMA:
{{
  "concept_edges": [
    {{
      "source_term": "Concept A",
      "target_term": "Concept B",
      "relationship_label": "relationship description"
    }}
  ]
}}
"""


def extract_and_save_concept_edges(
    db: Session,
    lecture_id: int,
    subject_id: int,
    glossary_items: List[Dict[str, Any]],
    notes_markdown: str,
) -> List[ConceptEdge]:
    """Extract concept edges via LLM completion and persist ConceptEdge records for the lecture and subject.

    Clears pre-existing concept edges for this lecture to ensure repeat generation does not create uncontrolled duplicates.
    """
    # Delete existing concept edges for this lecture
    db.query(ConceptEdge).filter(ConceptEdge.lecture_id == lecture_id).delete(synchronize_session="fetch")
    db.flush()

    if not glossary_items and not (notes_markdown and notes_markdown.strip()):
        return []

    prompt = build_concept_extraction_prompt(glossary_items, notes_markdown)

    try:
        response_text = generation_service.call_groq_llm(prompt)
        if not response_text or not response_text.strip():
            return []

        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        data = json.loads(cleaned)
        if not isinstance(data, dict) or "concept_edges" not in data or not isinstance(data["concept_edges"], list):
            return []

        raw_edges = data["concept_edges"]
        seen_keys = set()
        saved_edges: List[ConceptEdge] = []

        for edge_item in raw_edges:
            if not isinstance(edge_item, dict):
                continue
            src = edge_item.get("source_term", "").strip()
            tgt = edge_item.get("target_term", "").strip()
            rel = edge_item.get("relationship_label", "").strip()

            if not src or not tgt or not rel:
                continue

            dedup_key = (src.lower(), tgt.lower(), rel.lower())
            if dedup_key in seen_keys:
                continue

            seen_keys.add(dedup_key)
            edge_obj = ConceptEdge(
                lecture_id=lecture_id,
                subject_id=subject_id,
                source_term=src,
                target_term=tgt,
                relationship_label=rel,
            )
            db.add(edge_obj)
            saved_edges.append(edge_obj)

        return saved_edges

    except Exception as e:
        # If extraction fails gracefully, return empty list; parent transaction can handle errors
        return []
