import json
import re
import time
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.models.glossary import Glossary
from app.services import transcription_service
from app.core.config import settings

MAX_GENERATION_RETRIES = 3
INITIAL_BACKOFF_SECONDS = 1.0


class GenerationError(Exception):
    """Base exception raised when generation service processing fails."""
    pass


class GenerationParseError(GenerationError):
    """Custom exception raised when LLM response JSON parsing or schema validation fails."""
    pass


def select_source_text(corrected_text: Optional[str], raw_text: Optional[str]) -> Optional[str]:
    """Select transcript text for generation.

    Exact rule: corrected_text MUST be used if it is not None; otherwise raw_text is used.
    Do NOT use truthiness check (e.g. `if corrected_text:`).
    """
    return corrected_text if corrected_text is not None else raw_text


def segment_transcript_into_topics(
    text: Optional[str],
    max_segment_chars: int = 2500,
    min_segment_chars: int = 200,
) -> List[Dict[str, Any]]:
    """Segment transcript text deterministically into logical topic blocks.

    - Handles empty or whitespace-only source text safely (returns []).
    - Produces no empty or whitespace-only segments.
    - Preserves the original text content within segments without silently rewriting or summarizing.
    - Groups text by paragraph/line boundaries while respecting target size windows.
    """
    if text is None or not text.strip():
        return []

    cleaned_text = text.strip()
    if not cleaned_text:
        return []

    # Split into raw paragraphs / lines while preserving non-empty blocks
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n|\r\n\s*\r\n", cleaned_text) if p.strip()]
    if not paragraphs:
        paragraphs = [cleaned_text]

    segments: List[Dict[str, Any]] = []
    current_chunks: List[str] = []
    current_length = 0

    for para in paragraphs:
        para_len = len(para)
        # If adding this paragraph exceeds max length and we already have content, finalize current segment
        if current_chunks and (current_length + para_len + 1 > max_segment_chars):
            segment_text = "\n\n".join(current_chunks).strip()
            if segment_text:
                segments.append({
                    "segment_index": len(segments),
                    "text": segment_text,
                    "char_count": len(segment_text),
                })
            current_chunks = []
            current_length = 0

        # If a single paragraph is larger than max_segment_chars, split by sentence boundaries
        if para_len > max_segment_chars:
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", para) if s.strip()]
            if not sentences:
                sentences = [para]
            for sentence in sentences:
                sent_len = len(sentence)
                if current_chunks and (current_length + sent_len + 1 > max_segment_chars):
                    segment_text = "\n\n".join(current_chunks).strip()
                    if segment_text:
                        segments.append({
                            "segment_index": len(segments),
                            "text": segment_text,
                            "char_count": len(segment_text),
                        })
                    current_chunks = []
                    current_length = 0
                current_chunks.append(sentence)
                current_length += sent_len + 1
        else:
            current_chunks.append(para)
            current_length += para_len + 1

    # Finalize remaining chunks
    if current_chunks:
        segment_text = "\n\n".join(current_chunks).strip()
        if segment_text:
            segments.append({
                "segment_index": len(segments),
                "text": segment_text,
                "char_count": len(segment_text),
            })

    return segments


def build_topic_segment_prompt(segment_text: str, segment_index: int = 0, total_segments: int = 1) -> str:
    """Build a structured prompt for a single topic segment requesting all 4 content types in one JSON response.

    Includes strict anti-hallucination and placeholder rules.
    """
    return f"""You are an expert educational AI assistant. Analyze the following transcript segment (Segment {segment_index + 1} of {total_segments}) and generate structured study materials.

TRANSCRIPT SEGMENT:
\"\"\"
{segment_text}
\"\"\"

MANDATORY INSTRUCTIONS & ANTI-HALLUCINATION RULES:
1. Use ONLY information directly supported by the supplied transcript segment.
2. Do NOT invent facts, extrapolate beyond the text, or introduce outside domain knowledge.
3. If the transcript segment is too short, garbled, ambiguous, or lacks meaningful educational substance, do NOT invent content. Instead, return explicit placeholder/sentinel text for notes_markdown (e.g., "[Insufficient or unclear transcript content for notes generation]") and return empty lists for flashcards, quizzes, and glossary.
4. Output MUST be a single valid JSON object strictly matching the specified JSON schema below.
5. Do NOT include markdown code blocks, conversational commentary, or trailing text outside the JSON object.

EXPECTED JSON SCHEMA:
{{
  "notes_markdown": "Markdown formatted detailed notes for this segment",
  "summary_text": "Concise summary contribution summarizing key points of this segment",
  "flashcards": [
    {{
      "question": "Clear question testing a key concept",
      "answer": "Accurate answer based strictly on the segment"
    }}
  ],
  "quizzes": [
    {{
      "question": "Multiple choice question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Brief explanation of why this answer is correct based on the segment"
    }}
  ],
  "glossary": [
    {{
      "term": "Key term or concept",
      "definition": "Clear definition as explained in the segment"
    }}
  ]
}}
"""


def parse_and_validate_generation_json(response_text: str) -> Dict[str, Any]:
    """Parse and validate LLM JSON response for a topic segment.

    Raises GenerationParseError if JSON is malformed, missing required keys, or contains invalid structures.
    """
    if not response_text or not response_text.strip():
        raise GenerationParseError("Response text is empty or whitespace only")

    cleaned = response_text.strip()
    # Remove markdown code block fences if present (e.g. ```json ... ```)
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    try:
        data = json.loads(cleaned)
    except Exception as e:
        raise GenerationParseError(f"Malformed JSON response: {str(e)}") from e

    if not isinstance(data, dict):
        raise GenerationParseError(f"Expected JSON object (dict), got {type(data).__name__}")

    required_keys = {"notes_markdown", "summary_text", "flashcards", "quizzes", "glossary"}
    missing_keys = required_keys - set(data.keys())
    if missing_keys:
        raise GenerationParseError(f"JSON response missing required keys: {sorted(list(missing_keys))}")

    if not isinstance(data["notes_markdown"], str):
        raise GenerationParseError("Field 'notes_markdown' must be a string")

    if not isinstance(data["summary_text"], str):
        raise GenerationParseError("Field 'summary_text' must be a string")

    if not isinstance(data["flashcards"], list):
        raise GenerationParseError("Field 'flashcards' must be a list")

    for idx, card in enumerate(data["flashcards"]):
        if not isinstance(card, dict) or "question" not in card or "answer" not in card:
            raise GenerationParseError(f"Flashcard at index {idx} must be an object with 'question' and 'answer'")

    if not isinstance(data["quizzes"], list):
        raise GenerationParseError("Field 'quizzes' must be a list")

    for idx, q in enumerate(data["quizzes"]):
        if not isinstance(q, dict) or "question" not in q or "options" not in q or "correct_answer" not in q:
            raise GenerationParseError(f"Quiz item at index {idx} must be an object with 'question', 'options', and 'correct_answer'")

    if not isinstance(data["glossary"], list):
        raise GenerationParseError("Field 'glossary' must be a list")

    for idx, item in enumerate(data["glossary"]):
        if not isinstance(item, dict) or "term" not in item or "definition" not in item:
            raise GenerationParseError(f"Glossary item at index {idx} must be an object with 'term' and 'definition'")

    return data


def call_groq_llm(prompt: str) -> str:
    """Call Groq LLM API with structured prompt using llama-3.3-70b-versatile."""
    client = transcription_service.get_groq_client()
    try:
        response = client.chat.completions.create(
            model=settings.GROQ_LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful educational AI assistant. Always output valid JSON strictly as instructed."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        choice = response.choices[0]
        return choice.message.content or ""
    except Exception as e:
        raise GenerationError(f"Groq LLM completion call failed: {str(e)}") from e


def process_lecture_generation(
    db: Session,
    lecture_id: int,
    max_retries: int = MAX_GENERATION_RETRIES,
    backoff_seconds: float = INITIAL_BACKOFF_SECONDS,
) -> Lecture:
    """Orchestrate multi-segment LLM content generation and atomic persistence for a lecture."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise GenerationError(f"Lecture with ID {lecture_id} not found")

    # Precondition: generation allowed only when Lecture.status is 'uploaded' or 'generation_failed'
    if lecture.status in ("draft", "broadcast"):
        raise GenerationError(f"Generation not allowed for lecture {lecture_id} in status '{lecture.status}'")

    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript or transcript.status != "completed":
        raise GenerationError(f"Transcript is missing or not completed for lecture {lecture_id}")

    # Select source text using exact rule
    source_text = select_source_text(transcript.corrected_text, transcript.raw_text)
    if source_text is None or not source_text.strip():
        raise GenerationError(f"No usable transcript source text available for lecture {lecture_id}")

    # Segment source text deterministically
    segments = segment_transcript_into_topics(source_text)
    if not segments:
        raise GenerationError(f"Failed to segment transcript text into topics for lecture {lecture_id}")

    # In-memory accumulators
    notes_parts: List[str] = []
    summary_parts: List[str] = []
    all_flashcards: List[Dict[str, str]] = []
    all_quizzes: List[Dict[str, Any]] = []
    all_glossary: List[Dict[str, str]] = []

    try:
        total_segments = len(segments)
        for idx, seg in enumerate(segments):
            prompt = build_topic_segment_prompt(seg["text"], segment_index=idx, total_segments=total_segments)

            parsed_data = None
            last_exception = None

            for attempt in range(1, max_retries + 1):
                try:
                    response_text = call_groq_llm(prompt)
                    parsed_data = parse_and_validate_generation_json(response_text)
                    last_exception = None
                    break  # Success, break retry loop
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries and backoff_seconds > 0:
                        time.sleep(backoff_seconds * attempt)

            if last_exception is not None or parsed_data is None:
                raise GenerationError(
                    f"Generation failed for segment {idx + 1}/{total_segments} after {max_retries} attempts: {str(last_exception)}"
                )

            # Collect results in memory
            if parsed_data.get("notes_markdown", "").strip():
                notes_parts.append(parsed_data["notes_markdown"].strip())

            if parsed_data.get("summary_text", "").strip():
                summary_parts.append(parsed_data["summary_text"].strip())

            all_flashcards.extend(parsed_data.get("flashcards", []))
            all_quizzes.extend(parsed_data.get("quizzes", []))
            all_glossary.extend(parsed_data.get("glossary", []))

        # ALL segments succeeded! Perform single atomic DB transaction
        # Construct single Note row
        combined_notes = "\n\n---\n\n".join(notes_parts) if notes_parts else "No notes generated."
        combined_summary = "\n\n".join(summary_parts) if summary_parts else "No summary generated."
        note_obj = Note(
            lecture_id=lecture.id,
            markdown_content=combined_notes,
            summary_text=combined_summary,
        )
        db.add(note_obj)

        # Construct Flashcard rows
        for card in all_flashcards:
            fc_obj = Flashcard(
                lecture_id=lecture.id,
                question=card["question"],
                answer=card["answer"],
            )
            db.add(fc_obj)

        # Construct Quiz rows
        for q in all_quizzes:
            options_val = q["options"]
            options_str = json.dumps(options_val) if isinstance(options_val, list) else str(options_val)
            quiz_obj = Quiz(
                lecture_id=lecture.id,
                question=q["question"],
                options_json=options_str,
                correct_answer=q["correct_answer"],
                explanation=q.get("explanation"),
            )
            db.add(quiz_obj)

        # Construct Glossary rows
        for item in all_glossary:
            g_obj = Glossary(
                lecture_id=lecture.id,
                term=item["term"],
                definition=item["definition"],
            )
            db.add(g_obj)

        # Update Lecture status to draft & clear error message
        lecture.status = "draft"
        lecture.generation_error_message = None

        db.commit()
        db.refresh(lecture)
        return lecture

    except Exception as e:
        db.rollback()
        # Ensure failure state update persists separately without leaving partial rows
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if lecture:
            lecture.status = "generation_failed"
            lecture.generation_error_message = str(e)
            db.commit()

        raise GenerationError(f"Generation orchestration failed for lecture {lecture_id}: {str(e)}") from e
