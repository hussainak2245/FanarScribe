import time
from pathlib import Path
from typing import Any, Dict

from fastapi import UploadFile
from groq import Groq
from app.core.config import get_settings

class TranscriptionService:
    def __init__(self):
        self.settings = get_settings()
        self.groq_client = None if not self.settings.groq_api_key else Groq(api_key=self.settings.groq_api_key)

    async def transcribe_audio(self, audio_file: UploadFile) -> Dict[str, Any]:
        if self.groq_client is None:
            raise RuntimeError("GROQ_API_KEY is missing")
        started_at = time.perf_counter()
        filename = audio_file.filename or "audio.wav"
        suffix = Path(filename).suffix
        if not suffix:
            filename = f"{filename}.wav"
        content = await audio_file.read()
        transcription = self.groq_client.audio.transcriptions.create(
            file=(filename, content),
            model=self.settings.groq_asr_model,
            temperature=0,
            response_format="verbose_json",
        )
        text = getattr(transcription, "text", "") or ""
        return {
            "text": text,
            "provider": "groq_whisper",
            "model": self.settings.groq_asr_model,
            "duration_ms": round((time.perf_counter() - started_at) * 1000, 2),
            "audio": {
                "filename": filename,
                "content_type": audio_file.content_type,
                "size_bytes": len(content),
                "source_mode": "audio",
                "expected_speakers": ["doctor", "patient"],
                "diarization_status": "speaker_labels_requested_not_guaranteed",
            },
            "segments": self._normalize_segments(getattr(transcription, "segments", None), text),
        }

    def _normalize_segments(self, segments: Any, fallback_text: str) -> list[dict]:
        if not segments:
            return [{
                "id": "seg_001",
                "speaker": "unknown",
                "start": None,
                "end": None,
                "text": fallback_text,
                "confidence": None,
            }]

        normalized = []
        for index, segment in enumerate(segments, start=1):
            normalized.append({
                "id": f"seg_{index:03d}",
                "speaker": self._segment_value(segment, "speaker") or "unknown",
                "start": self._segment_value(segment, "start"),
                "end": self._segment_value(segment, "end"),
                "text": self._segment_value(segment, "text") or "",
                "confidence": self._segment_value(segment, "confidence"),
            })
        return normalized

    def _segment_value(self, segment: Any, key: str) -> Any:
        if isinstance(segment, dict):
            return segment.get(key)
        return getattr(segment, key, None)
