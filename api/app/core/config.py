import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    fanar_api_key: Optional[str] = None
    fanar_base_url: str = "https://api.fanar.qa/v1"
    # Pipeline B model names (from research experiment)
    fanar_stt_model: str = "Fanar-Aura-STT-LF-1"
    fanar_stt_fallback_model: str = "Fanar-Aura-STT-1"
    fanar_llm_model: str = "Fanar-S-1-7B"
    # Groq — STT fallback only; not used for LLM steps in Pipeline B
    groq_api_key: Optional[str] = None
    groq_asr_model: str = "whisper-large-v3"
    groq_llm_model: str = "llama-3.3-70b-versatile"
    store_audio: bool = False


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@lru_cache
def get_settings() -> Settings:
    return Settings(
        fanar_api_key=os.getenv("FANAR_API_KEY") or None,
        fanar_base_url=os.getenv("FANAR_BASE_URL", Settings.model_fields["fanar_base_url"].default),
        fanar_stt_model=os.getenv("FANAR_STT_MODEL", Settings.model_fields["fanar_stt_model"].default),
        fanar_stt_fallback_model=os.getenv("FANAR_STT_FALLBACK_MODEL", Settings.model_fields["fanar_stt_fallback_model"].default),
        fanar_llm_model=os.getenv("FANAR_LLM_MODEL", Settings.model_fields["fanar_llm_model"].default),
        groq_api_key=os.getenv("GROQ_API_KEY") or None,
        groq_asr_model=os.getenv("GROQ_ASR_MODEL", Settings.model_fields["groq_asr_model"].default),
        groq_llm_model=os.getenv("GROQ_LLM_MODEL", Settings.model_fields["groq_llm_model"].default),
        store_audio=_env_bool("STORE_AUDIO"),
    )
