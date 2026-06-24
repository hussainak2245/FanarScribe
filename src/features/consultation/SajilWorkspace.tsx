"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  ListChecks,
  LoaderCircle,
  MessageCircle,
  Mic,
  Paperclip,
  ScrollText,
  Settings,
  ShieldAlert,
  Square,
  Users,
  Wrench,
  Zap
} from "lucide-react";
import {
  processScribe,
  respondToPhysicianPrompt,
  type PromptResponse,
  type ScribeResponse,
  type ScribeSourceMode
} from "@/lib/api/scribe";
import { sendPhysicianPromptGhost } from "@/lib/api/physician-prompts";
import { createEncounter } from "@/lib/api/encounters";
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
type RailTab = "scribes" | "patients" | "copilot" | "settings";
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

const STEP_DELAYS_MS = [0, 5000, 12000, 20000];

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mp3", "audio/mpeg", "audio/wav", "audio/x-wav",
  "audio/m4a", "audio/x-m4a", "audio/mp4", "video/mp4",
  "audio/aac", "audio/ogg", "audio/webm", "audio/flac"
]);
const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "aac", "ogg", "webm", "flac"];

const toolItems = [
  { label: "Transcript", icon: ScrollText },
  { label: "Note", icon: FileText },
  { label: "Uncertainty", icon: CircleHelp },
  { label: "Evidence", icon: BookOpen },
  { label: "Tools", icon: Wrench },
  { label: "Settings", icon: Settings }
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
          <span key={i} className="rounded-app px-1 cursor-help" style={UNCERTAIN_HIGHLIGHT} title={title}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

/** 4-step pipeline progress shown during submission */
function PipelineProgress({ steps }: { steps: PipelineAnimStep[] }) {
  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-accent-500" />
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Fanar agentic pipeline
        </p>
      </div>
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.name} className="flex items-center gap-3">
            <div className="w-4 flex-shrink-0">
              {step.status === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : step.status === "running" ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-accent-500" />
              ) : step.status === "failed" ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-zinc-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm ${
                  step.status === "done" ? "text-zinc-700"
                  : step.status === "running" ? "font-medium text-zinc-950"
                  : "text-zinc-400"
                }`}>{step.label}</span>
                {step.status === "done" && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {step.fallback ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Groq fallback
                      </span>
                    ) : step.provider ? (
                      <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-600">
                        {step.provider}
                      </span>
                    ) : null}
                    {step.duration_ms && (
                      <span className="text-[10px] text-zinc-400">{(step.duration_ms / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                )}
                {step.status === "running" && (
                  <span className="text-xs text-accent-500 animate-pulse">processing…</span>
                )}
              </div>
              {step.status !== "pending" && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      step.status === "done" ? "w-full bg-emerald-400"
                      : step.status === "running" ? "pipeline-bar-running bg-accent-400"
                      : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
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
  const [activeTab, setActiveTab] = useState<RailTab>("scribes");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("main");
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [patientRecordNumber] = useState("P023");
  const [dialectHint] = useState("gulf");
  const [noteFormat, setNoteFormat] = useState("SOAP");
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
  const [recordingLabel, setRecordingLabel] = useState("");
  const [storageStatus, setStorageStatus] = useState("");
  const [lastRunId, setLastRunId] = useState<string | undefined>();
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [promptInputs, setPromptInputs] = useState<Record<string, string>>({});
  const [pipelineSteps, setPipelineSteps] = useState<PipelineAnimStep[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pipelineTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const physicianReviewRef = useRef<HTMLElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  function startPipelineAnimation() {
    const initial = PIPELINE_STEP_DEFS.map((d) => ({ ...d, status: "pending" as const }));
    setPipelineSteps(initial);
    pipelineTimersRef.current.forEach(clearTimeout);
    pipelineTimersRef.current = [];

    STEP_DELAYS_MS.forEach((delay, i) => {
      const t = setTimeout(() => {
        setPipelineSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s))
        );
      }, delay);
      pipelineTimersRef.current.push(t);
    });
  }

  function finishPipelineAnimation(response: ScribeResponse) {
    pipelineTimersRef.current.forEach(clearTimeout);
    const apiSteps = getArray((response.pipeline as Record<string, unknown> | undefined)?.steps) as Record<string, unknown>[];
    setPipelineSteps(
      PIPELINE_STEP_DEFS.map((def) => {
        const apiStep = apiSteps.find((s) => asText(s.step) === def.name);
        if (apiStep) {
          return {
            ...def,
            status: asText(apiStep.status) === "failed" ? "failed" : "done",
            provider: asText(apiStep.provider),
            duration_ms: typeof apiStep.duration_ms === "number" ? apiStep.duration_ms : undefined,
            fallback: Boolean(apiStep.fallback)
          };
        }
        return { ...def, status: "done" };
      })
    );
  }

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
        setRecordingLabel("Recording ready");
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setInputMode("record");
      setIsRecording(true);
      setRecordingLabel("Listening");
    } catch {
      setError("Microphone permission was blocked or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
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
    setPipelineSteps([]);
    startPipelineAnimation();

    const sourceMode: ScribeSourceMode = inputMode === "manual" ? "manual_transcript" : "audio";
    const consultationTime = new Date().toISOString();

    try {
      const data = await processScribe({
        patientRecordNumber, encounterId, consultationTime, sourceMode,
        manualTranscript, audioFile, dialectHint, languageHint: "ar",
        noteFormat, privacyMode: "prototype"
      });

      setResult(data);
      finishPipelineAnimation(data);
      setPromptAnswers({});
      setPromptInputs({});

      const persistence = await saveScribeRun({
        patientRecordNumber, encounterId, dialectHint, consultationTime, sourceMode,
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
      setPipelineSteps((prev) => prev.map((s) => s.status === "running" ? { ...s, status: "failed" } : s));
      setError(caught instanceof Error ? caught.message : "Unable to process this consultation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePromptAnswer(prompt: PhysicianPrompt, answer: { label?: string; value?: string; text?: string }) {
    const content = answer.label ?? answer.text ?? answer.value ?? "Answered";
    setPromptAnswers((prev) => ({ ...prev, [prompt.id]: content }));
    addChatMessage({ role: "physician", content: `${prompt.question}\n${content}` });
    requestAnimationFrame(() => {
      physicianReviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
        soap_note_context: result?.soap_note ?? null
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

  const railItems: Array<{ key: RailTab; label: string; icon: typeof FileText }> = [
    { key: "scribes", label: "Notes", icon: FileText },
    { key: "patients", label: "Patients", icon: Users },
    { key: "copilot", label: "Clinical Copilot", icon: MessageCircle },
    { key: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <div className="grid h-[calc(100dvh-56px)] overflow-hidden bg-white text-[15px] text-zinc-900 grid-cols-1 lg:grid-cols-[68px_1fr]">

      {/* Icon rail */}
      <aside className="hidden lg:flex border-r border-zinc-200 bg-white">
        <nav className="flex w-full flex-col items-center gap-3 px-2 py-5" aria-label="Primary">
          {railItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`rounded-app p-3 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  activeTab === item.key ? "bg-accent-50 text-accent-600" : "text-zinc-500 hover:bg-zinc-100"
                } ${index === railItems.length - 1 ? "mt-auto" : ""}`}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex flex-col h-full min-w-0 bg-white overflow-hidden lg:grid lg:grid-rows-[auto_1fr_auto]">

        {/* Patient context header */}
        <section className="flex-shrink-0 border-b border-zinc-200 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-zinc-400">Patient Context</p>
              <h2 className="mt-1 text-xl font-medium text-zinc-950 truncate">{patientRecordNumber} / {encounterId}</h2>
            </div>
            <select value={noteFormat} onChange={(e) => setNoteFormat(e.target.value)} aria-label="Note format"
              className="h-11 rounded-app border border-zinc-200 bg-white px-3 outline-none focus:border-accent-500">
              <option value="SOAP">SOAP</option>
              <option value="focused_soap">Focused SOAP</option>
              <option value="arabic_english_hybrid">Arabic-English</option>
            </select>
          </div>
        </section>

        {/* Inner content */}
        <section className="min-h-0 flex-1 grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px]">

          {/* Left: Transcript + SOAP */}
          <div className={`min-h-0 overflow-y-auto border-r border-zinc-200 px-4 py-6 sm:px-6 ${mobilePanel === "copilot" ? "hidden lg:block" : "block"}`}>

            {/* Transcript form */}
            <form onSubmit={handleSubmit} className="border-b border-zinc-100 pb-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-medium uppercase text-zinc-500">Transcript</h3>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setInputMode("manual")}
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
                        setAudioFile(file);
                        setInputMode("upload");
                        setRecordingLabel("");
                        setError("");
                      }} />
                  </label>
                </div>
              </div>

              {inputMode === "manual" ? (
                <div>
                  <textarea
                    value={manualTranscript}
                    onChange={(e) => setManualTranscript(e.target.value)}
                    dir="rtl"
                    className="arabic-text min-h-36 w-full resize-none rounded-app border border-zinc-200 bg-white p-4 text-base leading-8 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-950"
                    placeholder="اكتب نص الاستشارة هنا..."
                    required
                  />
                  {!manualTranscript && !result && (
                    <p className="mt-2 text-center text-sm text-zinc-400 py-2">
                      Type or paste the consultation transcript above, or switch to Record / Upload.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex min-h-32 flex-col items-center justify-center rounded-app border border-zinc-200 text-center text-[15px] text-zinc-500">
                  <div className={`mb-3 h-3 w-3 rounded-full transition-colors ${isRecording ? "bg-accent-500 recording-pulse" : "bg-zinc-300"}`} />
                  <p className="font-medium text-zinc-950">
                    {isRecording ? "Recording in progress" : audioFile ? "Audio ready" : "Record or upload audio"}
                  </p>
                  <p className="mt-1">{recordingLabel || "Generate when the consultation audio is ready."}</p>
                  {audioFile?.type === "video/mp4" && (
                    <p className="mt-3 max-w-xs text-xs text-amber-600">MP4 files contain video — the backend will extract audio for transcription.</p>
                  )}
                </div>
              )}

              {/* Pipeline progress (shown during + after processing) */}
              {pipelineSteps.length > 0 && (
                isSubmitting
                  ? <PipelineProgress steps={pipelineSteps} />
                  : result?.pipeline && <PipelineBadge pipeline={result.pipeline} />
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-sm text-zinc-500">
                  {error ? (
                    <span className="inline-flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </span>
                  ) : storageStatus ? storageStatus : audioFile ? "Audio ready for note generation." : "Doctor reviews before anything is saved."}
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

              {/* Output transcript with risk highlights */}
              {result && (
                <div className="mt-5 border-t border-zinc-100 pt-5">
                  <p className="text-sm font-medium text-zinc-950">Output transcript</p>
                  <div className="arabic-text mt-3 text-lg leading-9 text-zinc-700">
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
                          {/* Hover card */}
                          <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-56 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg opacity-0 transition-opacity duration-150 group-hover/chip:opacity-100">
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
                </div>
              )}
            </form>

            {/* SOAP note */}
            <section className="border-b border-zinc-100 py-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase text-zinc-950">SOAP Note</h3>
                {result && soapSections.length > 0 && (
                  <span className="border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700">
                    {(result.soap_note as Record<string, unknown> | undefined)?.overall_quality_level as string ?? "Needs review"}
                  </span>
                )}
              </div>
              {soapSections.length > 0 ? (
                <div className="divide-y divide-zinc-100 border-y border-zinc-950 bg-white">
                  {soapSections.map((section) => (
                    <article key={section.title} className="py-5">
                      <h4 className="text-xs font-semibold uppercase text-zinc-950">
                        {section.title.charAt(0).toUpperCase() + section.title.slice(1)}
                      </h4>
                      {section.body ? (
                        <p className="mt-2 text-base leading-8 text-zinc-900">
                          <HighlightedTranscript text={section.body} words={uncertainWords} />
                        </p>
                      ) : (
                        <p className="mt-2 text-base italic text-zinc-400">Not provided</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="border-y border-zinc-200 py-8 text-center text-base text-zinc-400">
                  Generate a SOAP note from the transcript.
                </p>
              )}
              {result && soapSections.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Link
                    href={routes.finalReview(encounterId)}
                    className="inline-flex h-11 items-center gap-2 rounded-app bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-accent-600"
                  >
                    Open Final Review
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
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
                    {result ? "Draft ready for physician review" : "Waiting for note generation"} · {patientRecordNumber}
                  </p>
                </div>
                {isSubmitting ? <SignalTrace /> : <MessageCircle className="h-5 w-5 text-accent-500" />}
              </div>
            </header>

            {/* Single scrollable body — physician review + messages */}
            <div ref={chatScrollRef} className="messages-scroller flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-4 space-y-6">

                {/* Physician prompts */}
                <section ref={physicianReviewRef}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase text-zinc-400">Physician review</p>
                    {reviewPrompts.length > 0 && (
                      <span className="text-xs text-zinc-500">{answeredPromptCount} of {reviewPrompts.length}</span>
                    )}
                  </div>

                  {currentPrompt ? (
                    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                      {currentPrompt.priority && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase mb-2 ${
                          currentPrompt.priority === "critical" ? "bg-red-100 text-red-700"
                          : currentPrompt.priority === "high" ? "bg-amber-100 text-amber-700"
                          : "bg-zinc-100 text-zinc-500"
                        }`}>{currentPrompt.priority}</span>
                      )}
                      {currentPrompt.title && (
                        <p className="text-xs font-semibold uppercase text-accent-600 mb-1">{currentPrompt.title}</p>
                      )}
                      <p className="text-[15px] font-medium leading-7 text-zinc-950">
                        {currentPrompt.question}
                      </p>
                      {currentPrompt.reason && (
                        <p className="mt-2 text-sm leading-6 text-zinc-500">{currentPrompt.reason}</p>
                      )}

                      {/* Multiple choice options */}
                      {currentPrompt.options.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {currentPrompt.options.map((option) => (
                            <button
                              key={`${currentPrompt.id}-${option.value}`}
                              type="button"
                              onClick={() => handlePromptAnswer(currentPrompt, option)}
                              className="group flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-left text-sm font-medium text-zinc-800 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                            >
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 group-hover:border-accent-500">
                                <span className="h-2 w-2 rounded-full bg-transparent group-hover:bg-accent-500" />
                              </span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Free text input */}
                      <div className="mt-3 flex gap-2">
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
                          className="min-h-[44px] min-w-0 flex-1 rounded-app border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                          placeholder="Or type a correction…"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const text = promptInputs[currentPrompt.id]?.trim();
                            if (text) handlePromptAnswer(currentPrompt, { text });
                          }}
                          disabled={!promptInputs[currentPrompt.id]?.trim()}
                          className="min-h-[44px] rounded-app bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-40"
                        >
                          Save
                        </button>
                      </div>
                    </article>
                  ) : result && reviewPrompts.length > 0 ? (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <p className="text-sm leading-6 text-emerald-800">
                        Review questions answered. Ready for final physician review.
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-zinc-200 p-4 text-sm leading-6 text-zinc-500">
                      Review questions will appear after note generation.
                    </p>
                  )}

                  {answeredPromptCount > 0 && (
                    <div className="mt-4 space-y-2">
                      {reviewPrompts.filter((p) => promptAnswers[p.id]).map((p) => (
                        <div key={p.id} className="border-l-2 border-emerald-500 pl-3">
                          <p className="text-xs font-medium uppercase text-zinc-400">Answered</p>
                          <p className="mt-1 text-sm text-zinc-700">{promptAnswers[p.id]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Messages */}
                <section className="border-t border-zinc-100 pt-5">
                  <p className="mb-3 text-xs font-medium uppercase text-zinc-400">Messages</p>
                  <div className="space-y-4">
                  {chatMessages.map((message) => (
                <article key={message.id} className={message.role === "physician" ? "text-right" : ""}>
                  <p className="text-xs font-medium uppercase text-zinc-400">
                    {message.role} · {message.createdAt}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{message.content}</p>
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-2 text-left">
                      {message.toolCalls.map((tc, i) => (
                        <ToolCallCard key={`${tc.tool}_${i}`} tc={tc} />
                      ))}
                    </div>
                  )}
                  {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 text-left">
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
              ))}
            </div>
          </section>
            </div>

          {/* Tool quick-access bar */}
          <div className="flex-shrink-0 border-t border-zinc-100 px-5 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {toolItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => addChatMessage({ role: "tool", content: `${item.label} support is available for this consultation review.` })}
                    className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-app text-zinc-500 hover:bg-zinc-100 hover:text-accent-600"
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
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
