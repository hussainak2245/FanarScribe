# SAJIL — سجل

### Arabic-first clinical scribe powered by Fanar

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Fanar](https://img.shields.io/badge/Fanar-LLM-purple?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-ASR%2FFallback-F55036?style=flat-square)

SAJIL is a real-time clinical documentation assistant that listens to Arabic-language physician–patient consultations, transcribes them, normalises Gulf dialect, generates a structured SOAP note, and flags uncertain claims for physician review — reducing documentation burden without hiding ambiguity.

---

## Problem Statement

Physicians in Gulf outpatient clinics spend an estimated 35–40% of their clinical time on documentation rather than direct patient care. Existing AI scribes are built on English-first assumptions: they either require translation as a preprocessing step (introducing compounding errors) or fail on Arabic entirely. Gulf clinical speech is particularly challenging — patients freely mix Modern Standard Arabic, Khaleeji dialect, and English medical terms within a single sentence. Dialect-specific symptom words like **كتمة** (chest tightness, shortness of breath, or both) or **تعبان** (tired to seriously unwell) have no safe default English mapping without clinical context.

Beyond accuracy, there is a patient-safety dimension: an AI that silently commits to a wrong interpretation of an ambiguous term produces a confident but wrong clinical note. SAJIL treats uncertainty as a first-class output — every ambiguous term, every inferred claim, and every weakly supported assertion is surfaced to the physician for verification rather than silently resolved.

---

## Solution Architecture

### Monorepo Layout

```
FanarScribe/
├── api/                  # Python FastAPI backend (deployed to Render)
│   ├── app/
│   │   ├── routers/      # HTTP route handlers
│   │   ├── services/     # LLM integration + pipeline orchestration
│   │   ├── tools/        # Deterministic clinical tools (no LLM)
│   │   ├── prompts.py    # All LLM prompt templates
│   │   └── core/         # Config, pipeline step tracking, JSON parser
│   └── requirements.txt
├── src/                  # Next.js 15 TypeScript frontend
│   ├── app/              # App Router pages (doctor/ and patient/ subtrees)
│   ├── features/         # Domain-scoped React components
│   ├── lib/              # API clients, Supabase queries, utilities
│   └── types/            # Shared TypeScript interfaces
├── supabase/migrations/  # PostgreSQL schema migrations
└── public/               # Static assets
```

### Frontend — Next.js App Router

Pages follow two role-based subtrees:

| Route | Purpose |
|---|---|
| `/` | Landing page with interactive uncertainty demo |
| `/doctor/dashboard` | Appointments list and note history |
| `/doctor/consultation/[encounterId]` | Main scribe workspace: input → process → checkpoint review |
| `/doctor/final-review/[encounterId]` | Edit SOAP sections, download PDF, approve note |
| `/doctor/patient/[patientId]` | Patient detail: medications, allergies, past visits |
| `/patient/intake/[appointmentId]` | Pre-consultation form submitted by patient before visit |
| `/patient/report/[appointmentId]` | Patient-facing post-visit summary |

**State flow through the consultation workspace (`SajilWorkspace.tsx`):**

1. Physician selects input mode: manual transcript entry, audio recording (browser `MediaRecorder`), or file upload (mp3/wav/m4a/webm/flac/ogg).
2. On submit, `processScribe()` POSTs to `/api/v1/scribe/process` and receives the full structured pipeline response.
3. The UI renders: transcript with uncertainty spans highlighted inline, SOAP note in an editable panel, physician checkpoint cards (one per generated question), and the Clinical Copilot chat.
4. Each checkpoint answer POSTs to `/api/v1/scribe/prompt-response`; the response returns a specific note field update suggestion.
5. On final review the physician edits SOAP sections directly, then approves the note (PATCH `/api/v1/notes/{encounterId}`).

### Backend — FastAPI

```
POST /api/v1/scribe/process          # Full 4-step pipeline (main endpoint)
POST /api/v1/scribe/prompt-response  # Physician checkpoint answer → note update
POST /api/v1/encounters              # Create a new consultation session
PATCH /api/v1/notes/{encounter_id}   # Save edited note sections
POST /api/v1/notes/{encounter_id}/approve
POST /api/v1/copilot/chat           # Clinical Copilot: tool selection + synthesis
POST /api/v1/patient-intake         # Pre-consultation complaint normalisation
GET  /api/v1/stats/doctor           # Dashboard statistics
```

The API is stateless between requests. Pipeline results are written to Supabase from the frontend after the API responds.

### Database — Supabase (PostgreSQL)

| Table | Purpose |
|---|---|
| `sajil_encounters` | One row per consultation session. Tracks `patient_record_number`, `dialect_hint`, `status` (`draft → processing → review → saved → finalized`), soft-delete via `deleted_at`. |
| `sajil_scribe_runs` | Full pipeline output: `transcription`, `translation`, `soap_note`, `claims`, `uncertainty`, `uncertain_words`, `physician_questions`, `pipeline` (per-step timing and token counts), `raw_response`. |
| `sajil_physician_prompt_jobs` | Physician checkpoint payloads and async responses. |
| `sajil_note_actions` | ML-assisted note actions (illness pattern review, clinical gap scan). All currently `under_development`. |
| `sajil_copilot_messages` | Copilot conversation history: `role` (`assistant \| physician \| system \| tool`), `content`, `payload`. |
| `public_demo_runs` | Anonymous landing-page demo submissions. Anon users INSERT only; read access restricted to service role. |

RLS is enabled on all tables with open policies (`using (true)`) appropriate for a prototype without authentication. These must be tightened before clinical production use.

### Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│  Browser (Next.js 15)                                             │
│                                                                   │
│  ┌──────────────┐  audio/text  ┌──────────────────────────────┐  │
│  │ Consultation │─────────────►│  FastAPI  (Render)            │  │
│  │ Workspace    │◄─────────────│                               │  │
│  └──────────────┘ pipeline JSON│  ScribeService                │  │
│         │                      │  ┌──────────────────────────┐ │  │
│         │ reads/writes         │  │ 1. Transcription          │ │  │
│         ▼                      │  │    Groq whisper-large-v3  │ │  │
│  ┌──────────────┐              │  │ 2. Translation            │ │  │
│  │  Supabase    │              │  │    Fanar                  │ │  │
│  │  Postgres    │              │  │ 3. SOAP Generation        │ │  │
│  │              │              │  │    Fanar                  │ │  │
│  │ encounters   │              │  │ 4. Uncertainty Scoring    │ │  │
│  │ scribe_runs  │              │  │    Fanar                  │ │  │
│  │ copilot_msgs │              │  │ 5. Rule-based stabilise   │ │  │
│  └──────────────┘              │  └──────────────────────────┘ │  │
│                                │                               │  │
│  ┌──────────────┐              │  CopilotService               │  │
│  │  Copilot     │─────────────►│  tool selection → execute     │  │
│  │  Chat UI     │◄─────────────│  → synthesis (Fanar)          │  │
│  └──────────────┘              └──────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                         │            │
                               ┌─────────┘            └────────┐
                               ▼                               ▼
                     ┌──────────────────┐         ┌───────────────────┐
                     │  Fanar API       │         │  Groq API         │
                     │  api.fanar.qa/v1 │         │  ASR + LLM backup │
                     │  model: "Fanar"  │         │  whisper-large-v3 │
                     └──────────────────┘         │  llama-3.3-70b    │
                                                  └───────────────────┘
```

### Deployment

- **Backend:** Render (`https://fanar-scribe-api.onrender.com`), configured via `.env`.
- **Frontend:** Vercel (Next.js framework preset). `NEXT_PUBLIC_API_BASE_URL` points at the Render backend; Supabase credentials are injected as `NEXT_PUBLIC_*` vars.

---

## Agentic Workflow Design

The pipeline is a sequential four-step chain. Steps 2–4 all call Fanar first; if Fanar throws, Groq (`llama-3.3-70b-versatile`) is the automatic fallback. Every step's timing, token counts, provider, and fallback flag are recorded in a `PipelineLog` and returned in the `pipeline[]` response field.

### Step 1 — Transcription

| | |
|---|---|
| **Input** | Audio file (mp3/wav/m4a/webm/flac/ogg) **or** raw manual text |
| **Model** | Groq `whisper-large-v3` (audio path) / passthrough (manual path) |
| **Output** | `transcription.raw_text`, `segments[]` with `speaker`, `start`, `end`, `confidence` |

`TranscriptionService` posts the audio to Groq Whisper and returns timestamped segments. Speaker diarisation is requested but treated as best-effort (`diarization_status` field signals when it is not applicable).

### Step 2 — Dialect Translation

| | |
|---|---|
| **Input** | Raw transcript + `dialect_hint` (e.g. `gulf`) |
| **Model** | Fanar |
| **Prompt strategy** | Single-shot JSON-mode prompt. Instructs the model to produce a clinical English translation, a `normalized_clinical_meaning` list (each entry carries the original Arabic evidence text, English meaning, and certainty), and an `uncertain_words` array for every term with multiple plausible clinical meanings. `dialect_ambiguity` is called out explicitly as the most important flag type. |
| **Output** | `translation.clinical_translation` (fed into step 3), `uncertain_words[]` (fed into step 3's prompt header and step 4's uncertainty panel) |

The prompt explicitly prohibits inventing clinical facts and requires preserving original Arabic evidence in the output — this keeps source evidence traceable through the English pipeline.

### Step 3 — SOAP Note Generation

| | |
|---|---|
| **Input** | Arabic transcript, English clinical translation (step 2), uncertain words summary, patient context JSON, encounter metadata |
| **Model** | Fanar |
| **Prompt strategy** | Single-shot JSON-mode prompt. Uncertain words are passed upfront so the model knows which terms are already flagged. Instructs the model to mark inferred claims explicitly (`status: "inferred"`), not invent vitals or diagnoses, preserve Arabic evidence inside claim evidence fields, and use speaker labels (`doctor / patient / unknown`). A `note_format` parameter lets the format be configured at request time. |
| **Output** | `soap_note` (S/O/A/P structure with `overall_quality_level`), `claims[]` (each with `id`, `section`, `text`, `evidence[]`, `confidence`, `level`, `status`) |

### Step 4 — Uncertainty Scoring

| | |
|---|---|
| **Input** | Arabic transcript, condensed SOAP summary, up to 12 claims from step 3 |
| **Model** | Fanar |
| **Prompt strategy** | Single-shot JSON-mode prompt. Defines five evidence levels (`supported / weakly_supported / inferred / unsupported / contradicted`) and asks the model to score each claim. Also generates `physician_questions[]` — structured questions (MCQ, yes/no, free text, confirm/reject) tied to specific claims and uncertain words. The model's claim evaluations are merged back into the `claims[]` array after this step. |
| **Output** | `uncertainty` object (overall score 0–1, level, five scoring dimensions), `physician_questions[]` |

### Rule-Based Stabilisation Layer (post-step 4)

`UncertaintyService.stabilize()` runs deterministically after all LLM steps:

- **Arabic phrase bank** — matches 6 high-ambiguity Khaleeji terms (`كتمة`, `ضيقة`, `دوخة`, `نغزات`, `خفقان`, `تعبان`) in the transcript and adds them to `uncertain_words` with documented possible meanings.
- **Risk weighting** — assigns `critical / high / medium` risk to flagged spans by clinical category (allergy, medication dose, negation, chest pain, oxygen saturation, anticoagulants, pregnancy, etc.).
- **Negation detection** — scans for Arabic negation markers (`ما `, `لا `, `ليس`, `مو `, `مب `, `لم `, `لن `, `غير `) within 20 characters of an uncertain term; escalates risk to `critical` when found.
- **Uncertainty spans** — produces `uncertainty_spans[]` consumed by the frontend to render wavy underlines on flagged words in the transcript view.

### Physician-in-the-Loop Checkpoints

After the pipeline response arrives on the frontend:

1. **Checkpoint cards** are rendered — one per `physician_prompts[]` entry. Always appended: a free-text clarification field and a "Keep reviewing / Mark ready later" button group.
2. The physician **answers a checkpoint** → frontend POSTs to `/api/v1/scribe/prompt-response` → Fanar (or Groq fallback) receives the original prompt, answer, scribe context, and conversation history → responds with `assistant_message`, `note_update_suggestion` (`section`, `operation: append|replace|remove`, `text`), `claim_update_suggestion` (`status: confirmed|rejected|needs_review`), and optional `next_prompts` if the answer introduced a new ambiguity.
3. **Finalization** — physician edits SOAP sections in the final-review page, then approves, writing the finished note to Supabase.

### Clinical Copilot

The Copilot is a separate conversational layer on top of the generated note:

1. Physician types a clinical question while reviewing the SOAP note.
2. `CopilotService` sends it to Fanar with a **tool-selection prompt** that returns `tools_to_call[]` (up to 3 from: `checklist_tool`, `red_flag_tool`, `drug_interaction_tool`, `icd_suggestion_tool`) and a `complaint_type`.
3. Selected tools execute deterministically (Python rule logic in `api/app/tools/`).
4. Tool results are passed to a **synthesis prompt** that instructs Fanar to produce a concise clinical response with sources and 2–3 suggested follow-up questions.
5. Conversation history stored in `sajil_copilot_messages` is included in each synthesis call to maintain context across turns.

### Frontend Progress Display

The API response includes `frontend_hints.tabs[]` with five ready-state tabs (overview, transcript, SOAP, uncertainty, prompts). The current implementation does not stream intermediate steps — all tabs activate together on pipeline completion.

---

## Use of Fanar and External Tools

### Fanar

- **API:** OpenAI-compatible client at `https://api.fanar.qa/v1`, model id `"Fanar"`.
- **Used for:** Steps 2, 3, and 4 of the scribe pipeline (translation, SOAP, uncertainty), Clinical Copilot tool-selection and synthesis, physician checkpoint responses, and pre-consultation intake normalisation.
- **Why Fanar:** Arabic-native language understanding is the core requirement. Translation-layer approaches (translate Arabic → English first, then process) compound errors — dialect-specific terms that lack direct English equivalents get flattened or dropped before the clinical model ever sees them. Fanar processes the Arabic transcript directly, which is why the prompts instruct it to preserve original Arabic evidence text in the output rather than discarding it.

### Groq

- **ASR:** `whisper-large-v3` for fast audio transcription.
- **LLM fallback:** `llama-3.3-70b-versatile` — used automatically for any pipeline step where Fanar throws. The `pipeline[]` response field records `fallback: true` and the fallback model name for each affected step.

### Deterministic Clinical Tools

These run inside the FastAPI process with no LLM call:

| Tool | What it does |
|---|---|
| `checklist_tool` | Checks whether required clinical items are documented for the detected complaint type |
| `red_flag_tool` | Scans the note for missing or present high-risk clinical patterns |
| `drug_interaction_tool` | Scans the plan section for known drug–drug interactions |
| `icd_tool` | Maps assessment and chief complaint to probable ICD-10 codes |

### Supabase

Persistence layer for encounters, scribe runs, copilot message history, and demo submissions. The frontend writes directly to Supabase using the anon publishable key after receiving the pipeline response from the backend.

---

## Evaluation Results

*Results to be added after formal evaluation phase.*

---

## Recommendations for Future Fanar Improvements

The following observations come directly from the prompt workarounds, fallback logic, and rule-based patches in the codebase.

**1. Reliable structured output (JSON mode)**
All four pipeline prompts include `Return ONLY valid JSON. No markdown. No explanation outside the JSON.` and the backend applies a custom `extract_json_object()` recovery parser to handle formatting violations. A model-level JSON schema enforcement would remove this fragile layer and prevent Groq fallback triggered by formatting alone rather than factual failure.

**2. Broader Gulf Arabic dialect coverage**
`UncertaintyService` maintains a hardcoded phrase bank of 6 Khaleeji ambiguity terms because the model cannot be relied on to flag them independently. Expanding Fanar's native clinical vocabulary for Gulf, Levantine, and Egyptian dialectal variation — particularly the overlap between symptom descriptors that differ by region (`تعبان` / `زهقان` / `مش بخير`) — would reduce reliance on this static list.

**3. Medical terminology grounding**
The SOAP prompt prohibits inventing diagnoses not present in the transcript, but there is no mechanism for the model to signal uncertainty about a clinical term's meaning (e.g. whether `نغزات` maps to paresthesia or pleuritic pain). A Fanar model with Arabic medical ontology grounding, or a term-level confidence signal, would improve claim precision without the current three-step LLM evaluation pass.

**4. Stateful evidence linking across checkpoint turns**
The physician checkpoint loop passes conversation history as a flat JSON array. When a physician's answer resolves an uncertain word, the model returns a `note_update_suggestion` but the link from the original `uncertain_word.id` to the resolved claim is not maintained across stateless API calls. Stateful context persistence within Fanar, or a conversation-scoped session API, would allow each physician answer to propagate to the correct evidence chain without the frontend managing this externally.

**5. Streaming for real-time note building**
The pipeline makes three sequential Fanar calls (translation → SOAP → uncertainty) synchronously. For real-time use during a live consultation, streaming partial SOAP sections as translation completes would significantly improve the physician experience. A streamed structured-output endpoint from Fanar for the translation step specifically would unblock incremental note building.

**6. Calibrated confidence signalling**
The uncertainty step asks Fanar to assign evidence levels to each claim, but the scores reflect the model's opinion, not a calibrated probability. Access to token-level log-probabilities (or a calibrated confidence output) from Fanar would let the uncertainty scoring cross-validate model confidence against claim evidence quality, making physician checkpoints more precisely targeted and reducing noise in the flagging.

---

## Run Locally

**Backend:**
```bash
cd api
cp .env.example .env   # fill in FANAR_API_KEY and GROQ_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

Open `http://localhost:3000`. The landing page demo runs without auth. The consultation workspace requires a valid encounter ID created via `POST /api/v1/encounters`.

**Apply database schema:**
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```
