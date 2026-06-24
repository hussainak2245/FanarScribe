"""
Clinical completeness checker.
Deterministic — no LLM. Given a complaint type and a SOAP note dict,
returns which required/recommended items are present or missing.
"""
from typing import Any, Dict, List, Optional

COMPLAINT_CHECKLISTS: Dict[str, Dict[str, List[str]]] = {
    "respiratory": {
        "required": ["SpO2", "breathing difficulty", "fever", "cough"],
        "recommended": ["wheezing", "asthma history", "allergy status", "medications"],
    },
    "cardiac": {
        "required": ["chest pain character", "radiation", "sweating"],
        "recommended": ["palpitations", "syncope", "current medications"],
    },
    "gastrointestinal": {
        "required": ["pain location", "nausea or vomiting", "bowel changes"],
        "recommended": ["blood in stool", "weight loss", "medications"],
    },
    "general": {
        "required": ["allergy status"],
        "recommended": ["current medications", "symptom duration"],
    },
}

# Search terms per checklist item (Arabic + English)
_SEARCH: Dict[str, List[str]] = {
    "SpO2":                  ["spo2", "oxygen", "saturation", "o2", "تشبع"],
    "breathing difficulty":  ["breath", "breathing", "shortness", "dyspnea", "كتمة", "ضيقة", "ما أقدر أتنفس"],
    "fever":                 ["fever", "temperature", "pyrexia", "حرارة", "سخونة"],
    "cough":                 ["cough", "كحة"],
    "wheezing":              ["wheez", "صفير"],
    "asthma history":        ["asthma", "copd", "ربو"],
    "allergy status":        ["allerg", "حساسية"],
    "medications":           ["medic", "drug", "دواء", "علاج", "medication"],
    "chest pain character":  ["chest pain", "chest tightness", "ألم صدر", "وجع صدر"],
    "radiation":             ["radiation", "radiating", "arm", "jaw", "neck"],
    "sweating":              ["sweat", "diaphoresis", "perspir", "تعرق"],
    "palpitations":          ["palpitat", "خفقان"],
    "syncope":               ["faint", "syncop", "loss of consciousness", "إغماء"],
    "pain location":         ["pain", "location", "where", "ألم", "وجع"],
    "nausea or vomiting":    ["nausea", "vomit", "غثيان", "قيء"],
    "bowel changes":         ["bowel", "stool", "diarrhea", "constipation", "إسهال", "إمساك"],
    "blood in stool":        ["blood in stool", "rectal", "دم"],
    "weight loss":           ["weight loss", "خسارة وزن", "نحف"],
    "symptom duration":      ["since", "for", "days", "weeks", "hours", "من", "منذ", "من أمس"],
    "current medications":   ["medic", "drug", "دواء", "علاج"],
}


def run_checklist(complaint_type: str, soap_note: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Returns which checklist items are present or missing in the SOAP note.
    complaint_type: "respiratory" | "cardiac" | "gastrointestinal" | "general"
    """
    checklist = COMPLAINT_CHECKLISTS.get(complaint_type, COMPLAINT_CHECKLISTS["general"])
    soap_text = str(soap_note).lower() if soap_note else ""

    missing: List[Dict[str, str]] = []
    present: List[Dict[str, str]] = []

    for priority in ("required", "recommended"):
        for item in checklist.get(priority, []):
            terms = _SEARCH.get(item, [item.lower()])
            found = any(t in soap_text for t in terms)
            bucket = present if found else missing
            bucket.append({"item": item, "priority": priority})

    total = len(present) + len(missing)
    completeness = round(len(present) / total, 2) if total else 1.0

    return {
        "tool": "checklist_tool",
        "complaint_type": complaint_type,
        "missing": missing,
        "present": present,
        "completeness_score": completeness,
    }
