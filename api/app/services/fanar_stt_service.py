"""
Fanar speech-to-text service using Fanar-Aura-STT-LF-1 (Pipeline B primary).

Fallback chain:
  1. Fanar-Aura-STT-LF-1  (primary)
  2. Fanar-Aura-STT-1     (Fanar fallback)
  3. Groq whisper-large-v3 (last resort — ASR only, not LLM)
"""
import time
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import UploadFile
from openai import OpenAI

from app.core.config import get_settings


class FanarSTTService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client: Optional[OpenAI] = (
            None
            if not self.settings.fanar_api_key
            else OpenAI(
                base_url=self.settings.fanar_base_url,
                api_key=self.settings.fanar_api_key,
            )
        )

    async def transcribe(self, audio_file: UploadFile) -> Dict[str, Any]:
        """
        Attempt Fanar STT with primary then fallback model.
        Raises RuntimeError if both Fanar models fail (caller should catch and try Groq).
        """
        if self.client is None:
            raise RuntimeError("FANAR_API_KEY is not configured for STT")

        content = await audio_file.read()
        filename = audio_file.filename or "audio.wav"
        if not Path(filename).suffix:
            filename = f"{filename}.wav"

        started_at = time.perf_counter()
        last_error: Optional[Exception] = None

        for model in [self.settings.fanar_stt_model, self.settings.fanar_stt_fallback_model]:
            try:
                transcription = self.client.audio.transcriptions.create(
                    file=(filename, content),
                    model=model,
                    response_format="verbose_json",
                    temperature=0,
                )
                return self._build_result(
                    transcription, model, filename,
                    content, audio_file.content_type, started_at,
                )
            except Exception as exc:
                last_error = exc
                # try next model in chain

        raise RuntimeError(
            f"Fanar STT failed on both models "
            f"({self.settings.fanar_stt_model}, {self.settings.fanar_stt_fallback_model}): {last_error}"
        ) from last_error

    def _build_result(
        self,
        transcription: Any,
        model: str,
        filename: str,
        content: bytes,
        content_type: Optional[str],
        started_at: float,
    ) -> Dict[str, Any]:
        text = getattr(transcription, "text", "") or ""
        return {
            "text": text,
            "provider": "fanar_stt",
            "model": model,
            "duration_ms": round((time.perf_counter() - started_at) * 1000, 2),
            "audio": {
                "filename": filename,
                "content_type": content_type,
                "size_bytes": len(content),
                "source_mode": "audio",
                "expected_speakers": ["doctor", "patient"],
                "diarization_status": "speaker_labels_requested_not_guaranteed",
            },
            "segments": self._normalize_segments(
                getattr(transcription, "segments", None), text
            ),
        }

    def _normalize_segments(self, segments: Any, fallback_text: str) -> list[dict]:
        if not segments:
            return [{"id": "seg_001", "speaker": "unknown", "start": None, "end": None,
                     "text": fallback_text, "confidence": None}]
        normalized = []
        for i, seg in enumerate(segments, start=1):
            normalized.append({
                "id": f"seg_{i:03d}",
                "speaker": self._val(seg, "speaker") or "unknown",
                "start":   self._val(seg, "start"),
                "end":     self._val(seg, "end"),
                "text":    self._val(seg, "text") or "",
                "confidence": self._val(seg, "confidence"),
            })
        return normalized

    @staticmethod
    def _val(seg: Any, key: str) -> Any:
        if isinstance(seg, dict):
            return seg.get(key)
        return getattr(seg, key, None)
