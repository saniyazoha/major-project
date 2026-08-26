import os
import subprocess
import tempfile
import pytest
from unittest.mock import MagicMock
from app.services import audio_chunking_service
from app.services.audio_chunking_service import AudioChunkingError, MAX_CHUNK_DURATION_SECONDS


def test_chunk_audio_empty_bytes_raises_error():
    with pytest.raises(AudioChunkingError) as exc_info:
        audio_chunking_service.chunk_audio_bytes(b"")
    assert "Provided audio bytes are empty" in str(exc_info.value)


def test_chunk_audio_short_duration_returns_single_chunk(monkeypatch):
    monkeypatch.setattr(audio_chunking_service, "get_audio_duration_seconds", lambda path: 120.0)

    audio_bytes = b"fake_short_audio_bytes_12345"
    chunks = audio_chunking_service.chunk_audio_bytes(audio_bytes, filename="short_lecture.mp3")

    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk["chunk_index"] == 0
    assert chunk["start_time"] == 0.0
    assert chunk["end_time"] == 120.0
    assert chunk["file_bytes"] == audio_bytes
    assert chunk["filename"] == "short_lecture_chunk_0.mp3"


def test_chunk_audio_long_duration_splits_into_multiple_ordered_chunks(monkeypatch):
    monkeypatch.setattr(audio_chunking_service, "get_audio_duration_seconds", lambda path: 400.0)

    def mock_subprocess_run(cmd, *args, **kwargs):
        output_path = cmd[-1]
        with open(output_path, "wb") as f:
            f.write(f"fake_chunk_bytes_for_{os.path.basename(output_path)}".encode())
        return MagicMock(returncode=0)

    monkeypatch.setattr(subprocess, "run", mock_subprocess_run)

    audio_bytes = b"fake_long_audio_400s"
    chunks = audio_chunking_service.chunk_audio_bytes(audio_bytes, filename="long_lecture.mp3")

    assert len(chunks) == 3

    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["start_time"] == 0.0
    assert chunks[0]["end_time"] == 170.0
    assert chunks[0]["end_time"] - chunks[0]["start_time"] <= MAX_CHUNK_DURATION_SECONDS

    assert chunks[1]["chunk_index"] == 1
    assert chunks[1]["start_time"] == 170.0
    assert chunks[1]["end_time"] == 340.0
    assert chunks[1]["end_time"] - chunks[1]["start_time"] <= MAX_CHUNK_DURATION_SECONDS

    assert chunks[2]["chunk_index"] == 2
    assert chunks[2]["start_time"] == 340.0
    assert chunks[2]["end_time"] == 400.0
    assert chunks[2]["end_time"] - chunks[2]["start_time"] <= MAX_CHUNK_DURATION_SECONDS


def test_ffprobe_failure_converts_to_audio_chunking_error(monkeypatch):
    def mock_failed_ffprobe(cmd, *args, **kwargs):
        raise subprocess.CalledProcessError(returncode=1, cmd=cmd, stderr="Invalid media file header")

    monkeypatch.setattr(subprocess, "run", mock_failed_ffprobe)

    with pytest.raises(AudioChunkingError) as exc_info:
        audio_chunking_service.chunk_audio_bytes(b"corrupted_header_data")

    assert "ffprobe failed: Invalid media file header" in str(exc_info.value)


def test_ffmpeg_chunk_failure_converts_to_audio_chunking_error(monkeypatch):
    monkeypatch.setattr(audio_chunking_service, "get_audio_duration_seconds", lambda path: 300.0)

    def mock_ffprobe_success_ffmpeg_fail(cmd, *args, **kwargs):
        if cmd[0] == "ffmpeg":
            raise subprocess.CalledProcessError(returncode=1, cmd=cmd, stderr=b"ffmpeg codec error")
        return MagicMock(returncode=0)

    monkeypatch.setattr(subprocess, "run", mock_ffprobe_success_ffmpeg_fail)

    with pytest.raises(AudioChunkingError) as exc_info:
        audio_chunking_service.chunk_audio_bytes(b"some_audio_data")

    assert "ffmpeg chunking failed" in str(exc_info.value)


def test_temp_directory_cleaned_up_on_failure(monkeypatch):
    created_temp_dirs = []
    original_mkdtemp = tempfile.mkdtemp

    def tracked_mkdtemp(*args, **kwargs):
        path = original_mkdtemp(*args, **kwargs)
        created_temp_dirs.append(path)
        return path

    monkeypatch.setattr(tempfile, "mkdtemp", tracked_mkdtemp)
    monkeypatch.setattr(audio_chunking_service, "get_audio_duration_seconds", lambda path: 300.0)

    def mock_ffmpeg_fail(cmd, *args, **kwargs):
        raise subprocess.CalledProcessError(returncode=1, cmd=cmd, stderr=b"Codec failure")

    monkeypatch.setattr(subprocess, "run", mock_ffmpeg_fail)

    with pytest.raises(AudioChunkingError):
        audio_chunking_service.chunk_audio_bytes(b"test_bytes")

    assert len(created_temp_dirs) == 1
    assert not os.path.exists(created_temp_dirs[0])
