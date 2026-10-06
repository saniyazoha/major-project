from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.subject_glossary import SubjectGlossary


def upsert_subject_glossary_terms(
    db: Session, subject_id: int, glossary_items: List[Dict[str, Any]]
) -> List[SubjectGlossary]:
    """Upsert/add generated glossary terms to subject_glossary without creating duplicate normalized terms.

    Deduplication rules:
    - Term is normalized by trimming whitespace and converting to lowercase for checking.
    - If normalized_term already exists for subject_id, the duplicate is skipped.
    - Preserves case-preserved term representation and definition.
    """
    if not glossary_items:
        return []

    # Retrieve existing normalized terms for this subject
    existing_terms = {
        g.normalized_term
        for g in db.query(SubjectGlossary.normalized_term)
        .filter(SubjectGlossary.subject_id == subject_id)
        .all()
    }

    inserted_items: List[SubjectGlossary] = []

    for item in glossary_items:
        raw_term = item.get("term", "")
        raw_def = item.get("definition", "")

        if not raw_term or not raw_term.strip():
            continue

        clean_term = raw_term.strip()
        norm_term = clean_term.lower()

        if norm_term in existing_terms:
            continue

        clean_def = raw_def.strip() if raw_def else ""

        entry = SubjectGlossary(
            subject_id=subject_id,
            term=clean_term,
            normalized_term=norm_term,
            definition=clean_def,
        )
        try:
            db.add(entry)
            db.flush()
            existing_terms.add(norm_term)
            inserted_items.append(entry)
        except IntegrityError:
            db.rollback()
            # If concurrent insert happened, skip
            existing_terms.add(norm_term)

    return inserted_items
