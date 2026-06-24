from typing import Dict

class PrivacyService:
    def build_privacy_metadata(self, privacy_mode: str) -> Dict[str, object]:
        return {
            "mode": privacy_mode,
            "audio_stored": False,
            "transcript_stored": False,
            "note_stored": False,
            "storage_owner": "frontend_or_external_system",
        }
