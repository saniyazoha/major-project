import pytest
from unittest.mock import MagicMock
from app.core.config import settings
from app.services import transcription_service
from app.services.transcription_service import TranscriptionError


def test_missing_groq_api_key_raises_transcription_error(monkeypatch):
    monkeypatch.setattr(settings, "GROQ_API_KEY", "")
    with pytest.raises(TranscriptionError) as exc_info:
        transcription_service.translate_audio_to_english(b"dummy_bytes")
    assert "GROQ_API_KEY configuration is missing or empty" in str(exc_info.value)


def test_translate_audio_uses_whisper_large_v3_translation_and_verbose_json(monkeypatch):
    monkeypatch.setattr(settings, "GROQ_API_KEY", "gsk_test_mock_api_key_12345")

    # Mock response object returned by Groq API
    mock_response = MagicMock()
    mock_response.text = "Welcome to the operating systems lecture."
    mock_response.language = "english"
    mock_response.duration = 15.4
    mock_response.segments = [{"id": 0, "start": 0.0, "end": 5.0, "text": "Welcome to operating systems"}]
    mock_response.model_dump.return_value = {
        "text": "Welcome to the operating systems lecture.",
        "language": "english",
        "duration": 15.4,
        "segments": [{"id": 0, "start": 0.0, "end": 5.0, "text": "Welcome to operating systems"}]
    }

    mock_client = MagicMock()
    mock_client.audio.translations.create.return_value = mock_response

    monkeypatch.setattr(transcription_service, "get_groq_client", lambda: mock_client)

    audio_bytes = b"fake_mp3_binary_data_header"
    result = transcription_service.translate_audio_to_english(audio_bytes, filename="test_lecture.mp3")

    # 1. Verify translations endpoint was called (NOT transcriptions endpoint)
    mock_client.audio.translations.create.assert_called_once()
    mock_client.audio.transcriptions.create.assert_not_called()

    # 2. Verify model and response_format parameters
    call_kwargs = mock_client.audio.translations.create.call_args.kwargs
    assert call_kwargs["model"] == "whisper-large-v3"
    assert call_kwargs["response_format"] == "verbose_json"
    assert call_kwargs["file"][0] == "test_lecture.mp3"

    # 3. Verify structured result
    assert result["text"] == "Welcome to the operating systems lecture."
    assert result["language"] == "english"
    assert result["duration"] == 15.4
    assert len(result["segments"]) == 1


def test_translate_audio_handles_api_failure_clearly(monkeypatch):
    monkeypatch.setattr(settings, "GROQ_API_KEY", "gsk_test_mock_api_key_12345")

    mock_client = MagicMock()
    mock_client.audio.translations.create.side_effect = Exception("Groq API 503 Service Unavailable")

    monkeypatch.setattr(transcription_service, "get_groq_client", lambda: mock_client)

    with pytest.raises(TranscriptionError) as exc_info:
        transcription_service.translate_audio_to_english(b"dummy_bytes")

    assert "Groq ASR translation failed: Groq API 503 Service Unavailable" in str(exc_info.value)
