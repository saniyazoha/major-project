import pytest
from unittest.mock import MagicMock
from app.core.config import settings
from app.services import storage_service
from app.services.storage_service import StorageError


def test_download_lecture_file_missing_path():
    with pytest.raises(StorageError) as exc_info:
        storage_service.download_lecture_file("")
    assert "storage_path is missing or empty" in str(exc_info.value)

    with pytest.raises(StorageError) as exc_info:
        storage_service.download_lecture_file("   ")
    assert "storage_path is missing or empty" in str(exc_info.value)


def test_download_lecture_file_unconfigured_client(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_KEY", "")

    with pytest.raises(StorageError) as exc_info:
        storage_service.download_lecture_file("lectures/test_audio.mp3")
    assert "Supabase Storage client is not configured" in str(exc_info.value)


def test_download_lecture_file_success(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://mock.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_KEY", "mock_key")
    monkeypatch.setattr(settings, "SUPABASE_STORAGE_BUCKET", "lectures")

    mock_raw_bytes = b"mock_audio_stream_binary_data_12345"

    mock_bucket = MagicMock()
    mock_bucket.download.return_value = mock_raw_bytes

    mock_client = MagicMock()
    mock_client.storage.from_.return_value = mock_bucket

    monkeypatch.setattr(storage_service, "get_supabase_client", lambda: mock_client)

    result = storage_service.download_lecture_file("lectures/sample_uuid.mp3")

    # 1. Verify correct bucket was accessed
    mock_client.storage.from_.assert_called_once_with("lectures")

    # 2. Verify correct storage_path was passed to download
    mock_bucket.download.assert_called_once_with("lectures/sample_uuid.mp3")

    # 3. Verify returned bytes are unchanged
    assert result == mock_raw_bytes


def test_download_lecture_file_supabase_error(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://mock.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_KEY", "mock_key")

    mock_bucket = MagicMock()
    mock_bucket.download.side_effect = Exception("Object not found in bucket")

    mock_client = MagicMock()
    mock_client.storage.from_.return_value = mock_bucket

    monkeypatch.setattr(storage_service, "get_supabase_client", lambda: mock_client)

    with pytest.raises(StorageError) as exc_info:
        storage_service.download_lecture_file("lectures/non_existent.mp3")

    assert "Failed to download file from Supabase Storage: Object not found in bucket" in str(exc_info.value)
