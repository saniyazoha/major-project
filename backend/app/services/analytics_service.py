import json
import re
from typing import Optional, Dict, Any, List
from collections import Counter
from sqlalchemy.orm import Session

from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.glossary import Glossary
from app.models.lecture_analytics import LectureAnalytics

LOCKED_FILLER_WORDS = [
    "so",
    "basically",
    "like",
    "actually",
    "um",
    "uh",
    "you know",
]


class AnalyticsError(Exception):
    """Base exception for analytics operations."""
    pass


class TranscriptNotCompletedError(AnalyticsError):
    """Raised when transcript is missing or not in completed status."""
    pass


def select_source_text(corrected_text: Optional[str], raw_text: Optional[str]) -> Optional[str]:
    """Select transcript text for analytics text processing.

    Exact rule: corrected_text MUST be used if it is not None; otherwise raw_text is used.
    Do NOT use truthiness check (e.g. `if corrected_text:`).
    """
    return corrected_text if corrected_text is not None else raw_text


def compute_wpm_from_timestamps(segment_timestamps_json: Optional[str]) -> tuple[float, List[Dict[str, Any]]]:
    """Compute overall average WPM and segment-by-segment WPM strictly from segment_timestamps_json.

    Architectural Caveat:
    The timestamped segments represent the original ASR/translated segmentation.
    WPM must be computed strictly from timestamped segment data because corrected_text
    has no word-level timing alignment.
    """
    if not segment_timestamps_json:
        return 0.0, []

    try:
        segments = json.loads(segment_timestamps_json)
        if not isinstance(segments, list):
            return 0.0, []
    except Exception:
        return 0.0, []

    segment_wpms: List[Dict[str, Any]] = []
    total_words = 0
    total_duration_sec = 0.0

    for idx, seg in enumerate(segments):
        if not isinstance(seg, dict):
            continue

        text = str(seg.get("text", ""))
        try:
            start = float(seg.get("start", 0.0))
            end = float(seg.get("end", 0.0))
        except (ValueError, TypeError):
            start = 0.0
            end = 0.0

        duration_sec = max(0.0, end - start)
        words = len(re.findall(r"\b\w+\b", text))

        wpm = round(words / (duration_sec / 60.0), 2) if duration_sec > 0 else 0.0

        segment_wpms.append({
            "segment_id": idx,
            "start": start,
            "end": end,
            "word_count": words,
            "wpm": wpm,
        })

        total_words += words
        total_duration_sec += duration_sec

    avg_wpm = round(total_words / (total_duration_sec / 60.0), 2) if total_duration_sec > 0 else 0.0
    return avg_wpm, segment_wpms


def compute_word_frequency(source_text: Optional[str]) -> Dict[str, int]:
    """Compute normalized word frequency count from source text."""
    if not source_text or not source_text.strip():
        return {}

    words = re.findall(r"\b[a-zA-Z0-9'-]+\b", source_text.lower())
    counts = Counter(words)
    return dict(counts)


def compute_filler_word_counts(source_text: Optional[str]) -> Dict[str, int]:
    """Compute case-insensitive filler word counts from source text.

    Guarantees no substring matching inside unrelated words (e.g. 'like' in 'likely').
    """
    counts: Dict[str, int] = {word: 0 for word in LOCKED_FILLER_WORDS}
    if not source_text or not source_text.strip():
        return counts

    for filler in LOCKED_FILLER_WORDS:
        if filler == "you know":
            pattern = r"\byou\s+know\b"
        else:
            pattern = rf"\b{re.escape(filler)}\b"

        matches = re.findall(pattern, source_text, flags=re.IGNORECASE)
        counts[filler] = len(matches)

    return counts


def compute_keyword_frequency(source_text: Optional[str], glossary_terms: List[str]) -> Dict[str, int]:
    """Compute frequency of glossary keywords in source text.

    Supports terms containing symbols (e.g. C++, C#, .NET) as well as multi-word terms (e.g. Page Fault).
    Prevents false substring matches inside larger alphanumeric words.
    If glossary_terms is empty, returns {}.
    """
    if not glossary_terms:
        return {}

    counts: Dict[str, int] = {term: 0 for term in glossary_terms}
    if not source_text or not source_text.strip():
        return counts

    for term in glossary_terms:
        cleaned_term = term.strip()
        if not cleaned_term:
            continue

        pattern = r"(?<!\w)" + re.escape(cleaned_term) + r"(?!\w)"
        matches = re.findall(pattern, source_text, flags=re.IGNORECASE)
        counts[term] = len(matches)

    return counts


def compute_and_save_lecture_analytics(db: Session, lecture_id: int) -> LectureAnalytics:
    """Compute and persist lecture delivery analytics for a single lecture.

    Precondition:
    - Lecture must exist.
    - Lecture must have a Transcript with status == 'completed'.
    Otherwise raises TranscriptNotCompletedError.

    Persistence:
    - Upserts LectureAnalytics (1:1 per lecture). Recomputes and updates if row exists.
    - Strictly non-mutating to Lecture, Transcript, Note, Flashcard, Quiz, or Glossary.
    """
    # 1. Fetch transcript
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript or transcript.status != "completed":
        raise TranscriptNotCompletedError(
            f"Transcript for lecture {lecture_id} is missing or not completed."
        )

    # 2. Select source text for non-timing analysis (corrected_text if not None else raw_text)
    source_text = select_source_text(transcript.corrected_text, transcript.raw_text)

    # 3. Compute WPM metrics strictly from segment_timestamps_json
    avg_wpm, segment_wpms = compute_wpm_from_timestamps(transcript.segment_timestamps_json)

    # 4. Compute Word Frequency
    word_freq = compute_word_frequency(source_text)

    # 5. Compute Filler Word Counts
    filler_counts = compute_filler_word_counts(source_text)

    # 6. Compute Keyword Frequency based on Glossary terms (if any)
    glossary_items = db.query(Glossary).filter(Glossary.lecture_id == lecture_id).all()
    glossary_terms = [item.term for item in glossary_items]
    keyword_freq = compute_keyword_frequency(source_text, glossary_terms)

    # 7. Serialize JSON payloads
    wpm_by_segment_json = json.dumps(segment_wpms)
    word_frequency_json = json.dumps(word_freq)
    filler_word_counts_json = json.dumps(filler_counts)
    keyword_frequency_json = json.dumps(keyword_freq)

    # 8. Upsert LectureAnalytics row
    analytics = db.query(LectureAnalytics).filter(LectureAnalytics.lecture_id == lecture_id).first()
    if analytics:
        analytics.avg_wpm = avg_wpm
        analytics.wpm_by_segment_json = wpm_by_segment_json
        analytics.word_frequency_json = word_frequency_json
        analytics.filler_word_counts_json = filler_word_counts_json
        analytics.keyword_frequency_json = keyword_frequency_json
    else:
        analytics = LectureAnalytics(
            lecture_id=lecture_id,
            avg_wpm=avg_wpm,
            wpm_by_segment_json=wpm_by_segment_json,
            word_frequency_json=word_frequency_json,
            filler_word_counts_json=filler_word_counts_json,
            keyword_frequency_json=keyword_frequency_json,
        )
        db.add(analytics)

    db.commit()
    db.refresh(analytics)
    return analytics
