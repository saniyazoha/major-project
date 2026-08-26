import os
from typing import Dict, Any, Union, BinaryIO
from groq import Groq
from app.core.config import settings


class TranscriptionError(Exception):
    """Custom exception raised when audio translation/transcription fails."""
    pass


def get_groq_client() -> Groq:
    """Initialize and return Groq client instance using settings.GROQ_API_KEY."""
    if not settings.GROQ_API_KEY:
        raise TranscriptionError("GROQ_API_KEY configuration is missing or empty")
    try:
        return Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        raise TranscriptionError(f"Failed to initialize Groq client: {str(e)}") from e


def translate_audio_to_english(
    audio_file: Union[str, BinaryIO, bytes],
    filename: str = "audio.mp3"
) -> Dict[str, Any]:
    """Translate audio file to English using Groq whisper-large-v3 /audio/translations endpoint.

    Requests verbose_json output format to retain timing/segment metadata for downstream analysis.
    Isolates external Groq SDK invocation details.
    """
    client = get_groq_client()

    file_to_close = None
    try:
        if isinstance(audio_file, str):
            if not os.path.exists(audio_file):
                raise TranscriptionError(f"Audio file not found at path: {audio_file}")
            file_obj = open(audio_file, "rb")
            file_to_close = file_obj
            file_tuple = (os.path.basename(audio_file), file_obj)
        elif isinstance(audio_file, bytes):
            file_tuple = (filename, audio_file)
        else:
            file_tuple = (filename, audio_file)

        response = client.audio.translations.create(
            file=file_tuple,
            model="whisper-large-v3",
            response_format="verbose_json",
        )

        if hasattr(response, "model_dump"):
            result_data = response.model_dump()
        elif isinstance(response, dict):
            result_data = response
        else:
            result_data = {
                "text": getattr(response, "text", ""),
                "language": getattr(response, "language", "english"),
                "duration": getattr(response, "duration", None),
                "segments": getattr(response, "segments", []),
            }

        text = result_data.get("text", "")
        if not text and hasattr(response, "text"):
            text = response.text

        return {
            "text": text,
            "language": result_data.get("language", "english"),
            "duration": result_data.get("duration"),
            "segments": result_data.get("segments", []),
            "raw_response": result_data,
        }

    except TranscriptionError:
        raise
    except Exception as e:
        raise TranscriptionError(f"Groq ASR translation failed: {str(e)}") from e
    finally:
        if file_to_close:
            try:
                file_to_close.close()
            except Exception:
                pass
