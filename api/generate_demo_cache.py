"""
Pre-run Pipeline B on demo audio files and write results to api/demo-cache/.

Usage:
  cd api
  python generate_demo_cache.py [--key KEY] [--audio-dir PATH]

By default processes all 8 demo audio files from public/audio/ (relative to repo root).
To regenerate only one key: --key haytham_ahmed_32_egy

Requirements:
  - FANAR_API_KEY must be set in .env or environment
  - Audio files must exist at --audio-dir (default: ../public/audio)

Output: api/demo-cache/{key}.json (overwrites existing placeholder files)
"""
import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

# Ensure the api/ package is on the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import get_settings
from app.services.scribe_service import ScribeService

DEMO_CONFIGS = [
    {"key": "haytham_ahmed_32_egy",       "dialect": "egyptian",  "file": "haytham_ahmed_32_egy.mp3"},
    {"key": "abdullah2_58s_saudi",         "dialect": "gulf",      "file": "abdullah2_58s_saudi.mp3"},
    {"key": "farah_leila_43_jor_syr",      "dialect": "levantine", "file": "farah_leila_43_jor_syr.mp3"},
    {"key": "hasawi_abdullah_50_saudi",    "dialect": "gulf",      "file": "hasawi_abdullah_50_saudi.mp3"},
    {"key": "haytham_rafoush_71_egy_syr",  "dialect": "egyptian",  "file": "haytham_rafoush_71_egy_syr.mp3"},
    {"key": "abdullah_hazem_63_saud_egy",  "dialect": "gulf",      "file": "abdullah&hazem_63_saud_egy.mp3"},
    {"key": "jawad_ghazline_67_morocco",   "dialect": "moroccan",  "file": "jawad_ghazline_67_morocco.mp3"},
    {"key": "sarah_ghaida_59_jor_syr",    "dialect": "levantine", "file": "sarah_ghaida_59_jor_syr.mp3"},
]

MIXED_DIALECT_KEYS = {"haytham_rafoush_71_egy_syr", "abdullah_hazem_63_saud_egy"}

CACHE_DIR = Path(__file__).parent / "demo-cache"


async def process_one(config: dict, audio_dir: Path, service: ScribeService) -> dict:
    audio_path = audio_dir / config["file"]
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    print(f"  Processing {config['key']} ({audio_path.name}, {audio_path.stat().st_size // 1024} KB)…")

    import io
    from fastapi import UploadFile
    from starlette.datastructures import UploadFile as StarletteUploadFile

    content = audio_path.read_bytes()
    suffix = audio_path.suffix.lstrip(".")
    content_type = f"audio/{suffix}"

    # Build a minimal UploadFile-compatible object
    class SimpleUploadFile:
        def __init__(self, filename: str, content: bytes, content_type: str) -> None:
            self.filename = filename
            self.content_type = content_type
            self._content = content

        async def read(self) -> bytes:
            return self._content

    upload = SimpleUploadFile(audio_path.name, content, content_type)

    result = await service.process(
        audio_file=upload,  # type: ignore[arg-type]
        patient_record_number="DEMO",
        encounter_id=f"demo_{config['key']}",
        consultation_time="2025-01-01T00:00:00Z",
        _doctor_id=None,
        _language_hint="ar",
        dialect_hint=config["dialect"],
        note_format="SOAP",
        privacy_mode="prototype",
        source_mode="audio",
        patient_context_json=None,
        manual_transcript=None,
        mixed_dialect=config["key"] in MIXED_DIALECT_KEYS,
    )
    return result


async def main(args: argparse.Namespace) -> None:
    settings = get_settings()
    if not settings.fanar_api_key:
        print("ERROR: FANAR_API_KEY is not set. Cannot run Pipeline B.")
        sys.exit(1)

    audio_dir = Path(args.audio_dir)
    if not audio_dir.exists():
        print(f"ERROR: Audio directory not found: {audio_dir}")
        sys.exit(1)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    service = ScribeService()

    configs_to_run = (
        [c for c in DEMO_CONFIGS if c["key"] == args.key]
        if args.key else DEMO_CONFIGS
    )
    if not configs_to_run:
        print(f"ERROR: Key '{args.key}' not found in DEMO_CONFIGS.")
        sys.exit(1)

    print(f"Running Pipeline B on {len(configs_to_run)} demo file(s)…\n")
    success = 0
    for config in configs_to_run:
        try:
            started = time.perf_counter()
            result = await process_one(config, audio_dir, service)
            elapsed = round(time.perf_counter() - started, 1)
            out_path = CACHE_DIR / f"{config['key']}.json"
            out_path.write_text(
                json.dumps(result, ensure_ascii=False, indent=2, default=str),
                encoding="utf-8",
            )
            score = result.get("logprob_data", {}).get("normalised_score")
            mandatory = result.get("mandatory_review", False)
            print(f"  ✓ {config['key']} — {elapsed}s | score={score} | mandatory_review={mandatory}")
            success += 1
        except Exception as exc:
            print(f"  ✗ {config['key']} — FAILED: {exc}")

    print(f"\nDone: {success}/{len(configs_to_run)} succeeded. Cache written to {CACHE_DIR}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pre-generate Pipeline B demo cache")
    parser.add_argument(
        "--key", default=None,
        help="Only regenerate this specific demo key (default: all)"
    )
    parser.add_argument(
        "--audio-dir", default=str(Path(__file__).parent.parent / "public" / "audio"),
        help="Directory containing demo audio files"
    )
    args = parser.parse_args()
    asyncio.run(main(args))
