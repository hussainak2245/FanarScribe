"""
In-memory store for encounter/note/intake state.
Not persisted across restarts — fine for hackathon; swap for Supabase later.
"""
from typing import Any, Dict

encounters: Dict[str, Any] = {}   # encounter_id -> encounter record
intakes: Dict[str, Any] = {}      # intake_id    -> intake record
notes: Dict[str, Any] = {}        # encounter_id -> note edit record
instructions: Dict[str, Any] = {} # delivery_id  -> instruction record
doctor_stats: Dict[str, Any] = {} # doctor_id    -> aggregated stats
