"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clipboard,
  Download,
  FileText,
  ListChecks,
  LoaderCircle,
  MessageCircle,
  Mic,
  Paperclip,
  Pause,
  Play,
  ShieldAlert,
  Square,
  Wrench,
  X,
  Zap
} from "lucide-react";
import {
  fetchDemo,
  processScribe,
  respondToPhysicianPrompt,
  type LogprobData,
  type PromptResponse,
  type ScribeResponse,
  type ScribeSourceMode
} from "@/lib/api/scribe";
import { sendPhysicianPromptGhost } from "@/lib/api/physician-prompts";
import { sendCopilotMessage, type CopilotToolCallResult } from "@/lib/api/copilot";
import { routes } from "@/lib/constants/routes";
import {
  listCopilotMessages,
  saveCopilotMessage,
  saveGhostPromptJob,
  saveScribeRun
} from "@/lib/supabase/sajil";
import { toJson } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type InputMode = "manual" | "record" | "upload";
type MobilePanel = "list" | "main" | "copilot";
type ChatRole = "assistant" | "physician" | "system" | "tool";
type RiskLevel = "critical" | "high" | "medium";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls?: CopilotToolCallResult[];
  suggestedFollowUps?: string[];
  createdAt: string;
};

type WorkspaceScribe = {
  id: string;
  time: string;
  patient: string;
  summary: string;
  status: string;
};

type PhysicianPrompt = {
  id: string;
  type: string;
  priority?: string;
  title?: string;
  question: string;
  reason?: string;
  options: Array<{ label: string; value: string }>;
};

type NoteAction = {
  id: string;
  label: string;
  description?: string;
};

type UncertainWord = {
  id?: string;
  text: string;
  risk?: RiskLevel;
  possible_meanings?: string[];
  reason?: string;
  score?: number;
};

type PipelineAnimStep = {
  name: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
  provider?: string;
  duration_ms?: number;
  fallback?: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const PIPELINE_STEP_DEFS: { name: string; label: string }[] = [
  { name: "translation", label: "Dialect translation" },
  { name: "soap_generation", label: "SOAP generation" },
  { name: "uncertainty", label: "Uncertainty scoring" },
  { name: "claim_evaluation", label: "Claim evidence" }
];

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mp3", "audio/mpeg", "audio/wav", "audio/x-wav",
  "audio/m4a", "audio/x-m4a", "audio/mp4", "video/mp4",
  "audio/aac", "audio/ogg", "audio/webm", "audio/flac"
]);
const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "aac", "ogg", "webm", "flac"];

type DemoConfig = {
  key: string;
  label: string;
  dialect: string;
  file: string;
};

const DEMO_CONFIGS: DemoConfig[] = [
  { key: "haytham_ahmed_32_egy",       label: "🇪🇬 Egyptian",      dialect: "egyptian",  file: "haytham_ahmed_32_egy.mp3" },
  { key: "abdullah2_58s_saudi",        label: "🇸🇦 Gulf",          dialect: "gulf",      file: "abdullah2_58s_saudi.mp3" },
  { key: "farah_leila_43_jor_syr",     label: "🇸🇾 Levantine",     dialect: "levantine", file: "farah_leila_43_jor_syr.mp3" },
  { key: "hasawi_abdullah_50_saudi",   label: "🇸🇦 Hasawi Gulf",   dialect: "gulf",      file: "hasawi_abdullah_50_saudi.mp3" },
  { key: "haytham_rafoush_71_egy_syr", label: "🇸🇾 Egy · Syr",    dialect: "egyptian",  file: "haytham_rafoush_71_egy_syr.mp3" },
  { key: "abdullah_hazem_63_saud_egy", label: "🇪🇬 Gulf · Egy",   dialect: "gulf",      file: "abdullah&hazem_63_saud_egy.mp3" },
  { key: "jawad_ghazline_67_morocco",  label: "🇲🇦 Moroccan",     dialect: "msa",       file: "jawad_ghazline_67_morocco.mp3" },
  { key: "sarah_ghaida_59_jor_syr",   label: "🇸🇾 Levantine · F", dialect: "levantine", file: "sarah_ghaida_59_jor_syr.mp3" },
];

const toolItems = [
  { label: "Run checklist", icon: ListChecks, query: "Run the clinical checklist for this consultation and tell me what's missing." },
  { label: "Red flags", icon: ShieldAlert, query: "Scan this note for red flags and high-risk clinical patterns." },
  { label: "Drug interactions", icon: Wrench, query: "Check the plan section for any drug-drug interactions." },
  { label: "ICD codes", icon: FileText, query: "Suggest ICD-10 codes for the diagnosis in this SOAP note." },
];

// ── Helper functions ──────────────────────────────────────────────────────────

function validateAudioFile(file: File): string | null {
  if (file.size > MAX_AUDIO_FILE_SIZE)
    return `File too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is 200 MB.`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_AUDIO_TYPES.has(file.type) && !SUPPORTED_EXTENSIONS.includes(ext))
    return `Unsupported format. Supported: ${SUPPORTED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`;
  return null;
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = ["cleaned_text", "raw_text", "clinical_translation", "chief_complaint",
      "summary", "assistant_message", "text", "content", "note", "value"];
    for (const key of preferred) {
      if (typeof record[key] === "string") return record[key] as string;
    }
    return Object.entries(record)
      .map(([key, entry]) => { const t = asText(entry); return t ? `${key.replaceAll("_", " ")}: ${t}` : ""; })
      .filter(Boolean).join("\n");
  }
  return "";
}

function getArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["items", "questions", "prompts", "actions", "words", "spans", "flags", "data"]) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return [];
}

function getSoapSections(value: unknown): Array<{ title: string; body: string }> {
  if (!value) return [];
  if (typeof value === "string") return [{ title: "SOAP", body: value }];
  if (typeof value !== "object") return [{ title: "SOAP", body: asText(value) }];
  const record = value as Record<string, unknown>;
  const source = record.sections && typeof record.sections === "object"
    ? (record.sections as Record<string, unknown>) : record;
  const order = ["subjective", "objective", "assessment", "plan"];
  const sections = order.map((key) => ({ title: key, body: asText(source[key]) }));
  const hasContent = sections.some((s) => s.body);
  return hasContent ? sections : [{ title: "SOAP", body: asText(value) }];
}

function getUncertainWords(response: ScribeResponse | null): UncertainWord[] {
  return getArray(response?.uncertain_words).reduce<UncertainWord[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;
    const r = item as Record<string, unknown>;
    const text = asText(r.text ?? r.word ?? r.phrase);
    if (!text) return acc;
    acc.push({
      id: asText(r.id),
      text,
      risk: (r.risk as RiskLevel | undefined),
      possible_meanings: getArray(r.possible_meanings).map(asText).filter(Boolean),
      reason: asText(r.reason),
      score: typeof r.score === "number" ? r.score : undefined
    });
    return acc;
  }, []).slice(0, 8);
}

function getPhysicianPrompts(response: ScribeResponse | null): PhysicianPrompt[] {
  const source = getArray(response?.physician_prompts).length > 0
    ? getArray(response?.physician_prompts)
    : getArray(response?.physician_questions);

  return source.reduce<PhysicianPrompt[]>((prompts, item, index) => {
    if (typeof item === "string") {
      prompts.push({ id: `prompt_${index}`, type: "short_answer", question: item, options: [] });
      return prompts;
    }
    if (!item || typeof item !== "object") return prompts;
    const record = item as Record<string, unknown>;
    const prompt = {
      id: asText(record.id) || `prompt_${index}`,
      type: asText(record.prompt_type ?? record.type) || "short_answer",
      priority: asText(record.priority),
      title: asText(record.title),
      question: asText(record.question ?? record.prompt ?? record.text),
      reason: asText(record.reason),
      options: getArray(record.options ?? (record.ui as Record<string, unknown> | undefined)?.options ?? []).map((option, optionIndex) => {
        if (typeof option === "string") return { label: option, value: option };
        const o = option as Record<string, unknown>;
        return {
          label: asText(o.label) || `Option ${optionIndex + 1}`,
          value: asText(o.value ?? o.label) || `option_${optionIndex + 1}`
        };
      })
    };
    if (prompt.question) prompts.push(prompt);
    return prompts;
  }, []).slice(0, 5);
}

function getDefaultReviewPrompts(): PhysicianPrompt[] {
  return [
    {
      id: "review_allergy",
      type: "single_choice",
      title: "Allergy status",
      question: "Was allergy status discussed during this consultation?",
      options: [
        { label: "No known allergies", value: "nka" },
        { label: "Allergies present — documented", value: "allergies_present" },
        { label: "Not discussed", value: "not_discussed" }
      ]
    },
    {
      id: "review_next_step",
      type: "single_choice",
      title: "Note status",
      question: "How should this draft note move forward?",
      options: [
        { label: "Keep as draft", value: "keep_draft" },
        { label: "Needs physician edits", value: "needs_edits" },
        { label: "Ready for final review", value: "ready_final_review" }
      ]
    }
  ];
}

function nowLabel() {
  return new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-app px-2 py-0.5 text-xs font-medium pixel-pop ${
      status === "Ready" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"
    }`}>{status}</span>
  );
}

function SignalTrace() {
  return (
    <span className="signal-trace" aria-hidden="true">
      <span /><span /><span /><span /><span />
    </span>
  );
}

function RiskChip({ risk }: { risk?: RiskLevel }) {
  if (!risk) return null;
  const styles: Record<RiskLevel, string> = {
    critical: "bg-red-100 text-red-700 ring-1 ring-red-200",
    high: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    medium: "bg-zinc-100 text-zinc-500"
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[risk]}`}>
      {risk}
    </span>
  );
}

const UNCERTAIN_HIGHLIGHT: React.CSSProperties = {
  backgroundColor: "#FFE0B2",
  color: "#E65100",
};

/** Highlight uncertain terms in transcript */
function HighlightedTranscript({ text, words }: { text: string; words: UncertainWord[] }) {
  if (!text || words.length === 0) return <span className="whitespace-pre-wrap">{text}</span>;

  const wordByText = new Map<string, UncertainWord>();
  words.forEach((w) => wordByText.set(w.text.toLowerCase(), w));

  const escaped = words
    .filter((w) => w.text.length > 1)
    .map((w) => w.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) return <span className="whitespace-pre-wrap">{text}</span>;

  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const word = wordByText.get(part.toLowerCase());
        if (!word) return part;
        const title = word.possible_meanings?.length
          ? `Possible: ${word.possible_meanings.join(" · ")}`
          : word.reason ?? "";
        return (
          <span key={i} className="relative group/uw inline-block cursor-help rounded-app px-1" style={UNCERTAIN_HIGHLIGHT}>
            {part}
            {title && (
              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 w-52 rounded-lg border border-accent-200 bg-white p-2 text-xs leading-5 text-zinc-700 shadow-lg opacity-0 transition-opacity duration-150 group-hover/uw:opacity-100 whitespace-normal">
                {title}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

const THINKING_PHRASES = [
  "Listening to Arabic dialect patterns…",
  "Checking for uncertain clinical terms…",
  "Generating SOAP note with Fanar…",
  "Measuring token-level confidence…",
  "Scoring note quality across 5 dimensions…",
  "Synthesising uncertainty signals…",
  "Identifying physician checkpoint questions…",
  "Evaluating question quality…",
  "Applying escalation rules…",
  "Finalising clinical note…",
];

/** Animated thinking phrase stream shown while Pipeline B runs */
function ThinkingStream() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const cycle = () => {
      setOpacity(0);
      const fadeIn = setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % THINKING_PHRASES.length);
        setOpacity(1);
      }, 300);
      return fadeIn;
    };
    const interval = setInterval(cycle, 2100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-accent-500" />
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Fanar Pipeline B
        </p>
        <LoaderCircle className="ml-auto h-3.5 w-3.5 animate-spin text-accent-400" />
      </div>
      <p
        className="text-sm text-zinc-600 transition-opacity duration-300"
        style={{ opacity }}
      >
        {THINKING_PHRASES[phraseIndex]}
      </p>
    </div>
  );
}

/** Compact badge shown after pipeline completes */
function PipelineBadge({ pipeline }: { pipeline: ScribeResponse["pipeline"] }) {
  if (!pipeline) return null;
  const p = pipeline as Record<string, unknown>;
  const totalMs = typeof p.total_ms === "number" ? p.total_ms : 0;
  const fanarCalls = typeof p.fanar_calls === "number" ? p.fanar_calls : 0;
  const fallbackCalls = typeof p.fallback_calls === "number" ? p.fallback_calls : 0;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
        <Zap className="h-3 w-3" />
        Fanar · {fanarCalls} step{fanarCalls !== 1 ? "s" : ""}
      </span>
      {fallbackCalls > 0 && (
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Groq fallback · {fallbackCalls}
        </span>
      )}
      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
        {(totalMs / 1000).toFixed(1)}s total
      </span>
    </div>
  );
}

/** Logprob confidence badge shown next to SOAP header */
function LogprobBadge({ data }: { data: LogprobData | undefined }) {
  if (!data || data.normalised_score == null) return null;
  const pct = Math.round(data.normalised_score * 100);
  const [color, label] =
    pct >= 80 ? ["bg-emerald-100 text-emerald-700", "High confidence"]
    : pct >= 65 ? ["bg-amber-100 text-amber-700", "Moderate confidence"]
    : ["bg-red-100 text-red-700", "Low confidence"];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {label} · {pct}%
      {data.below_threshold && <AlertTriangle className="h-3 w-3 ml-0.5" />}
    </span>
  );
}

/** Mandatory review banner shown above SOAP note when review is required */
function MandatoryReviewBanner({ mandatory, partial }: { mandatory?: boolean; partial?: boolean }) {
  if (!mandatory && !partial) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
      <div>
        <p className="text-sm font-semibold text-red-700">Physician review required before finalising</p>
        <p className="mt-0.5 text-xs text-red-600">
          {mandatory
            ? "Model confidence is below the safety threshold. Answer all physician questions before signing off."
            : "Partial transcript analysis — large or mixed-dialect file. Verify uncertain terms manually."}
        </p>
      </div>
    </div>
  );
}

/** Copilot tool-call result card */
function ToolCallCard({ tc }: { tc: CopilotToolCallResult }) {
  const isChecklist = tc.tool === "checklist_tool";
  const pct = typeof tc.completeness_score === "number" ? Math.round(tc.completeness_score * 100) : null;
  return (
    <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        {isChecklist
          ? <ListChecks className="h-3.5 w-3.5 text-zinc-500" />
          : <ShieldAlert className="h-3.5 w-3.5 text-zinc-500" />
        }
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {isChecklist ? "Checklist" : "Red flags"}{tc.complaint_type ? ` · ${tc.complaint_type}` : ""}
        </span>
        {pct !== null && (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
            pct >= 80 ? "bg-emerald-100 text-emerald-700"
            : pct >= 50 ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-700"
          }`}>{pct}%</span>
        )}
      </div>
      {tc.missing && tc.missing.length > 0 && (
        <div className="space-y-0.5">
          {tc.missing.slice(0, 4).map((m) => (
            <p key={m} className="flex items-center gap-1.5 text-xs text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {m} missing
            </p>
          ))}
        </div>
      )}
      {tc.flags_detected && tc.flags_detected.length > 0 && (
        <div className="space-y-0.5">
          {tc.flags_detected.slice(0, 3).map((f) => (
            <p key={f} className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {f}
            </p>
          ))}
        </div>
      )}
      {tc.present && tc.present.length > 0 && (
        <p className="mt-1 text-xs text-zinc-400">
          ✓ {tc.present.slice(0, 3).join(", ")}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SajilWorkspace({ encounterId }: { encounterId: string }) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("main");
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [copilotInput, setCopilotInput] = useState("");
  const [patientRecordNumber] = useState("P023");
  const [dialectHint, setDialectHint] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<string>("");
  const router = useRouter();
  const [manualTranscript, setManualTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScribeResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "seed_assistant",
      role: "assistant",
      content: "I will surface clarifications and keep the SOAP note visible while you review.",
      createdAt: nowLabel()
    }
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [storageStatus, setStorageStatus] = useState("");
  const [lastRunId, setLastRunId] = useState<string | undefined>();
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [promptInputs, setPromptInputs] = useState<Record<string, string>>({});
  const [inputOpen, setInputOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [editedSections, setEditedSections] = useState<Record<string, string>>({});
  const [cernerSent, setCernerSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const physicianReviewRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const transcriptionText = asText(result?.transcription);
  const translationText = asText(result?.translation);
  const soapSections = useMemo(() => getSoapSections(result?.soap_note), [result]);
  const uncertainWords = useMemo(() => getUncertainWords(result), [result]);
  const prompts = useMemo(() => getPhysicianPrompts(result), [result]);
  const reviewPrompts = useMemo(() => (result && prompts.length === 0 ? getDefaultReviewPrompts() : prompts), [prompts, result]);
  const answeredPromptCount = reviewPrompts.filter((p) => promptAnswers[p.id]).length;
  const currentPrompt = reviewPrompts.find((p) => !promptAnswers[p.id]);

  useEffect(() => {
    let isMounted = true;
    async function loadChat() {
      const { data } = await listCopilotMessages(encounterId);
      if (!isMounted || !data || data.length === 0) return;
      setChatMessages(data.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      })));
    }
    loadChat();
    return () => { isMounted = false; };
  }, [encounterId]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (!audioFile) { setAudioObjectUrl(null); return; }
    const url = URL.createObjectURL(audioFile);
    setAudioObjectUrl(url);
    setAudioPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  useEffect(() => {
    if (soapSections.length === 0) return;
    const initial: Record<string, string> = {};
    soapSections.forEach((s) => { initial[s.title] = s.body; });
    setEditedSections(initial);
  }, [soapSections]);

  function getNoteText() {
    return soapSections
      .map((s) => `${s.title.toUpperCase()}\n${editedSections[s.title] ?? s.body}`)
      .join("\n\n");
  }

  function copyNote() {
    void navigator.clipboard.writeText(getNoteText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadAsPdf() {
    const w = window.open("", "_blank");
    if (!w) return;
    const sections = soapSections
      .map((s) => `<div class="section"><h2>${s.title}</h2><p>${(editedSections[s.title] ?? s.body).replace(/\n/g, "<br>")}</p></div>`)
      .join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Sajil Note — ${encounterId}</title><style>body{font-family:Georgia,serif;max-width:760px;margin:48px auto;padding:0 24px;color:#111}.meta{font-size:12px;color:#888;margin-bottom:32px}h1{font-size:20px;margin-bottom:4px}.section{margin-bottom:28px}h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:10px}p{font-size:14px;line-height:1.9;margin:0}@media print{body{margin:0}}</style></head><body><h1>Clinical Note</h1><p class="meta">Patient: ${patientRecordNumber} · Encounter: ${encounterId} · Sajil</p>${sections}</body></html>`);
    w.document.close();
    w.print();
  }

  function sendToCerner() {
    setCernerSent(true);
    setTimeout(() => setCernerSent(false), 3000);
  }

  useEffect(() => {
    if (!selectedDemo) return;
    const config = DEMO_CONFIGS.find((d) => d.key === selectedDemo);
    if (!config) return;
    setDialectHint(config.dialect);
    setInputMode("upload");
    setManualTranscript("");
    setResult(null);
    setError("");
    const url = `/demo-audio/${encodeURIComponent(config.file)}`;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], config.file, { type: "audio/mpeg" });
        setAudioFile(file);
      })
      .catch(() => setError("Could not load demo audio file."));
  }, [selectedDemo]);


  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `sajil-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
        setAudioFile(file);
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setInputMode("record");
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone permission was blocked or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function toggleAudio() {
    const el = audioRef.current;
    if (!el) return;
    if (audioPlaying) { el.pause(); setAudioPlaying(false); }
    else { void el.play(); setAudioPlaying(true); }
  }

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setAudioPlaying(false);
    setAudioCurrentTime(0);
  }

  function addChatMessage(message: Omit<ChatMessage, "id" | "createdAt">) {
    const nextMessage = {
      ...message,
      id: `${message.role}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    };
    setChatMessages((current) => [...current, nextMessage]);
    saveCopilotMessage({ encounterId, runId: lastRunId, role: message.role, content: message.content });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    setStorageStatus("");

    const demoConfig = selectedDemo ? DEMO_CONFIGS.find((d) => d.key === selectedDemo) : null;

    if (demoConfig) {
      // Demo mode: call cached API endpoint (10s server delay simulates real processing)
      try {
        const data = await fetchDemo(demoConfig.key);
        setResult(data);
        setInputOpen(false);
        setOutputOpen(false);
        setPromptAnswers({});
        setPromptInputs({});
        setStorageStatus("Demo mode — cached Pipeline B result.");
        addChatMessage({ role: "assistant", content: "Note ready." });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Demo fetch failed");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Real mode
    const sourceMode: ScribeSourceMode = inputMode === "manual" ? "manual_transcript" : "audio";
    const consultationTime = new Date().toISOString();

    try {
      const effectiveDialect = dialectHint || "gulf";
      const data = await processScribe({
        patientRecordNumber, encounterId, consultationTime, sourceMode,
        manualTranscript, audioFile, dialectHint: effectiveDialect, languageHint: "ar",
        noteFormat: "SOAP", privacyMode: "prototype"
      });

      setResult(data);
      setInputOpen(false);
      setOutputOpen(false);
      setPromptAnswers({});
      setPromptInputs({});

      const persistence = await saveScribeRun({
        patientRecordNumber, encounterId, dialectHint: effectiveDialect, consultationTime, sourceMode,
        manualTranscript, response: data
      });
      setLastRunId(persistence.runId);
      setStorageStatus(persistence.error ? `Local result ready. Supabase: ${persistence.error}` : "Saved to Supabase.");

      const promptPayload = { encounterId, patientRecordNumber, physicianQuestions: data.physician_questions, uncertainty: data.uncertainty, scribeResponse: data };
      const ghostResponse = await sendPhysicianPromptGhost(promptPayload);
      await saveGhostPromptJob({ encounterId, runId: persistence.runId, endpointUrl: ghostResponse.endpointUrl, payload: toJson(promptPayload) ?? {}, response: toJson(ghostResponse) });

      const nextPrompts = getPhysicianPrompts(data);
      addChatMessage({
        role: "assistant",
        content: nextPrompts.length > 0
          ? "I found clarifications to review. Answer them here and I will suggest note updates."
          : "The note is generated. I can help clarify risks, evidence, and follow-up questions."
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to process this consultation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePromptAnswer(prompt: PhysicianPrompt, answer: { label?: string; value?: string; text?: string }) {
    const content = answer.label ?? answer.text ?? answer.value ?? "Answered";
    setPromptAnswers((prev) => ({ ...prev, [prompt.id]: content }));
    addChatMessage({ role: "physician", content: `${prompt.question}\n${content}` });
    try {
      const response: PromptResponse = await respondToPhysicianPrompt({
        requestId: result?.request_id ?? "local_request",
        promptId: prompt.id,
        promptType: prompt.type,
        question: prompt.question,
        answer: { selected_value: answer.value, label: answer.label, text: answer.text },
        encounterId,
        conversationHistory: chatMessages
      });
      addChatMessage({
        role: "assistant",
        content: response.assistant_message || asText(response.note_update_suggestion) || "I saved that clarification for note review."
      });
    } catch (caught) {
      addChatMessage({
        role: "assistant",
        content: caught instanceof Error ? `Prompt response unavailable: ${caught.message}` : "Prompt response unavailable."
      });
    }
  }

  async function handleFollowUp(text: string) {
    addChatMessage({ role: "physician", content: text });
    try {
      const history = chatMessages
        .filter((m) => m.role === "physician" || m.role === "assistant")
        .map((m) => ({ role: m.role as "physician" | "assistant", content: m.content }));
      const res = await sendCopilotMessage({
        encounter_id: encounterId,
        patient_record_number: patientRecordNumber,
        message: text,
        conversation_history: history,
        soap_note_context: result?.soap_note ? JSON.stringify(result.soap_note) : null
      });
      const msgContent = res.assistant_message ?? res.response ?? "No response.";
      const id = `assistant_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      setChatMessages((current) => [...current, {
        id, role: "assistant", content: msgContent,
        toolCalls: res.tool_calls, suggestedFollowUps: res.suggested_follow_ups,
        createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      }]);
    } catch (err) {
      addChatMessage({ role: "assistant", content: err instanceof Error ? err.message : "Copilot unavailable." });
    }
  }

  return (
    <div className="grid h-[calc(100dvh-56px)] overflow-hidden bg-white text-[15px] text-zinc-900">
      {audioObjectUrl && (
        <audio
          ref={audioRef}
          src={audioObjectUrl}
          className="sr-only"
          onTimeUpdate={() => setAudioCurrentTime(audioRef.current?.currentTime ?? 0)}
          onDurationChange={() => setAudioDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => { setAudioPlaying(false); setAudioCurrentTime(0); }}
        />
      )}

      {/* Main content */}
      <main className="flex flex-col h-full min-w-0 bg-white overflow-hidden lg:grid lg:grid-rows-[auto_1fr_auto]">

        {/* Patient context header */}
        <section className="flex-shrink-0 border-b border-zinc-200 px-4 py-3 sm:px-6">
          <p className="text-sm font-medium text-zinc-400">{patientRecordNumber}</p>
        </section>

        {/* Inner content */}
        <section className="min-h-0 flex-1 grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px]">

          {/* Left: Transcript + SOAP */}
          <div className={`min-h-0 overflow-y-auto border-r border-zinc-200 px-4 py-6 sm:px-6 ${mobilePanel === "copilot" ? "hidden lg:block" : "block"}`}>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="border-b border-zinc-100 pb-6">

              {/* Input area */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { if (isRecording) stopRecording(); setInputMode("manual"); }}
                      className={`rounded-app px-3 py-2.5 min-h-[44px] text-sm font-medium ${inputMode === "manual" ? "bg-accent-50 text-accent-600" : "text-zinc-500 hover:bg-zinc-100"}`}>
                      Text
                    </button>
                    <button type="button" onClick={isRecording ? stopRecording : startRecording}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-app px-3 py-2.5 text-sm font-medium ${isRecording ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}>
                      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isRecording ? "Stop" : "Record"}
                    </button>
                    <label className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-app px-3 py-2.5 text-sm font-medium ${inputMode === "upload" ? "bg-accent-50 text-accent-600" : "text-zinc-500 hover:bg-zinc-100"}`}>
                      <Paperclip className="h-4 w-4" />
                      Upload
                      <input type="file"
                        accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a,audio/x-m4a,audio/aac,audio/ogg,audio/webm,audio/flac,audio/mp4,video/mp4,.mp3,.wav,.m4a,.mp4,.aac,.ogg,.webm,.flac"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file) {
                            const err = validateAudioFile(file);
                            if (err) { setError(err); e.target.value = ""; return; }
                          }
                          if (isRecording) stopRecording();
                          setAudioFile(file);
                          setInputMode("upload");
                          setError("");
                          setSelectedDemo("");
                        }} />
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedDemo}
                      onChange={(e) => {
                        setSelectedDemo(e.target.value);
                        setResult(null);
                        setStorageStatus("");
                        setError("");
                        setPromptAnswers({});
                        setPromptInputs({});
                      }}
                      aria-label="Try demo"
                      className="h-9 appearance-none rounded-app border border-zinc-200 bg-white pl-2.5 pr-7 text-sm outline-none focus:border-accent-500"
                    >
                      <option value="" disabled>Try Demo</option>
                      {DEMO_CONFIGS.map((d) => (
                        <option key={d.key} value={d.key}>{d.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>

                {inputMode === "manual" ? (
                  <textarea
                    value={manualTranscript}
                    onChange={(e) => setManualTranscript(e.target.value)}
                    dir="rtl"
                    className="arabic-text min-h-36 w-full resize-none rounded-app border border-zinc-200 bg-white p-4 text-base leading-8 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-950"
                    placeholder="اكتب نص الاستشارة هنا..."
                    required
                  />
                ) : (
                  <div className="space-y-3">
                    {isRecording ? (
                      <div className="flex min-h-28 flex-col items-center justify-center rounded-app border border-zinc-200 text-center">
                        <div className="mb-3 h-3 w-3 rounded-full bg-accent-500 recording-pulse" />
                        <p className="text-2xl font-semibold tabular-nums text-zinc-950">{formatTime(recordingSeconds)}</p>
                        <p className="mt-1 text-sm text-zinc-500">Recording — tap Stop when done</p>
                      </div>
                    ) : audioFile && audioObjectUrl ? (
                      <div className="flex items-center gap-3 rounded-app border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <button
                          type="button"
                          onClick={toggleAudio}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 text-white hover:bg-accent-600"
                        >
                          {audioPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={audioDuration || 1}
                          value={audioCurrentTime}
                          step={0.1}
                          onChange={(e) => {
                            const t = parseFloat(e.target.value);
                            setAudioCurrentTime(t);
                            if (audioRef.current) audioRef.current.currentTime = t;
                          }}
                          className="flex-1 accent-[#D20A2E]"
                        />
                        <span className="flex-shrink-0 text-xs tabular-nums text-zinc-400">
                          {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                        </span>
                        <button
                          type="button"
                          onClick={() => { stopAudio(); setAudioFile(null); setSelectedDemo(""); setInputMode("manual"); }}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 hover:text-red-500 hover:border-red-200"
                          aria-label="Remove audio"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                    {audioFile?.type === "video/mp4" && (
                      <p className="text-xs text-amber-600">MP4 files contain video — the backend will extract audio for transcription.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pipeline progress (shown during + after processing) */}
              {isSubmitting
                ? <ThinkingStream />
                : result?.pipeline && <PipelineBadge pipeline={result.pipeline} />
              }

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-sm text-zinc-500">
                  {error ? (
                    <span className="inline-flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </span>
                  ) : storageStatus ? storageStatus : "Doctor reviews before anything is saved."}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || (inputMode === "manual" && !manualTranscript.trim()) || (inputMode !== "manual" && !audioFile)}
                  className={`inline-flex h-11 items-center gap-2 rounded-app px-4 text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${isSubmitting ? "pixel-generating bg-accent-500" : "bg-accent-500 hover:bg-accent-600"}`}
                >
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Generating…" : "Generate note"}
                </button>
              </div>

            </form>

            {/* Transcript — always visible once content exists */}
            {(transcriptionText || (inputMode === "manual" && manualTranscript)) && (
              <section className="border-b border-zinc-100 py-6">
                <h3 className="mb-3 text-sm font-medium uppercase text-zinc-500">Transcript</h3>
                <div className="arabic-text text-lg leading-9 text-zinc-700">
                  <HighlightedTranscript
                    text={transcriptionText || manualTranscript}
                    words={uncertainWords}
                  />
                </div>
                {translationText && <p className="mt-4 text-sm leading-6 text-zinc-500">{translationText}</p>}
                {uncertainWords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {uncertainWords.map((w) => (
                      <span key={w.id ?? w.text} className="relative group/chip">
                        <span className={`inline-flex cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          w.risk === "critical" ? "bg-red-100 text-red-700"
                          : w.risk === "high" ? "bg-amber-100 text-amber-700"
                          : "bg-zinc-100 text-zinc-500"
                        }`}>
                          <span dir="rtl">{w.text}</span>
                          {w.risk && <RiskChip risk={w.risk} />}
                        </span>
                        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-56 rounded-lg border border-accent-200 bg-white p-3 shadow-lg opacity-0 transition-opacity duration-150 group-hover/chip:opacity-100">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className="font-bold text-zinc-950 text-sm" dir="rtl">{w.text}</span>
                            {w.risk && <RiskChip risk={w.risk} />}
                          </div>
                          {w.possible_meanings && w.possible_meanings.length > 0 && (
                            <p className="text-xs leading-5 text-zinc-600">{w.possible_meanings.join(" · ")}</p>
                          )}
                          {w.reason && <p className="mt-1 text-xs leading-5 text-zinc-400">{w.reason}</p>}
                        </div>
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Note (editable) */}
            <section className="border-b border-zinc-100 py-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold uppercase text-zinc-950">Note</h3>
                  <LogprobBadge data={result?.logprob_data} />
                </div>
                {result && soapSections.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={copyNote}
                      className="inline-flex items-center gap-1.5 rounded-app border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Clipboard className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadAsPdf}
                      className="inline-flex items-center gap-1.5 rounded-app border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={sendToCerner}
                      className={`inline-flex items-center gap-1.5 rounded-app border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        cernerSent
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950"
                      }`}
                    >
                      {cernerSent ? <Check className="h-3 w-3" /> : null}
                      {cernerSent ? "Sent to Cerner" : "Add to Cerner"}
                    </button>
                  </div>
                )}
              </div>
              {result && (
                <MandatoryReviewBanner
                  mandatory={result.mandatory_review}
                  partial={result.partial_check && !result.mandatory_review}
                />
              )}
              {soapSections.length > 0 ? (
                <div className="divide-y divide-zinc-100 border-y border-zinc-200">
                  {soapSections.map((section) => (
                    <article key={section.title} className="py-4">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {section.title.charAt(0).toUpperCase() + section.title.slice(1)}
                      </h4>
                      {section.body ? (
                        <textarea
                          value={editedSections[section.title] ?? section.body}
                          onChange={(e) => setEditedSections((prev) => ({ ...prev, [section.title]: e.target.value }))}
                          rows={Math.max(3, Math.ceil(((editedSections[section.title] ?? section.body).length) / 72))}
                          className="w-full resize-none rounded-app border border-transparent bg-transparent px-1 -ml-1 text-base leading-8 text-zinc-900 outline-none transition-colors focus:border-zinc-200 focus:bg-zinc-50 focus:px-3"
                        />
                      ) : (
                        <p className="text-base italic text-zinc-400">Not provided</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="border-y border-zinc-200 py-8 text-center text-base text-zinc-400">
                  Generate a note from the transcript.
                </p>
              )}
            </section>

          </div>

          {/* Right: Clinical Copilot */}
          <aside className={`flex flex-col min-h-0 bg-white ${mobilePanel === "copilot" ? "flex" : "hidden lg:flex"}`}>

            <header className="flex-shrink-0 border-b border-zinc-200 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium text-zinc-950">Clinical Copilot</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {result ? "Ask about this note, run tools, or check for risks" : "Generate a note first, then ask questions"} · {patientRecordNumber}
                  </p>
                </div>
                {isSubmitting ? <SignalTrace /> : <MessageCircle className="h-5 w-5 text-accent-500" />}
              </div>
            </header>

            {/* Physician Review — shown in right panel after note generation */}
            {result && (
              <div ref={physicianReviewRef} className="flex-shrink-0 border-b border-zinc-200 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase text-zinc-950">Physician Review</h3>
                  {reviewPrompts.length > 0 && answeredPromptCount < reviewPrompts.length && (
                    <span className="text-xs text-zinc-400">{answeredPromptCount}/{reviewPrompts.length} answered</span>
                  )}
                </div>

                {!currentPrompt && reviewPrompts.length > 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-800">All checkpoints resolved ✓</p>
                  </div>
                ) : currentPrompt ? (
                  <article className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      {currentPrompt.priority && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          currentPrompt.priority === "critical" ? "bg-red-100 text-red-700"
                          : currentPrompt.priority === "high" ? "bg-amber-200 text-amber-800"
                          : "bg-zinc-100 text-zinc-500"
                        }`}>{currentPrompt.priority}</span>
                      )}
                      {currentPrompt.title && (
                        <p className="text-xs font-semibold uppercase text-amber-800">{currentPrompt.title}</p>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-6 text-zinc-950">{currentPrompt.question}</p>
                    {currentPrompt.reason && (
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{currentPrompt.reason}</p>
                    )}
                    {currentPrompt.options.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {currentPrompt.options.map((option) => (
                          <button
                            key={`${currentPrompt.id}-${option.value}`}
                            type="button"
                            onClick={() => handlePromptAnswer(currentPrompt, option)}
                            className="group flex min-h-[40px] w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm font-medium text-zinc-800 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                          >
                            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 group-hover:border-accent-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-transparent group-hover:bg-accent-500" />
                            </span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <input
                        value={promptInputs[currentPrompt.id] ?? ""}
                        onChange={(e) => setPromptInputs((prev) => ({ ...prev, [currentPrompt.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const text = promptInputs[currentPrompt.id]?.trim();
                            if (text) handlePromptAnswer(currentPrompt, { text });
                          }
                        }}
                        className="min-h-[40px] min-w-0 flex-1 rounded-app border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-950"
                        placeholder="Or type a correction…"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = promptInputs[currentPrompt.id]?.trim();
                          if (text) handlePromptAnswer(currentPrompt, { text });
                        }}
                        disabled={!promptInputs[currentPrompt.id]?.trim()}
                        className="min-h-[40px] rounded-app bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  </article>
                ) : null}

                {answeredPromptCount > 0 && (
                  <div className="space-y-1.5">
                    {reviewPrompts.filter((p) => promptAnswers[p.id]).map((p) => (
                      <div key={p.id} className="border-l-2 border-emerald-400 pl-3">
                        <p className="text-[10px] font-medium uppercase text-zinc-400">Answered</p>
                        <p className="text-xs text-zinc-700">{promptAnswers[p.id]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat messages */}
            <div ref={chatScrollRef} className="messages-scroller flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-4 space-y-4">
              {chatMessages.map((message) => {
                const isPhysician = message.role === "physician";
                const isAssistant = message.role === "assistant";
                return (
                  <article key={message.id} className={isPhysician ? "flex flex-col items-end" : "flex flex-col items-start"}>
                    <p className="mb-1 text-xs font-medium text-zinc-400">
                      {isPhysician ? "You" : "Copilot"} · {message.createdAt}
                    </p>
                    <div className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-6 ${
                      isPhysician
                        ? "bg-accent-500 text-white"
                        : "border border-zinc-200 bg-white text-zinc-800 shadow-sm"
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-2 w-full space-y-2">
                        {message.toolCalls.map((tc, i) => (
                          <ToolCallCard key={`${tc.tool}_${i}`} tc={tc} />
                        ))}
                      </div>
                    )}
                    {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.suggestedFollowUps.slice(0, 3).map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => handleFollowUp(q)}
                            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-accent-500 hover:text-accent-600"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

          {/* Tool quick-access */}
          <div className="flex-shrink-0 border-t border-zinc-100 px-4 py-3">
            <div className="flex gap-1.5 flex-wrap">
              {toolItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleFollowUp(item.query)}
                    className="inline-flex items-center gap-1.5 rounded-app border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-accent-500 hover:text-accent-600"
                    title={item.label}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copilot chat input */}
          <div className="flex-shrink-0 border-t border-zinc-200 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = copilotInput.trim();
                if (!text) return;
                setCopilotInput("");
                handleFollowUp(text);
              }}
              className="flex gap-2"
            >
              <input
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask about this note…"
                className="min-h-[44px] min-w-0 flex-1 rounded-app border border-zinc-200 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-accent-500"
              />
              <button
                type="submit"
                disabled={!copilotInput.trim()}
                className="min-h-[44px] rounded-app bg-accent-500 px-4 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>

        </aside>
        </section>

        {/* Mobile bottom nav */}
        <nav className="flex-shrink-0 flex items-stretch justify-around border-t border-zinc-200 bg-white lg:hidden">
          <button type="button" onClick={() => setMobilePanel("main")}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs font-medium ${mobilePanel === "main" ? "text-accent-600" : "text-zinc-500"}`}>
            <ClipboardList className="h-5 w-5" />
            Note
          </button>
          <button type="button" onClick={() => setMobilePanel("copilot")}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs font-medium ${mobilePanel === "copilot" ? "text-accent-600" : "text-zinc-500"}`}>
            <MessageCircle className="h-5 w-5" />
            Copilot
          </button>
        </nav>

      </main>
    </div>
  );
}
