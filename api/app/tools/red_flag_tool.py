"""
Red flag scanner.
Deterministic — no LLM. Checks whether known high-risk clinical patterns
are present or missing from the SOAP note text.
"""
from typing import Any, Dict, List, Optional

_RED_FLAGS: Dict[str, List[Dict[str, Any]]] = {
    "respiratory": [
        {"flag": "severe dyspnea at rest",            "keywords": ["severe", "rest", "cannot breathe", "ما يقدر يتنفس"], "risk": "high"},
        {"flag": "SpO2 not documented",               "keywords": ["spo2", "oxygen saturation", "تشبع"],                   "risk": "high"},
        {"flag": "cyanosis",                          "keywords": ["cyanosis", "blue", "زرقة"],                            "risk": "high"},
        {"flag": "stridor or accessory muscle use",   "keywords": ["stridor", "accessory", "retractions"],                 "risk": "high"},
    ],
    "cardiac": [
        {"flag": "chest pain radiation to arm or jaw", "keywords": ["radiation", "radiating", "arm", "jaw", "left arm"], "risk": "high"},
        {"flag": "diaphoresis with chest pain",        "keywords": ["sweat", "diaphoresis", "perspir"],                   "risk": "high"},
        {"flag": "syncope",                            "keywords": ["syncope", "faint", "loss of consciousness", "إغماء"], "risk": "high"},
    ],
    "general": [
        {"flag": "allergy status not documented",  "keywords": ["allerg", "حساسية"],                     "risk": "medium"},
        {"flag": "medication list not documented", "keywords": ["medic", "drug", "دواء", "علاج"],        "risk": "medium"},
        {"flag": "negation near key symptom",      "keywords": ["no ", "denies", "ما ", "ليس", "مو "],  "risk": "medium"},
    ],
}


def scan_red_flags(complaint_type: str, soap_note: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Returns which red flags are present or conspicuously absent in the SOAP note.
    complaint_type: "respiratory" | "cardiac" | "general"
    """
    soap_text = str(soap_note).lower() if soap_note else ""
    flags = _RED_FLAGS.get(complaint_type, []) + _RED_FLAGS["general"]

    detected: List[Dict[str, str]] = []
    missing: List[Dict[str, str]] = []

    for flag in flags:
        found = any(kw in soap_text for kw in flag["keywords"])
        record = {"flag": flag["flag"], "risk": flag["risk"]}
        (detected if found else missing).append(record)

    return {
        "tool": "red_flag_tool",
        "complaint_type": complaint_type,
        "flags_detected": detected,
        "flags_missing": missing,
    }
