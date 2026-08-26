import os
import uuid
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings


class StorageError(Exception):
    """Custom exception raised when storage upload or download operations fail."""
    pass


def get_supabase_client() -> Optional[Client]:
    """Initialize and return Supabase Client if credentials are provided."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        return None
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    except Exception:
        return None


def upload_lecture_file(filename: str, file_bytes: bytes, content_type: str) -> str:
    """Upload lecture audio bytes to storage service and return the object path/key.

    Never depends on persistent local disk storage in production.
    """
    ext = os.path.splitext(filename)[1].lower() or ".mp3"
    object_key = f"lectures/{uuid.uuid4().hex}{ext}"

    client = get_supabase_client()
    if client:
        bucket = settings.SUPABASE_STORAGE_BUCKET
        try:
            client.storage.from_(bucket).upload(
                path=object_key,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
        except Exception as e:
            raise StorageError(f"Failed to upload file to Supabase Storage: {str(e)}") from e

    return object_key


def download_lecture_file(storage_path: str) -> bytes:
    """Download lecture audio bytes from Supabase Storage given its storage_path/object key.

    Does not persist downloaded audio bytes to local disk.
    """
    if not storage_path or not storage_path.strip():
        raise StorageError("storage_path is missing or empty")

    client = get_supabase_client()
    if not client:
        raise StorageError("Supabase Storage client is not configured or failed to initialize")

    bucket = settings.SUPABASE_STORAGE_BUCKET
    try:
        data = client.storage.from_(bucket).download(storage_path)
        if isinstance(data, bytes):
            return data
        # Handle case where response object contains content or read() method
        if hasattr(data, "content"):
            return data.content
        if hasattr(data, "read"):
            return data.read()
        return bytes(data)
    except Exception as e:
        raise StorageError(f"Failed to download file from Supabase Storage: {str(e)}") from e
