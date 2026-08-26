import os
import subprocess
import tempfile
from typing import List, Dict, Any

MAX_CHUNK_DURATION_SECONDS = 170.0


class AudioChunkingError(Exception):
    """Custom exception raised when audio chunking or duration probing fails."""
    pass


def get_audio_duration_seconds(file_path: str) -> float:
    """Use ffprobe to determine the duration of an audio file in seconds."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
        duration = float(result.stdout.strip())
        if duration <= 0:
            raise AudioChunkingError("Probed audio duration is non-positive or invalid")
        return duration
    except subprocess.CalledProcessError as e:
        raise AudioChunkingError(f"ffprobe failed: {e.stderr.strip()}") from e
    except ValueError as e:
        raise AudioChunkingError(f"Failed to parse ffprobe duration output: {str(e)}") from e
    except FileNotFoundError as e:
        raise AudioChunkingError("ffprobe tool not found in system PATH") from e


def chunk_audio_bytes(
    file_bytes: bytes,
    filename: str = "audio.mp3",
    max_chunk_duration: float = MAX_CHUNK_DURATION_SECONDS,
) -> List[Dict[str, Any]]:
    """Chunk raw audio bytes into sequential segments of <= max_chunk_duration seconds.

    Returns a list of dictionaries with metadata:
        - chunk_index: int
        - start_time: float
        - end_time: float
        - file_bytes: bytes
        - filename: str

    Always cleans up temporary files on success and failure using TemporaryDirectory.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise AudioChunkingError("Provided audio bytes are empty")

    ext = os.path.splitext(filename)[1].lower() or ".mp3"
    stem = os.path.splitext(filename)[0] or "chunk"

    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, f"input{ext}")
        with open(input_path, "wb") as f:
            f.write(file_bytes)

        duration = get_audio_duration_seconds(input_path)

        if duration <= max_chunk_duration:
            return [
                {
                    "chunk_index": 0,
                    "start_time": 0.0,
                    "end_time": round(duration, 3),
                    "file_bytes": file_bytes,
                    "filename": f"{stem}_chunk_0{ext}",
                }
            ]

        chunks = []
        start_time = 0.0
        chunk_index = 0

        while start_time < duration:
            end_time = min(start_time + max_chunk_duration, duration)
            chunk_duration = end_time - start_time
            chunk_filename = f"{stem}_chunk_{chunk_index}{ext}"
            output_path = os.path.join(temp_dir, f"chunk_{chunk_index}{ext}")

            cmd = [
                "ffmpeg",
                "-y",
                "-ss", str(start_time),
                "-t", str(chunk_duration),
                "-i", input_path,
                "-c", "copy",
                output_path,
            ]

            try:
                subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True,
                )
            except subprocess.CalledProcessError as e:
                err_msg = e.stderr.decode("utf-8", errors="replace").strip() if isinstance(e.stderr, bytes) else str(e.stderr)
                raise AudioChunkingError(f"ffmpeg chunking failed at chunk {chunk_index}: {err_msg}") from e
            except FileNotFoundError as e:
                raise AudioChunkingError("ffmpeg tool not found in system PATH") from e

            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise AudioChunkingError(f"ffmpeg produced empty chunk file for chunk {chunk_index}")

            with open(output_path, "rb") as f:
                chunk_bytes = f.read()

            chunks.append(
                {
                    "chunk_index": chunk_index,
                    "start_time": round(start_time, 3),
                    "end_time": round(end_time, 3),
                    "file_bytes": chunk_bytes,
                    "filename": chunk_filename,
                }
            )

            start_time = end_time
            chunk_index += 1

        return chunks
