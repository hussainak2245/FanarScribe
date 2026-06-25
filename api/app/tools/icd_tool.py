"""
ICD-10 code suggestion tool.
Deterministic — no LLM. Maps SOAP assessment keywords to probable ICD-10 codes.
"""
from typing import Any, Dict, List, Optional

_ICD_CODES: List[Dict[str, Any]] = [
    # Respiratory
    {"code": "J06.9", "description": "Upper respiratory tract infection, unspecified",
     "keywords": ["upper respiratory", "uri", "cold", "runny nose", "سيلان", "زكام"]},
    {"code": "J11.1", "description": "Influenza with respiratory manifestations",
     "keywords": ["flu", "influenza", "انفلونزا"]},
    {"code": "J45.9", "description": "Asthma, unspecified",
     "keywords": ["asthma", "wheez", "bronchospasm", "ربو"]},
    {"code": "J44.1", "description": "COPD with acute exacerbation",
     "keywords": ["copd", "chronic obstructive"]},
    {"code": "J18.9", "description": "Pneumonia, unspecified",
     "keywords": ["pneumonia", "lung infection", "التهاب رئة"]},
    {"code": "R05", "description": "Cough",
     "keywords": ["cough", "كحة"]},
    {"code": "R06.0", "description": "Dyspnoea",
     "keywords": ["dyspnea", "dyspnoea", "shortness of breath", "breathing difficulty", "كتمة", "ضيق تنفس"]},
    # Cardiac
    {"code": "I10", "description": "Essential hypertension",
     "keywords": ["hypertension", "high blood pressure", "htn", "ضغط عالي"]},
    {"code": "I25.1", "description": "Atherosclerotic heart disease",
     "keywords": ["coronary", "cad", "ischaemic", "ischemic"]},
    {"code": "I48.9", "description": "Atrial fibrillation, unspecified",
     "keywords": ["atrial fibrillation", "afib", "رجفان"]},
    {"code": "I50.9", "description": "Heart failure, unspecified",
     "keywords": ["heart failure", "cardiac failure", "قصور قلب"]},
    {"code": "R00.0", "description": "Tachycardia, unspecified",
     "keywords": ["tachycardia", "palpitat", "خفقان"]},
    # Gastrointestinal
    {"code": "K29.7", "description": "Gastritis, unspecified",
     "keywords": ["gastritis", "epigastric", "stomach pain", "ألم معدة", "حموضة"]},
    {"code": "K21.0", "description": "GORD with oesophagitis",
     "keywords": ["gerd", "gord", "reflux", "heartburn", "حرقة", "ارتجاع"]},
    {"code": "K59.0", "description": "Constipation",
     "keywords": ["constipation", "إمساك"]},
    {"code": "K59.1", "description": "Functional diarrhoea",
     "keywords": ["diarrhea", "diarrhoea", "loose stools", "إسهال"]},
    # Diabetes & Endocrine
    {"code": "E11.9", "description": "Type 2 diabetes mellitus without complications",
     "keywords": ["diabetes", "t2dm", "type 2", "diabetic", "سكري", "سكر"]},
    {"code": "E10.9", "description": "Type 1 diabetes mellitus without complications",
     "keywords": ["type 1 diabetes", "t1dm", "insulin dependent"]},
    {"code": "E78.5", "description": "Hyperlipidaemia, unspecified",
     "keywords": ["hyperlipidemia", "hyperlipidaemia", "cholesterol", "dyslipid", "كوليسترول"]},
    # Musculoskeletal
    {"code": "M54.5", "description": "Low back pain",
     "keywords": ["back pain", "low back", "ألم ظهر", "lumbar"]},
    {"code": "M25.5", "description": "Pain in joint",
     "keywords": ["joint pain", "arthralgia", "ألم مفصل", "knee pain"]},
    {"code": "M10.9", "description": "Gout, unspecified",
     "keywords": ["gout", "uric acid", "نقرس"]},
    # Neurological
    {"code": "G43.9", "description": "Migraine, unspecified",
     "keywords": ["migraine", "صداع نصفي"]},
    {"code": "G44.2", "description": "Tension-type headache",
     "keywords": ["tension headache", "headache", "صداع"]},
    {"code": "G40.9", "description": "Epilepsy, unspecified",
     "keywords": ["epilepsy", "seizure", "convulsion", "صرع"]},
    # Mental health
    {"code": "F32.9", "description": "Depressive episode, unspecified",
     "keywords": ["depression", "depressed", "اكتئاب"]},
    {"code": "F41.9", "description": "Anxiety disorder, unspecified",
     "keywords": ["anxiety", "anxious", "قلق"]},
    # Skin
    {"code": "L20.9", "description": "Atopic dermatitis, unspecified",
     "keywords": ["eczema", "atopic dermatitis", "أكزيما"]},
    {"code": "L50.9", "description": "Urticaria, unspecified",
     "keywords": ["urticaria", "hives", "حساسية جلدية"]},
    # General / other
    {"code": "R50.9", "description": "Fever, unspecified",
     "keywords": ["fever", "pyrexia", "حرارة"]},
    {"code": "R53.83", "description": "Fatigue",
     "keywords": ["fatigue", "tired", "exhaustion", "تعب", "إرهاق"]},
    {"code": "Z00.0", "description": "General examination, routine",
     "keywords": ["routine", "checkup", "check-up", "فحص دوري"]},
]


def suggest_icd_codes(soap_note: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Scans SOAP assessment, subjective, and plan sections for keywords,
    returns top-5 ICD-10 matches ranked by keyword hit count.
    """
    if not soap_note:
        search_text = ""
    else:
        assessment = soap_note.get("assessment", {})
        subjective = soap_note.get("subjective", {})
        search_text = " ".join([
            str(assessment.get("summary", "")),
            str(assessment.get("possible_issues", [])),
            str(subjective.get("chief_complaint", "")),
            str(subjective.get("associated_symptoms", [])),
            str(subjective.get("history_of_present_illness", [])),
        ]).lower()

    scored: List[Dict[str, Any]] = []
    for entry in _ICD_CODES:
        score = sum(1 for kw in entry["keywords"] if kw in search_text)
        if score > 0:
            scored.append({
                "code": entry["code"],
                "description": entry["description"],
                "match_score": score,
            })

    top = sorted(scored, key=lambda x: x["match_score"], reverse=True)[:5]

    return {
        "tool": "icd_suggestion_tool",
        "suggestions": top,
        "total_matches": len(scored),
    }
