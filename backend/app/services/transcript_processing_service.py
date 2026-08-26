import json
import time
from sqlalchemy.orm import Session
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.services import storage_service, audio_chunking_service, transcription_service

MAX_CHUNK_RETRIES = 3
INITIAL_BACKOFF_SECONDS = 1.0


class TranscriptProcessingError(Exception):
    """Custom exception raised when lecture transcription orchestration fails."""
    pass


def process_lecture_transcription(
    db: Session,
    lecture_id: int,
    max_retries: int = MAX_CHUNK_RETRIES,
    backoff_seconds: float = INITIAL_BACKOFF_SECONDS,
) -> Transcript:
    """Orchestrate downloading audio, chunking, Groq translation with retry, timestamp offsetting, and transcript persistence for a lecture."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise TranscriptProcessingError(f"Lecture with ID {lecture_id} not found")

    # Get or initialize Transcript record
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture.id).first()
    if not transcript:
        transcript = Transcript(
            lecture_id=lecture.id,
            status="uploaded",
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)

    # Set status to processing before starting external work
    transcript.status = "processing"
    transcript.error_message = None
    db.commit()

    try:
        # Step 1: Download audio bytes from storage
        audio_bytes = storage_service.download_lecture_file(lecture.storage_path)

        # Step 2: Chunk audio bytes into sequential segments <= 170 seconds
        chunks = audio_chunking_service.chunk_audio_bytes(
            file_bytes=audio_bytes,
            filename=lecture.original_filename
        )

        # Step 3: Process chunks sequentially with controlled retries per chunk
        chunk_texts = []
        all_segments = []

        for chunk in chunks:
            chunk_result = None
            last_exception = None

            for attempt in range(1, max_retries + 1):
                try:
                    result = transcription_service.translate_audio_to_english(
                        audio_file=chunk["file_bytes"],
                        filename=chunk["filename"]
                    )
                    chunk_result = result
                    last_exception = None
                    break  # Translation succeeded, exit retry loop
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries and backoff_seconds > 0:
                        time.sleep(backoff_seconds * attempt)

            if last_exception is not None or chunk_result is None:
                raise TranscriptProcessingError(
                    f"Groq translation failed for chunk {chunk['chunk_index']} after {max_retries} attempts: {str(last_exception)}"
                )

            # Collect text
            text = chunk_result.get("text", "").strip()
            if text:
                chunk_texts.append(text)

            # Collect and offset segments
            chunk_start = chunk.get("start_time", 0.0)
            raw_segments = chunk_result.get("segments", [])
            if isinstance(raw_segments, list):
                for seg in raw_segments:
                    if isinstance(seg, dict):
                        adj_seg = dict(seg)
                        if "start" in adj_seg and isinstance(adj_seg["start"], (int, float)):
                            adj_seg["start"] = round(chunk_start + adj_seg["start"], 3)
                        if "end" in adj_seg and isinstance(adj_seg["end"], (int, float)):
                            adj_seg["end"] = round(chunk_start + adj_seg["end"], 3)
                        all_segments.append(adj_seg)

        # Step 4: Combine text in chunk order and serialize offset segments
        combined_transcript = " ".join(chunk_texts)
        serialized_timestamps = json.dumps(all_segments) if all_segments else None

        # Step 5: Save completed result
        transcript.raw_text = combined_transcript
        transcript.corrected_text = None
        transcript.segment_timestamps_json = serialized_timestamps
        transcript.status = "completed"
        transcript.error_message = None
        db.commit()
        db.refresh(transcript)
        return transcript

    except Exception as e:
        db.rollback()
        # Reload transcript object to update status to failed
        transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture.id).first()
        if transcript:
            transcript.status = "failed"
            transcript.error_message = str(e)
            db.commit()
        raise TranscriptProcessingError(f"Transcription processing failed for lecture {lecture_id}: {str(e)}") from e
