# SAJIL — سجل

### Arabic-first clinical scribe powered by Fanar

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Fanar](https://img.shields.io/badge/Fanar-LLM-purple?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-ASR%2FFallback-F55036?style=flat-square)

SAJIL listens to Arabic doctor–patient consultations, transcribes them across Gulf dialects, generates a structured SOAP note, and flags uncertain claims for physician review — reducing documentation burden without hiding ambiguity.

---

## Problem Statement

Physicians in Gulf outpatient clinics spend 35–40% of clinical time on documentation. Existing AI scribes are English-first: they either require translation as a preprocessing step (compounding errors) or fail on Arabic entirely. Gulf clinical speech freely mixes Modern Standard Arabic, Khaleeji dialect, and English medical terms. Symptom words like **كتمة** (chest tightness, shortness of breath, or both) have no safe default English mapping without clinical context.

SAJIL treats uncertainty as a first-class output — every ambiguous term and inferred claim is surfaced for physician verification rather than silently resolved.

---

## Architecture

**Monorepo:**
```
FanarScribe/
├── api/                  # Python FastAPI backend (Render)
│   ├── app/
│   │   ├── routers/      # HTTP route handlers
│   │   ├── services/     # Pipeline B orchestration + LLM integration
│   │   ├── tools/        # Deterministic clinical tools (no LLM)
│   │   ├── prompts.py    # All LLM prompt templates
│   │   └── core/         # Config, pipeline step tracking, JSON parser
├── src/                  # Next.js 15 TypeScript frontend
│   ├── app/              # App Router pages
│   ├── features/         # Domain-scoped React components
│   └── lib/              # API clients, Supabase queries
└── supabase/migrations/  # PostgreSQL schema
```

**Routes:**

| Route | Purpose |
|---|---|
| `/` | Landing page with dialect demo |
| `/doctor/dashboard` | Appointments and note history |
| `/doctor/consultation/[encounterId]` | Main scribe workspace |
| `/doctor/final-review/[encounterId]` | Edit, approve, download SOAP note |
| `/patient/intake/[appointmentId]` | Pre-consultation patient form |
| `/patient/report/[appointmentId]` | Patient-facing post-visit summary |

**API endpoints:**
```
POST /api/v1/scribe/process          # Full Pipeline B (main endpoint)
POST /api/v1/scribe/prompt-response  # Physician checkpoint → note update
POST /api/v1/encounters              # Create consultation session
PATCH /api/v1/notes/{encounter_id}   # Save edited note sections
POST /api/v1/copilot/chat            # Clinical Copilot tool-selection + synthesis
```

**Database (Supabase):**

| Table | Purpose |
|---|---|
| `sajil_encounters` | One row per session — dialect, status, soft-delete |
| `sajil_scribe_runs` | Full pipeline output including `logprob_data` |
| `sajil_physician_prompt_jobs` | Checkpoint payloads and responses |
| `sajil_copilot_messages` | Copilot conversation history |
| `public_demo_runs` | Anonymous landing-page submissions |

---

## Pipeline B (Production)

6-step sequential pipeline — Fanar-native, no Groq LLM calls:

```
Audio → Fanar-Aura-STT-LF-1 → Fanar-S-1-7B (Check) → Fanar-S-1-7B (SOAP + logprobs=True)
      → Fanar-S-1-7B (Eval) → Fanar-S-1-7B (Judge) → Fanar-S-1-7B (Q-eval)
```

**Logprob normalisation:** `normalised_score = max(0.0, min(1.0, (avg_logprob + 5) / 5))`

**Escalation:** `mandatory_review = True` when `normalised_score < 0.65`, `below_threshold` (`avg_logprob < -1.5`), Moroccan dialect, or mixed dialect.

**Special cases:**
- Files > 900 KB: partial JSON recovery on the check step (`partial_check: true`)
- Moroccan / Darija: always `mandatory_review: true` regardless of score
- Mixed-dialect consultations: always `mandatory_review: true`

### Physician-in-the-Loop

1. Pipeline B returns `physician_questions[]` — structured MCQ / yes-no / free-text cards.
2. Physician answers a checkpoint → POST to `/api/v1/scribe/prompt-response` → Fanar returns `note_update_suggestion` and `claim_update_suggestion`.
3. Physician edits SOAP sections in the final-review page and approves.

### Clinical Copilot

Separate conversational layer over the generated note. `CopilotService` uses Fanar for tool-selection (`checklist_tool`, `red_flag_tool`, `drug_interaction_tool`, `icd_tool`), executes selected tools deterministically, then synthesises results with conversation history.

---

## Use of Fanar

**Fanar-Aura-STT-LF-1** — primary Arabic-aware STT. Fallback: `Fanar-Aura-STT-1`, then Groq `whisper-large-v3` (ASR only).

**Fanar-S-1-7B** — all 5 LLM steps (Check, SOAP, Eval, Judge, Q-eval). Fanar processes Arabic directly without translation preprocessing — this preserves dialect-specific symptom words that would be flattened in a translate-first approach.

`logprobs=True` on the SOAP generation call returns token-level confidence at zero extra latency cost. Token confidence is model-native and cannot be inflated by the model's own self-assessment.

---

## Run Locally

**Backend:**
```bash
cd api
cp .env.example .env   # fill FANAR_API_KEY and GROQ_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

**Database:**
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

---

# Can an AI Medical Scribe Know When It Does Not Know?
## Uncertainty Evaluation Across Arabic Dialects

**Fanar AI Hackathon — Research Report**
*Qatar, June 2026*

---

## What this is

A medical scribe that transcribes Arabic consultations and generates SOAP notes needs to do more than produce output — it needs to signal when it is uncertain. A confident wrong answer in a clinical setting is more dangerous than an honest "I am not sure."

This experiment tests whether different AI pipeline designs can reliably detect their own uncertainty when processing Arabic medical audio across five dialects.

---

## Objective

- Measure uncertainty detection quality across Arabic dialect variation
- Compare self-reported confidence (self-eval) against model-native confidence (logprobs)
- Determine whether a second-pass judge improves reliability
- Evaluate the quality of physician checkpoint questions generated by each pipeline

---

## Data

**Audio generation:** Eight synthetic medical consultations generated using ElevenLabs text-to-speech, scripted to reflect realistic doctor-patient dialogues in different Arabic dialects.

**Dialect verification:** Each audio file was verified by a native Arabic speaker for dialect authenticity and naturalness.

**Medical validation:** Medical accuracy and clinical practicality were assessed by a medical student at Qatar University.

**Files:**

| File | Dialect | Age | Presentation |
|------|---------|-----|--------------|
| abdullah&hazem_63_saud_egy.mp3 | Saudi + Egyptian | 63 | Headache, fatigue |
| abdullah2_58s_saudi.mp3 | Saudi | 58 | Headache, dizziness |
| farah_leila_43_jor_syr.mp3 | Jordanian + Syrian | 43 | Palpitations, weight loss |
| hasawi_abdullah_50_saudi.mp3 | Saudi | 50 | Numbness, balance issues |
| haytham_ahmed_32_egy.mp3 | Egyptian | 32 | Thirst, frequent urination |
| haytham_rafoush_71_egy_syr.mp3 | Egyptian + Syrian | 71 | Joint pain, breathlessness |
| jawad_ghazline_67_morocco.mp3 | Moroccan | 67 | Fatigue, breathing difficulty |
| sarah_ghaida_59_jor_syr.mp3 | Jordanian + Syrian | 59 | Facial acne, scarring |

---

## Dialects covered

- **Saudi** — Gulf Arabic, Najdi and Hejazi features
- **Egyptian** — most widely understood Arabic dialect
- **Jordanian / Syrian** — Levantine Arabic, mutually intelligible
- **Moroccan** — Darija, heaviest divergence from Modern Standard Arabic, Amazigh and French influence
- **Mixed** — three files feature two-dialect interactions, reflecting real clinical settings in the Gulf

---

## Pipeline designs

All pipelines use Fanar-Aura-STT-LF-1 for Arabic-aware speech-to-text.

**Pipeline A — Fanar self-eval (baseline)**
- Fanar STT → self-check → SOAP → self-eval
- The model that wrote the note also scores it
- Limitation: self-serving bias inflates scores

**Pipeline B — Fanar logprob + judge (recommended)**
- Fanar STT → self-check → SOAP with `logprobs=True` → self-eval → judge
- `logprobs=True` on the SOAP call returns token-level confidence at zero extra cost
- Token confidence is model-native and cannot be inflated
- A judge sees three signals: self-eval score, logprob score, most uncertain tokens

**Pipeline C — Fanar + Groq + Fanar judge**
- Fanar and Groq run in parallel; Fanar judges both outputs
- Disagreement between models = real clinical uncertainty
- Found in testing: Fanar judge returned malformed scores on the comparison task

**Pipeline E — Fanar + Groq + Groq judge**
- Same parallel execution as C, Groq (Llama-3.3-70B) judges instead
- Removes home-team bias; Groq judge finished in 2-3 seconds vs 12-28 seconds for Fanar

---

## System design (Pipeline B)

```
Audio file
    |
    v
Fanar-Aura-STT-LF-1          Step 1: Dialect-aware transcription
    |  Arabic transcript
    v
Fanar-S-1-7B                 Step 2: Self-check — flags uncertain phrases
    |  uncertain_words[]
    v
Fanar-S-1-7B                 Step 3: SOAP generation
  logprobs=True                        + token log-probabilities (free)
    |  SOAP note + logprobs
    v
  avg_logprob → score [0,1]   score = (avg_logprob + 5) / 5
    |
    v
Fanar-S-1-7B                 Step 4: Self-eval — scores own output
    |  claim scores, 5 dimensions
    v
Fanar-S-1-7B                 Step 5: Judge — sees all three signals
    |  final score, physician questions
    v
Fanar-S-1-7B                 Step 6: Question eval — scores physician questions
    |
    v
JSON output
```

---

## Experiment summary

7 of 8 files completed. `haytham_rafoush_71_egy_syr.mp3` failed all pipelines due to truncated JSON from the self-check step on a 1114 KB two-dialect file.

**Scores by dialect (Pipeline B vs baselines):**

| Dialect | A (self-eval) | B (logprob+judge) | E (neutral judge) |
|---------|:---:|:---:|:---:|
| Saudi | 0.38 | 0.79 | 0.70 |
| Egyptian | 0.60 | 0.87 | 0.65 |
| Jordanian | 0.17 | 0.93 | 0.77 |
| Syrian | 0.17 | 0.93 | 0.77 |
| Moroccan | 0.45 | 0.94 | 0.70 |

**Timing per file:**

| Pipeline | Avg time | Provider |
|----------|----------|----------|
| A | 62s | Fanar only |
| B | 81s | Fanar only |
| C | 81s | Fanar + Groq |
| E | 65s | Fanar + Groq |

---

## Complete test case

**File:** `farah_leila_43_jor_syr.mp3`
**Dialect:** Jordanian + Syrian
**Presentation:** Female, 43, palpitations, hand tremor, sweating, weight loss, insomnia, irritability for 2 months. Working diagnosis: hyperthyroidism.

**Transcript difference between providers:**
- Fanar: `رجفة بالدين` (tremor in the religion — nonsensical)
- Groq: `رجفة باليدين` (tremor in the hands — correct)

This single character difference (`ي` missing in Fanar's output) changes a key clinical symptom. Only Pipeline E (cross-model comparison) surfaced this.

**Logprob detail (Pipeline B):**
```
Tokens analysed : 486
Avg log-prob    : -0.228
Score (0-1)     : 0.954    (model was confident overall)
Below threshold : No

Most uncertain tokens:
  قلب  (heart)      -2.14   clinical term
  زيادة (increase)  -2.13   clinical modifier
  وق    (fragment)  -2.63   possible truncation artifact
```

The uncertain tokens are clinical words, not structural JSON — confirming logprobs are tracking meaningful uncertainty.

**Uncertainty scores across pipelines:**

| Pipeline | Score | Transcription | Dialect | Clinical |
|----------|:-----:|:---:|:---:|:---:|
| A | 0.00 | 0.0 | 0.0 | 0.0 |
| B | 0.90 | 0.8 | 0.7 | 0.9 |
| C | 0.80 | 0.7 | 0.6 | 0.5 |
| E | 0.70 | 0.8 | 0.6 | 0.7 |

Pipeline A scored 0.00 on all five dimensions — a complete self-evaluation failure on a file that every other pipeline handled well.

**Best physician question from this file (Pipeline E):**
> ما هو أفضل اختبار لتشخيص فرط نشاط الغدة الدرقية؟
> MCQ — options: تحليل هرمون الغدة الدرقية / تخطيط القلب / فحص دم للغدة الدرقية
> Rationale: Confirms whether TSH/T4 has been ordered given the classic hyperthyroid symptom cluster.

---

## Results and discussion

**Self-eval (A) is unreliable.**
- Scored 0.00 on two files where B scored 0.90+
- Average gap between A and B: 0.44 score points across all files
- Cannot be trusted as a standalone uncertainty signal

**Logprobs (B) are the most reliable signal.**
- Highest average scores across all five dialects
- Model-native: cannot be inflated by the model's self-assessment
- Zero additional API cost or latency
- Consistent across dialect variation — even Moroccan scored 0.94

**Neutral judge (E) applies a stricter standard.**
- Groq consistently chose "merged" rather than picking a winner
- Scores 10-20 points below B, suggesting Groq applied more skepticism
- Lacks the Arabic dialect context that Fanar has, which may explain the lower scores on dialect-heavy files

**Moroccan is the hardest dialect, but logprobs still worked.**
- Both STT models struggled: Fanar wrote `ماش`, Groq wrote `مها` for the opening greeting
- Despite the noisy transcript, Pipeline B scored 0.94 — SOAP generation recovered well
- The uncertain tokens from the Moroccan file were the most numerous in the dataset

**Physician question quality is the weakest part of all pipelines.**
- Most files scored 1-3 out of 8 on question quality
- Generic questions ("هل تعاني من حمى؟") were the main failure mode
- Best questions referenced specific transcript findings and had clear clinical rationale
- Larger model (`Fanar-C-2-27B`) would likely improve this significantly

**The `haytham_rafoush` failure is a prompt engineering issue, not a model failure.**
- The self-check model truncated its JSON output on a 1114 KB two-dialect file
- Partial recovery (extracting complete word objects before the cut) would allow the pipeline to continue
- The SOAP note can still be generated without uncertain word annotations

---

## Recommendations

**Production:** Use Pipeline B with escalation to Pipeline E when score falls below 0.65.

**Question generation:** Switch to `Fanar-C-2-27B` for the eval and judge steps when rate limits allow.

**Moroccan and mixed-dialect files:** Always flag for physician review regardless of score.

**Long files (above 900 KB):** Add partial recovery to the self-check step to prevent total pipeline failure.

---

## Technical stack

| Component | Model / Tool |
|-----------|-------------|
| Speech-to-text | Fanar-Aura-STT-LF-1 (fallback: STT-1) |
| All LLM steps | Fanar-S-1-7B |
| Cross-model STT | Groq Whisper-large-v3 |
| Cross-model LLM | Groq Llama-3.3-70B-Versatile |
| Audio synthesis | ElevenLabs |
| Runtime | Python 3.12, httpx, asyncio, nest-asyncio |
| Notebook | Jupyter / Google Colab |

---

## Repository

```
experiment.ipynb            main notebook, run cells 1 to 5 top to bottom
experiment_results.json     full results: transcript, SOAP, logprobs, scores, questions
README.md                   this document
demo-audio/                 8 dialect audio files (.mp3)
```
