"""
Drug interaction checker.
Deterministic — no LLM. Scans the SOAP plan section for known drug-drug
interactions and returns detected pairs with severity.
"""
from typing import Any, Dict, List, Optional

_DRUG_TERMS: Dict[str, List[str]] = {
    "warfarin":       ["warfarin", "وارفارين"],
    "aspirin":        ["aspirin", "أسبرين", "asprin", " asa "],
    "ibuprofen":      ["ibuprofen", "إيبوبروفين", "brufen", "advil"],
    "naproxen":       ["naproxen", "نابروكسن"],
    "diclofenac":     ["diclofenac", "ديكلوفيناك", "voltaren"],
    "metformin":      ["metformin", "ميتفورمين"],
    "glibenclamide":  ["glibenclamide", "glyburide", "جليبنكلاميد"],
    "insulin":        ["insulin", "إنسولين"],
    "simvastatin":    ["simvastatin", "سيمفاستاتين"],
    "atorvastatin":   ["atorvastatin", "أتورفاستاتين"],
    "clarithromycin": ["clarithromycin", "كلاريثرومايسين"],
    "metronidazole":  ["metronidazole", "مترونيدازول", "flagyl"],
    "omeprazole":     ["omeprazole", "أوميبرازول"],
    "clopidogrel":    ["clopidogrel", "كلوبيدوجريل", "plavix"],
    "lisinopril":     ["lisinopril", "ليسينوبريل"],
    "spironolactone": ["spironolactone", "سبيرونولاكتون"],
    "furosemide":     ["furosemide", "فيروسيميد", "lasix"],
    "potassium":      ["potassium supplement", "kcl", "بوتاسيوم"],
    "tramadol":       ["tramadol", "ترامادول"],
    "ssri":           ["sertraline", "fluoxetine", "escitalopram", "سيرترالين", "فلوكسيتين"],
    "ciprofloxacin":  ["ciprofloxacin", "سيبروفلوكساسين", "cipro"],
}

_INTERACTIONS: List[Dict[str, Any]] = [
    {"drugs": ("warfarin", "aspirin"),
     "severity": "high",
     "message": "Warfarin + Aspirin: significantly increased bleeding risk. Monitor INR closely."},
    {"drugs": ("warfarin", "ibuprofen"),
     "severity": "high",
     "message": "Warfarin + Ibuprofen (NSAID): increased bleeding risk and INR elevation."},
    {"drugs": ("warfarin", "naproxen"),
     "severity": "high",
     "message": "Warfarin + Naproxen (NSAID): increased bleeding risk."},
    {"drugs": ("warfarin", "diclofenac"),
     "severity": "high",
     "message": "Warfarin + Diclofenac (NSAID): increased bleeding risk."},
    {"drugs": ("warfarin", "clarithromycin"),
     "severity": "high",
     "message": "Warfarin + Clarithromycin: CYP2C9 inhibition, significant INR elevation."},
    {"drugs": ("warfarin", "metronidazole"),
     "severity": "high",
     "message": "Warfarin + Metronidazole: CYP2C9 inhibition, INR elevation."},
    {"drugs": ("warfarin", "ciprofloxacin"),
     "severity": "moderate",
     "message": "Warfarin + Ciprofloxacin: possible INR increase. Monitor."},
    {"drugs": ("aspirin", "ibuprofen"),
     "severity": "moderate",
     "message": "Aspirin + Ibuprofen: ibuprofen may reduce aspirin's antiplatelet effect."},
    {"drugs": ("clopidogrel", "omeprazole"),
     "severity": "moderate",
     "message": "Clopidogrel + Omeprazole: CYP2C19 inhibition may reduce clopidogrel efficacy."},
    {"drugs": ("clopidogrel", "aspirin"),
     "severity": "moderate",
     "message": "Clopidogrel + Aspirin: dual antiplatelet therapy — increased bleeding risk, often intentional."},
    {"drugs": ("simvastatin", "clarithromycin"),
     "severity": "high",
     "message": "Simvastatin + Clarithromycin: CYP3A4 inhibition — risk of myopathy/rhabdomyolysis."},
    {"drugs": ("atorvastatin", "clarithromycin"),
     "severity": "moderate",
     "message": "Atorvastatin + Clarithromycin: CYP3A4 inhibition — elevated statin levels."},
    {"drugs": ("ssri", "tramadol"),
     "severity": "high",
     "message": "SSRI + Tramadol: serotonin syndrome risk."},
    {"drugs": ("metformin", "furosemide"),
     "severity": "low",
     "message": "Metformin + Furosemide: furosemide may increase metformin levels slightly."},
    {"drugs": ("potassium", "spironolactone"),
     "severity": "high",
     "message": "Potassium supplement + Spironolactone: risk of hyperkalemia."},
    {"drugs": ("potassium", "lisinopril"),
     "severity": "high",
     "message": "Potassium supplement + ACE inhibitor (Lisinopril): risk of hyperkalemia."},
    {"drugs": ("furosemide", "lisinopril"),
     "severity": "moderate",
     "message": "Furosemide + Lisinopril: first-dose hypotension risk."},
]


def check_drug_interactions(soap_note: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Scans the full SOAP note text for drug names and returns known interactions.
    """
    search_text = str(soap_note).lower() if soap_note else ""

    detected: List[str] = [
        drug for drug, terms in _DRUG_TERMS.items()
        if any(t in search_text for t in terms)
    ]
    detected_set = set(detected)

    interactions_found: List[Dict[str, Any]] = [
        {
            "drug_pair": list(ix["drugs"]),
            "severity": ix["severity"],
            "message": ix["message"],
        }
        for ix in _INTERACTIONS
        if ix["drugs"][0] in detected_set and ix["drugs"][1] in detected_set
    ]

    return {
        "tool": "drug_interaction_tool",
        "drugs_detected": detected,
        "interactions": interactions_found,
        "interaction_count": len(interactions_found),
        "has_high_severity": any(i["severity"] == "high" for i in interactions_found),
    }
