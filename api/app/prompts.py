"""
LLM prompt templates for the FanarScribe pipeline.

Pipeline B (production) — Fanar-S-1-7B for all LLM steps:
  1. (STT)                  — Fanar-Aura-STT-LF-1 (handled by FanarSTTService)
  2. build_check_prompt     — dialect/uncertain word identification
  3. build_soap_prompt      — SOAP note + evidence-linked claims (with logprobs=True)
  4. build_eval_prompt      — 5-dimension self-scoring (receives logprob_data)
  5. build_judge_prompt     — final verdict + physician questions (3 signals: self-eval, logprob, tokens)
  6. build_qeval_prompt     — physician question quality scoring (0-8)

Legacy prompts (build_translate_prompt, build_uncertainty_prompt) kept for compatibility.
build_prompt_response_prompt handles physician copilot follow-ups.
"""
import json
from typing import Any, Dict, List, Optional


# ══════════════════════════════════════════════════════════════════════════════
# Pipeline B prompts (steps 2-6)
# ══════════════════════════════════════════════════════════════════════════════

# ── Pipeline B Step 2: Dialect / uncertain word check ─────────────────────────

def build_check_prompt(transcript: str, dialect_hint: str) -> str:
    return f"""You are FanarScribe dialect analyser.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Task:
Analyse this Arabic clinical consultation transcript.
Identify every word or phrase that is:
- Dialect-specific with multiple plausible clinical meanings (most important)
- Likely a transcription error or mishearing
- Clinically ambiguous without further context

Rules:
- Prioritise dialect_ambiguity — Gulf terms like كتمة, ضيقة, دوخة, خفقان often have 2-3 clinical meanings.
- Keep possible_meanings concise (2-3 items max).
- Do not flag grammatical particles or prepositions.
- If the transcript is clear and unambiguous, return uncertain_words as [].

Dialect hint: {dialect_hint}
Transcript: {transcript}

Return JSON with exactly this key: uncertain_words

{{
  "uncertain_words": [
    {{
      "id": "uw_001",
      "text": "...",
      "segment_id": "seg_001",
      "score": 0.85,
      "level": "high_uncertainty|medium_uncertainty|low_uncertainty",
      "type": "dialect_ambiguity|transcription_noise|clinical_inference",
      "possible_meanings": ["...", "..."],
      "reason": "..."
    }}
  ]
}}"""


# ── Pipeline B Step 4: Self-eval (5 dimensions + logprob context) ──────────────

def build_eval_prompt(
    transcript: str,
    soap_note: Dict[str, Any],
    claims: List[Dict[str, Any]],
    logprob_data: Dict[str, Any],
) -> str:
    soap_summary = json.dumps(
        {
            "overall_quality_level": soap_note.get("overall_quality_level"),
            "subjective": {
                "chief_complaint": soap_note.get("subjective", {}).get("chief_complaint", ""),
                "associated_symptoms": soap_note.get("subjective", {}).get("associated_symptoms", [])[:4],
            },
            "assessment": {"summary": soap_note.get("assessment", {}).get("summary", "")},
        },
        ensure_ascii=False,
        indent=None,
    )
    claims_summary = json.dumps(
        [{"id": c.get("id"), "text": c.get("text"), "status": c.get("status")} for c in claims[:8]],
        ensure_ascii=False,
        indent=None,
    )
    logprob_context = json.dumps(
        {
            "normalised_score": logprob_data.get("normalised_score"),
            "below_threshold": logprob_data.get("below_threshold"),
            "token_count": logprob_data.get("token_count"),
            "top_uncertain_tokens": logprob_data.get("top_uncertain_tokens", [])[:5],
        },
        ensure_ascii=False,
    )
    return f"""You are FanarScribe self-evaluator.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Task:
Score the quality of this SOAP note generation across 5 dimensions.
Use the logprob data as an additional signal — low logprob scores mean the model
was uncertain about specific tokens; those should lower your confidence scores.

Scoring scale 0.0–1.0:
  very_good  ≥ 0.85
  good       ≥ 0.70
  needs_review ≥ 0.50
  poor       ≥ 0.30
  very_poor  < 0.30

Transcript (Arabic):
{transcript[:800]}

SOAP summary:
{soap_summary}

Claims (sample):
{claims_summary}

Logprob data from SOAP generation:
{logprob_context}

Return JSON with exactly these top-level keys: self_eval

{{
  "self_eval": {{
    "overall_score": 0.75,
    "overall_level": "very_good|good|needs_review|poor|very_poor",
    "dimensions": {{
      "transcription_quality": {{"score": 0.80, "level": "good", "note": "..."}},
      "dialect_coverage":     {{"score": 0.70, "level": "good", "note": "..."}},
      "clinical_extraction":  {{"score": 0.75, "level": "good", "note": "..."}},
      "evidence_support":     {{"score": 0.65, "level": "needs_review", "note": "..."}},
      "completeness":         {{"score": 0.60, "level": "needs_review", "note": "..."}}
    }},
    "summary": "..."
  }}
}}"""


# ── Pipeline B Step 5: Judge (3 signals → final verdict + physician questions) ──

def build_judge_prompt(
    transcript: str,
    soap_note: Dict[str, Any],
    self_eval: Dict[str, Any],
    logprob_data: Dict[str, Any],
    uncertain_words: List[Dict[str, Any]],
) -> str:
    signals = json.dumps(
        {
            "self_eval_score": self_eval.get("overall_score"),
            "self_eval_level": self_eval.get("overall_level"),
            "logprob_normalised_score": logprob_data.get("normalised_score"),
            "logprob_below_threshold": logprob_data.get("below_threshold"),
            "top_uncertain_tokens": logprob_data.get("top_uncertain_tokens", [])[:5],
        },
        ensure_ascii=False,
    )
    uncertain_summary = json.dumps(
        [{"text": w.get("text"), "type": w.get("type"), "possible_meanings": w.get("possible_meanings", [])[:2]}
         for w in uncertain_words[:6]],
        ensure_ascii=False,
    )
    soap_summary = json.dumps(
        {
            "chief_complaint": soap_note.get("subjective", {}).get("chief_complaint", ""),
            "assessment_summary": soap_note.get("assessment", {}).get("summary", ""),
            "plan_items": soap_note.get("plan", {}).get("recommended_clarifications", [])[:3],
        },
        ensure_ascii=False,
    )
    return f"""You are FanarScribe judge.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Task:
You have three uncertainty signals for a clinical SOAP note:
1. Self-eval score — the model's own assessment of its output
2. Logprob score — token-level confidence (model-native, cannot be inflated)
3. Uncertain words — dialect/clinical terms flagged during transcript analysis

Synthesise these into a final confidence verdict and generate physician checkpoint
questions for claims that need physician confirmation before the note ships.

Rules:
- Weight logprob_normalised_score most heavily (model-native, unbiased signal).
- If logprob_below_threshold is true, final_level must be needs_review or worse.
- Generate 2-4 physician questions — prefer specific clinical questions tied to
  uncertain words or missing information, not generic checklists.
- Questions must have clear clinical rationale and 2-3 MCQ options where possible.

Three signals:
{signals}

Uncertain words:
{uncertain_summary}

SOAP context:
{soap_summary}

Transcript excerpt (Arabic):
{transcript[:600]}

Return JSON with exactly these top-level keys: uncertainty, physician_questions

{{
  "uncertainty": {{
    "overall_score": 0.80,
    "overall_level": "very_good|good|needs_review|poor|very_poor",
    "overall_label": "...",
    "summary": "...",
    "signal_weights": {{
      "logprob_contribution": 0.5,
      "self_eval_contribution": 0.3,
      "dialect_flags_contribution": 0.2
    }},
    "claim_evaluations": [
      {{"claim_id": "claim_001", "evidence_level": "supported|weakly_supported|inferred|unsupported|contradicted", "confidence": 0.85, "note": "..."}}
    ],
    "dimensions": {{
      "transcription_quality": {{"score": 0.80, "level": "good"}},
      "translation_quality":   {{"score": 0.75, "level": "good"}},
      "clinical_extraction":   {{"score": 0.70, "level": "good"}},
      "evidence_support":      {{"score": 0.65, "level": "needs_review"}},
      "clinical_completeness": {{"score": 0.50, "level": "needs_review"}}
    }}
  }},
  "physician_questions": [
    {{
      "id": "q_001",
      "priority": "high|medium|low",
      "type": "single_choice|multiple_choice|yes_no|free_text|confirm_reject",
      "title": "...",
      "question": "...",
      "reason": "...",
      "linked_uncertain_word_ids": [],
      "linked_claim_ids": [],
      "options": [{{"label": "...", "value": "..."}}]
    }}
  ]
}}"""


# ── Pipeline B Step 6: Question quality evaluation (0-8 scale) ─────────────────

def build_qeval_prompt(
    physician_questions: List[Dict[str, Any]],
    transcript: str,
    soap_note: Dict[str, Any],
) -> str:
    questions_json = json.dumps(physician_questions[:6], ensure_ascii=False, indent=None)
    chief_complaint = soap_note.get("subjective", {}).get("chief_complaint", "")
    return f"""You are FanarScribe question evaluator.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Task:
Score the quality of these physician checkpoint questions on a 0-8 scale.

Scoring criteria (1 point each):
1. Directly references the transcript or specific uncertain term
2. Has clear clinical rationale
3. Offers specific MCQ options (not generic yes/no)
4. Would actually change the note if answered
5. Avoids generic checklists ("do you have fever?")
6. Uses clinical terminology correctly
7. Is appropriately prioritised (high = changes management)
8. Is concise and answerable in under 30 seconds

Grade thresholds:
  strong: 6-8 points
  ok: 3-5 points
  weak: 0-2 points

Chief complaint context: {chief_complaint}

Questions to evaluate:
{questions_json}

Transcript excerpt:
{transcript[:400]}

Return JSON:
{{
  "question_scores": [
    {{"question_id": "q_001", "score": 6, "grade": "strong|ok|weak", "notes": "..."}}
  ],
  "overall_score": 5,
  "overall_grade": "strong|ok|weak",
  "improvement_suggestion": "..."
}}"""


# ══════════════════════════════════════════════════════════════════════════════
# Legacy prompts (kept for compatibility / reference)
# ══════════════════════════════════════════════════════════════════════════════

# ── Step 2 (legacy): Dialect normalisation + clinical translation ──────────────

def build_translate_prompt(transcript: str, dialect_hint: str) -> str:
    return f"""You are FanarScribe, an Arabic-first clinical scribe.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Task:
Analyse this Arabic clinical consultation transcript.
Produce an English clinical translation and identify ambiguous or dialect-specific terms.

Rules:
- Preserve original Arabic evidence in normalized_clinical_meaning.
- Flag phrases where the clinical meaning is unclear or dialect-dependent.
- Do not invent or assume clinical facts not present in the transcript.
- dialect_ambiguity is the most important uncertainty type; flag it whenever a term has multiple plausible clinical meanings.

Dialect hint: {dialect_hint}
Transcript: {transcript}

Return JSON with exactly these top-level keys: translation, uncertain_words

Schema:
{{
  "translation": {{
    "target_language": "en",
    "clinical_translation": "...",
    "normalized_clinical_meaning": [
      {{"arabic_evidence": "...", "english_meaning": "...", "certainty": "high|medium|low", "notes": "..."}}
    ]
  }},
  "uncertain_words": [
    {{
      "id": "uw_001",
      "text": "...",
      "segment_id": "seg_001",
      "score": 0.85,
      "level": "high_uncertainty|medium_uncertainty|low_uncertainty",
      "type": "dialect_ambiguity|transcription_noise|clinical_inference",
      "possible_meanings": ["...", "..."],
      "reason": "...",
      "linked_claim_ids": []
    }}
  ]
}}"""


# ── Step 3: SOAP note + evidence-linked claims ────────────────────────────────

def build_soap_prompt(
    transcript: str,
    clinical_translation: str,
    uncertain_words_summary: str,
    patient_context: Optional[str],
    patient_record_number: str,
    encounter_id: str,
    consultation_time: str,
    note_format: str,
) -> str:
    return f"""You are FanarScribe, an Arabic-first clinical scribe.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Task:
Using the Arabic transcript and its English clinical translation, produce a structured {note_format} note
and extract clinical claims — each claim must cite its evidence in the transcript.

Rules:
- Do not invent vitals, diagnoses, medications, or allergies not mentioned in the transcript.
- If a claim is inferred from context rather than directly stated, mark status as "inferred".
- Preserve original Arabic evidence text inside claim evidence fields.
- This is a draft for physician review, not a final diagnosis.
- Use speaker labels doctor/patient/unknown in patient_words when discernible.

Uncertain words already flagged: {uncertain_words_summary}
Patient context: {patient_context or "{}"}
Patient record: {patient_record_number}
Encounter ID: {encounter_id}
Consultation time: {consultation_time}
Note format: {note_format}

Transcript (Arabic):
{transcript}

Clinical translation (English):
{clinical_translation}

Return JSON with exactly these top-level keys: soap_note, claims

Schema:
{{
  "soap_note": {{
    "overall_quality_level": "very_good|good|needs_review|poor|very_poor",
    "subjective": {{
      "chief_complaint": "...",
      "history_of_present_illness": [],
      "associated_symptoms": [],
      "negative_symptoms": [],
      "patient_words": []
    }},
    "objective": {{
      "vitals": [],
      "exam_findings": [],
      "available_data": []
    }},
    "assessment": {{
      "summary": "...",
      "possible_issues": [],
      "unsupported_or_inferred": []
    }},
    "plan": {{
      "recommended_clarifications": [],
      "patient_instructions_draft": []
    }}
  }},
  "claims": [
    {{
      "id": "claim_001",
      "section": "subjective",
      "text": "...",
      "evidence": [{{"source": "transcript", "text": "...", "segment_id": "seg_001"}}],
      "confidence": 0.85,
      "level": "supported|weakly_supported|inferred|unsupported",
      "status": "confirmed|physician_required|inferred",
      "reason": "..."
    }}
  ]
}}"""


# ── Step 4: Claim-evidence scoring + physician questions ──────────────────────

def build_uncertainty_prompt(
    transcript: str,
    soap_note: Dict[str, Any],
    claims: List[Dict[str, Any]],
) -> str:
    claims_summary = json.dumps(
        [
            {
                "id": c.get("id"),
                "section": c.get("section"),
                "text": c.get("text"),
                "evidence": c.get("evidence", [])[:1],
                "status": c.get("status"),
            }
            for c in claims[:12]
        ],
        ensure_ascii=False,
        indent=None,
    )
    soap_summary = json.dumps(
        {
            "overall_quality_level": soap_note.get("overall_quality_level"),
            "subjective": {
                "chief_complaint": soap_note.get("subjective", {}).get("chief_complaint", ""),
                "associated_symptoms": soap_note.get("subjective", {}).get("associated_symptoms", [])[:5],
                "negative_symptoms": soap_note.get("subjective", {}).get("negative_symptoms", [])[:3],
            },
            "assessment": {"summary": soap_note.get("assessment", {}).get("summary", "")},
        },
        ensure_ascii=False,
        indent=None,
    )

    return f"""You are FanarScribe uncertainty analyser.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Task:
For each clinical claim, judge how strongly it is supported by the Arabic transcript.
Then generate physician questions for claims that need confirmation.

Evidence levels:
- supported: claim is clearly and directly stated in the transcript
- weakly_supported: claim can be inferred but evidence is indirect or ambiguous
- inferred: claim was inferred from context, not explicitly stated
- unsupported: no evidence for this claim in the transcript
- contradicted: the transcript contradicts this claim

Transcript (Arabic):
{transcript}

SOAP note summary:
{soap_summary}

Claims to evaluate:
{claims_summary}

Return JSON with exactly these top-level keys: uncertainty, physician_questions

Schema:
{{
  "uncertainty": {{
    "overall_score": 0.70,
    "overall_level": "very_good|good|needs_review|poor|very_poor",
    "overall_label": "...",
    "summary": "...",
    "claim_evaluations": [
      {{"claim_id": "claim_001", "evidence_level": "supported|weakly_supported|inferred|unsupported|contradicted", "confidence": 0.85, "note": "..."}}
    ],
    "dimensions": {{
      "transcription_quality": {{"score": 0.80, "level": "good"}},
      "translation_quality":   {{"score": 0.75, "level": "good"}},
      "clinical_extraction":   {{"score": 0.70, "level": "good"}},
      "evidence_support":      {{"score": 0.65, "level": "needs_review"}},
      "clinical_completeness": {{"score": 0.50, "level": "needs_review"}}
    }}
  }},
  "physician_questions": [
    {{
      "id": "q_001",
      "priority": "high|medium|low",
      "type": "single_choice|multiple_choice|yes_no|free_text|confirm_reject",
      "title": "...",
      "question": "...",
      "reason": "...",
      "linked_uncertain_word_ids": [],
      "linked_claim_ids": [],
      "options": [{{"label": "...", "value": "..."}}]
    }}
  ]
}}"""


# ── Copilot tool-selection prompt ─────────────────────────────────────────────

def build_tool_selection_prompt(message: str, soap_context: Optional[str]) -> str:
    return f"""You are FanarScribe Clinical Copilot.
Return ONLY valid JSON. No markdown.

The physician asked a question. Decide which clinical tools to run, if any.

Available tools:
- checklist_tool: checks whether required clinical items are documented for a given complaint type
- red_flag_tool: scans the note for missing or present high-risk clinical patterns
- drug_interaction_tool: checks the plan section for known drug-drug interactions
- icd_suggestion_tool: maps the assessment and chief complaint to probable ICD-10 codes

complaint_type options: respiratory, cardiac, gastrointestinal, general

Rules:
- Only call tools that are relevant to the physician's question.
- If the question is a direct clinical knowledge question, set tools_to_call to [].
- Call drug_interaction_tool when medications or prescriptions are mentioned.
- Call icd_suggestion_tool when coding, diagnosis, or ICD is mentioned.
- Limit to 3 tools maximum.

SOAP note context (may be empty):
{soap_context or "(none)"}

Physician question: {message}

Return JSON:
{{
  "reasoning": "...",
  "tools_to_call": ["checklist_tool", "red_flag_tool"],
  "complaint_type": "respiratory|cardiac|gastrointestinal|general"
}}"""


def build_copilot_synthesis_prompt(
    message: str,
    tool_results: List[Dict[str, Any]],
    soap_context: Optional[str],
    history_lines: str,
) -> str:
    tool_block = (
        json.dumps(tool_results, ensure_ascii=False, indent=2)
        if tool_results
        else "(no tools were called)"
    )
    return f"""You are FanarScribe Clinical Copilot, an AI clinical decision-support assistant.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Rules:
- Be concise and clinically accurate.
- Do not make definitive diagnoses; support physician reasoning.
- If tool results show missing items, surface the most important ones clearly.
- Suggest 2-3 relevant follow-up questions where useful.
- sources can be [] if you have no specific references.

SOAP note context:
{soap_context or "(none)"}

Conversation history:
{history_lines or "(none)"}

Tool results:
{tool_block}

Physician question: {message}

Return JSON:
{{
  "assistant_message": "...",
  "sources": [],
  "suggested_follow_ups": ["...", "..."]
}}"""


# ── Pre-consultation intake prompt ────────────────────────────────────────────

def build_intake_prompt(complaint: str, dialect_hint: str) -> str:
    return f"""You are FanarScribe pre-consultation assistant.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

A patient described their main complaint in Arabic/Gulf dialect before their doctor visit.
Normalise the complaint to English, identify any risk flags, and suggest 2-3 questions
the doctor should ask at the start of the consultation.

Dialect hint: {dialect_hint}
Patient complaint: {complaint}

Return JSON:
{{
  "normalized_complaint": "...",
  "risk_flags": [
    {{"flag": "...", "risk": "high|medium|low", "reason": "..."}}
  ],
  "suggested_questions": ["...", "...", "..."]
}}"""


# ── Physician prompt-response (copilot follow-up) ─────────────────────────────

def build_prompt_response_prompt(
    prompt: Dict[str, Any],
    answer: Dict[str, Any],
    scribe_context: Optional[Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> str:
    return f"""You are FanarScribe in physician follow-up mode.
Return ONLY valid JSON. No markdown.

The physician answered a UI prompt. Respond like a careful clinical scribe assistant:
- Acknowledge the answer briefly.
- State which note field or claim should be updated.
- Do not finalise a diagnosis.
- If the answer creates a new ambiguity, ask one concise follow-up question.

Prompt:
{json.dumps(prompt, ensure_ascii=False)}

Physician answer:
{json.dumps(answer, ensure_ascii=False)}

Optional scribe context:
{json.dumps(scribe_context or {}, ensure_ascii=False)}

Conversation history:
{json.dumps(conversation_history or [], ensure_ascii=False)}

Return JSON:
{{
  "assistant_message": "...",
  "note_update_suggestion": {{"section": "...", "operation": "append|replace|remove|none", "text": "..."}},
  "claim_update_suggestion": {{"claim_id": null, "status": "confirmed|rejected|needs_review|none", "reason": "..."}},
  "next_prompts": [
    {{"id": "followup_001", "prompt_type": "mcq|short_answer|buttons", "title": "...", "question": "...", "options": []}}
  ]
}}"""
