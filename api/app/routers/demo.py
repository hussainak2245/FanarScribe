"""
Demo cache router — GET /api/v1/demo/{key}

Serves pre-generated Pipeline B output from api/demo-cache/{key}.json.
Introduces an asyncio.sleep(10) delay to simulate real processing time in demo mode.
Cache files are seeded with placeholder data and replaced by generate_demo_cache.py.
"""
import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()

_CACHE_DIR = Path(__file__).parent.parent.parent.parent / "demo-cache"
_DEMO_DELAY_S = 10


@router.get("/{key}")
async def get_demo(key: str):
    cache_file = _CACHE_DIR / f"{key}.json"
    if not cache_file.exists():
        raise HTTPException(status_code=404, detail=f"Demo key '{key}' not found in cache")

    await asyncio.sleep(_DEMO_DELAY_S)

    try:
        return json.loads(cache_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Corrupted cache file for key '{key}'") from exc
