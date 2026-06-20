"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Activity,
  BookOpen,
  Brain,
  Check,
  CircleHelp,
  ClipboardList,
  FileText,
  LoaderCircle,
  MessageCircle,
  Mic,
  Paperclip,
  Plus,
  ScrollText,
  Send,
  Settings,
  Square,
  Users,
  Wrench
} from "lucide-react";
import {
  processScribe,
  respondToPhysicianPrompt,
  runNoteAction,
  type PromptResponse,
  type ScribeResponse,
  type ScribeSourceMode
} from "@/lib/api/scribe";
import { sendPhysicianPromptGhost } from "@/lib/api/physician-prompts";
import {
  listCopilotMessages,
  listEncounters,
  saveCopilotMessage,
  saveGhostPromptJob,
  saveNoteAction,
  saveScribeRun
} from "@/lib/supabase/sajil";
import { toJson } from "@/lib/supabase/types";

type InputMode = "manual" | "record" | "upload";
type RailTab = "scribes" | "patients" | "copilot" | "settings";
type MobilePanel = "list" | "main" | "copilot";
type ChatRole = "assistant" | "physician" | "system" | "tool";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
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
  question: string;
  reason?: string;
  options: Array<{ label: string; value: string }>;
};

type NoteAction = {
  id: string;
  label: string;
  description?: string;
};

const initialScribes: WorkspaceScribe[] = [
  {
    id: "E001",
    time: "Today, 10:02 AM",
    patient: "P023",
    summary: "Shortness of breath since yesterday, sleep affected.",
    status: "Draft"
  },
  {
    id: "E002",
    time: "Today, 9:18 AM",
    patient: "P041",
    summary: "Follow-up for blood pressure and medication review.",
    status: "Ready"
  },
  {
    id: "E003",
    time: "Yesterday, 4:40 PM",
    patient: "P052",
    summary: "Right ankle sprain, pain control and imaging plan.",
    status: "Draft"
  }
];

// Task 7: Supported audio formats for upload validation
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "video/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
  "audio/flac"
]);
const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
const SUPPORTED_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "aac", "ogg", "webm", "flac"];

function validateAudioFile(file: File): string | null {
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    return `File too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is 200 MB.`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_AUDIO_TYPES.has(file.type) && !SUPPORTED_EXTENSIONS.includes(ext)) {
    return `Unsupported format. Supported: ${SUPPORTED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`;
  }
  return null;
}

const toolItems = [
  { label: "Transcript", icon: ScrollText },
  { label: "Note", icon: FileText },
  { label: "Uncertainty", icon: CircleHelp },
  { label: "Evidence", icon: BookOpen },
  { label: "Tools", icon: Wrench },
  { label: "Settings", icon: Settings }
];

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("\n");

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = [
      "cleaned_text",
      "raw_text",
      "clinical_translation",
      "chief_complaint",
      "summary",
      "assistant_message",
      "text",
      "content",
      "note",
      "value"
    ];

    for (const key of preferred) {
      if (typeof record[key] === "string") return record[key] as string;
    }

    return Object.entries(record)
      .map(([key, entry]) => {
        const text = asText(entry);
        return text ? `${key.replaceAll("_", " ")}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
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

// Task 6: Always emit all 4 SOAP sections; empty body means "Not provided" in render
function getSoapSections(value: unknown): Array<{ title: string; body: string }> {
  if (!value) return [];
  if (typeof value === "string") return [{ title: "SOAP", body: value }];
  if (typeof value !== "object") return [{ title: "SOAP", body: asText(value) }];

  const record = value as Record<string, unknown>;
  const source =
    record.sections && typeof record.sections === "object" ? (record.sections as Record<string, unknown>) : record;

  const order = ["subjective", "objective", "assessment", "plan"];
  const sections = order.map((key) => ({ title: key, body: asText(source[key]) }));

  const hasContent = sections.some((s) => s.body);
  return hasContent ? sections : [{ title: "SOAP", body: asText(value) }];
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
        type: asText(record.type) || "short_answer",
        question: asText(record.question ?? record.prompt ?? record.text),
        reason: asText(record.reason),
        options: getArray(record.options).map((option, optionIndex) => {
          if (typeof option === "string") return { label: option, value: option };
          const optionRecord = option as Record<string, unknown>;
          return {
            label: asText(optionRecord.label) || `Option ${optionIndex + 1}`,
            value: asText(optionRecord.value) || asText(optionRecord.label) || `option_${optionIndex + 1}`
          };
        })
      };
      if (prompt.question) {
        prompts.push(prompt);
      }
      return prompts;
    }, [])
    .slice(0, 4);
}

function getDefaultReviewPrompts(): PhysicianPrompt[] {
  return [
    {
      id: "review_scope",
      type: "single_choice",
      question:
        'Could you clarify what the patient meant by "creating something beautiful and user-friendly"? Is this related to the current health concern?',
      options: [
        { label: "Not related to health concern", value: "not_related" },
        { label: "Patient meant something else", value: "different_meaning" },
        { label: "Add correction manually", value: "manual_correction" }
      ]
    },
    {
      id: "review_allergy",
      type: "single_choice",
      question: "Was allergy status discussed?",
      options: [
        { label: "No known allergies", value: "no_known_allergies" },
        { label: "Allergies present", value: "allergies_present" },
        { label: "Not discussed", value: "not_discussed" }
      ]
    },
    {
      id: "review_next_step",
      type: "single_choice",
      question: "How should this draft note move forward?",
      options: [
        { label: "Keep as draft", value: "keep_draft" },
        { label: "Needs physician edits", value: "needs_edits" },
        { label: "Ready for final review", value: "ready_final_review" }
      ]
    }
  ];
}

function getNoteActions(response: ScribeResponse | null): NoteAction[] {
  const actions = getArray(response?.note_actions)
    .map((item, index) => {
      if (typeof item === "string") return { id: item, label: item };
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        id: asText(record.id ?? record.action_id ?? record.key) || `action_${index}`,
        label: asText(record.label ?? record.title ?? record.name) || `Action ${index + 1}`,
        description: asText(record.description ?? record.reason)
      };
    })
    .filter((item): item is NoteAction => Boolean(item?.label))
    .slice(0, 3);

  if (actions.length > 0) return actions;
  return [
    { id: "illness_prediction", label: "Illness prediction", description: "Recommended" },
    { id: "risk_triage", label: "Risk triage", description: "Recommended" }
  ];
}

function getUncertainTerms(value: unknown): string[] {
  return getArray(value)
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return asText(record.text ?? record.word ?? record.phrase ?? record.span);
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 6);
}

function highlightTerms(text: string, terms: string[]) {
  if (!text || terms.length === 0) return text;

  const escaped = terms
    .filter((term) => term.length > 1)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) return text;

  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(pattern).map((part, index) => {
    const isMatch = terms.some((term) => term.toLowerCase() === part.toLowerCase());
    return isMatch ? (
      <span key={`${part}-${index}`} className="rounded-app bg-amber-100 px-1 text-zinc-950">
        {part}
      </span>
    ) : (
      part
    );
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      key={status}
      className={`rounded-app px-2 py-0.5 text-xs font-medium pixel-pop ${
        status === "Ready"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {status}
    </span>
  );
}

function SignalTrace() {
  return (
    <span className="signal-trace" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function nowLabel() {
  return new Date().toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function SajilWorkspace({ encounterId }: { encounterId: string }) {
  const [activeTab, setActiveTab] = useState<RailTab>("scribes");
  // Task 4: mobile panel state for single-column navigation
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("main");
  const [workspaceScribes, setWorkspaceScribes] = useState(initialScribes);
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [patientRecordNumber, setPatientRecordNumber] = useState("P023");
  const [dialectHint, setDialectHint] = useState("gulf");
  // Task 1: empty initial transcript — no placeholder text
  const [manualTranscript, setManualTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScribeResponse | null>(null);
  const [chatInput, setChatInput] = useState("");
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
  const [actionNotice, setActionNotice] = useState("");
  const [lastRunId, setLastRunId] = useState<string | undefined>();
  // Task 5: track which prompts have been answered and pending text inputs
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [promptInputs, setPromptInputs] = useState<Record<string, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcriptionText = asText(result?.transcription);
  const translationText = asText(result?.translation);
  const soapSections = useMemo(() => getSoapSections(result?.soap_note), [result]);
  const prompts = useMemo(() => getPhysicianPrompts(result), [result]);
  const reviewPrompts = useMemo(() => (result && prompts.length === 0 ? getDefaultReviewPrompts() : prompts), [prompts, result]);
  const noteActions = useMemo(() => getNoteActions(result), [result]);
  const uncertainTerms = useMemo(() => getUncertainTerms(result?.uncertain_words), [result]);
  const activeScribe = workspaceScribes.find((scribe) => scribe.id === encounterId) ?? workspaceScribes[0];
  const answeredPromptCount = reviewPrompts.filter((prompt) => promptAnswers[prompt.id]).length;
  const currentPrompt = reviewPrompts.find((prompt) => !promptAnswers[prompt.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadEncounters() {
      const { data } = await listEncounters();
      if (!isMounted || !data || data.length === 0) return;
      setWorkspaceScribes(
        data.map((encounter) => ({
          id: encounter.id,
          time: new Date(encounter.consultation_time).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
          }),
          patient: encounter.patient_record_number,
          summary: encounter.summary ?? "Saved consultation",
          status: encounter.status === "review" ? "Ready" : "Draft"
        }))
      );
    }

    async function loadChat() {
      const { data } = await listCopilotMessages(encounterId);
      if (!isMounted || !data || data.length === 0) return;
      setChatMessages(
        data.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        }))
      );
    }

    loadEncounters();
    loadChat();

    return () => {
      isMounted = false;
    };
  }, [encounterId]);

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

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `sajil-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
        setAudioFile(file);
        setRecordingLabel("Recording ready");
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
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
    saveCopilotMessage({
      encounterId,
      runId: lastRunId,
      role: message.role,
      content: message.content
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    setStorageStatus("");
    setActionNotice("");

    const sourceMode: ScribeSourceMode = inputMode === "manual" ? "manual_transcript" : "audio";
    const consultationTime = new Date().toISOString();

    try {
      const data = await processScribe({
        patientRecordNumber,
        encounterId,
        consultationTime,
        sourceMode,
        manualTranscript,
        audioFile,
        dialectHint,
        languageHint: "ar",
        noteFormat: "SOAP",
        privacyMode: "prototype"
      });
      setResult(data);
      // Reset prompt state when a new result comes in
      setPromptAnswers({});
      setPromptInputs({});

      const persistence = await saveScribeRun({
        patientRecordNumber,
        encounterId,
        dialectHint,
        consultationTime,
        sourceMode,
        manualTranscript,
        response: data
      });
      setLastRunId(persistence.runId);
      setStorageStatus(persistence.error ? `Local result ready. Supabase: ${persistence.error}` : "Saved to Supabase.");

      const summaryText = manualTranscript || asText(data.transcription) || "Audio consultation processed.";
      setWorkspaceScribes((current) => [
        {
          id: encounterId,
          time: nowLabel(),
          patient: patientRecordNumber,
          summary: summaryText.slice(0, 160),
          status: "Ready"
        },
        ...current.filter((scribe) => scribe.id !== encounterId)
      ]);

      const promptPayload = {
        encounterId,
        patientRecordNumber,
        physicianQuestions: data.physician_questions,
        uncertainty: data.uncertainty,
        scribeResponse: data
      };
      const ghostResponse = await sendPhysicianPromptGhost(promptPayload);
      await saveGhostPromptJob({
        encounterId,
        runId: persistence.runId,
        endpointUrl: ghostResponse.endpointUrl,
        payload: toJson(promptPayload) ?? {},
        response: toJson(ghostResponse)
      });

      const nextPrompts = getPhysicianPrompts(data);
      addChatMessage({
        role: "assistant",
        content:
          nextPrompts.length > 0
            ? "I found clarifications to review. Answer them here and I will suggest note updates."
            : "The note is generated. I can help clarify risks, evidence, and follow-up questions."
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to process this consultation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Task 5: track answered state, then delegate to API
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
        answer: {
          selected_value: answer.value,
          label: answer.label,
          text: answer.text
        },
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

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    addChatMessage({ role: "physician", content: text });
    addChatMessage({
      role: "assistant",
      content: "Clinical Copilot tool execution is in skeleton mode. I captured this message for the consultation history."
    });
  }

  async function handleNoteAction(action: NoteAction) {
    setActionNotice(`${action.label}: under development.`);
    await saveNoteAction({
      encounterId,
      runId: lastRunId,
      actionKey: action.id,
      label: action.label
    });

    try {
      const response = await runNoteAction(action.id);
      addChatMessage({
        role: "tool",
        content: `${action.label}: ${response.status ?? "under_development"}`
      });
    } catch {
      addChatMessage({
        role: "tool",
        content: `${action.label}: under development`
      });
    }
  }

  const railItems: Array<{ key: RailTab; label: string; icon: typeof FileText }> = [
    { key: "scribes", label: "Notes", icon: FileText },
    { key: "patients", label: "Patients", icon: Users },
    { key: "copilot", label: "Clinical Copilot", icon: MessageCircle },
    { key: "settings", label: "Settings", icon: Settings }
  ];

  function renderSidePanel() {
    if (activeTab === "patients") {
      return (
        <div className="divide-y divide-zinc-100">
          {workspaceScribes.map((scribe) => (
            <button key={scribe.patient} type="button" className="block w-full px-5 py-5 text-left hover:bg-zinc-50 min-h-[60px]">
              <p className="text-[15px] font-medium text-zinc-950">{scribe.patient}</p>
              <p className="mt-1 text-[15px] leading-6 text-zinc-600">{scribe.summary}</p>
              <p className="mt-2 text-xs text-zinc-400">Pre-consultation report ready</p>
            </button>
          ))}
        </div>
      );
    }

    if (activeTab === "copilot") {
      return (
        <div className="space-y-5 px-5 py-5 text-[15px]">
          <div>
            <p className="font-medium text-zinc-950">Available tools</p>
            <p className="mt-1 leading-6 text-zinc-500">Evidence, uncertainty, tools, and follow-up support.</p>
          </div>
        </div>
      );
    }

    if (activeTab === "settings") {
      return (
        <div className="space-y-5 px-5 py-5 text-[15px]">
          <div>
            <p className="font-medium text-zinc-950">Database</p>
            <p className="mt-1 leading-6 text-zinc-500">Supabase stores encounters, runs, prompts, actions, and copilot messages.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-950">Current encounter</p>
            <p className="mt-1 text-zinc-500">{activeScribe.patient} / {encounterId}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="divide-y divide-zinc-100">
        {workspaceScribes.map((scribe) => (
          <button
            key={scribe.id}
            type="button"
            className={`block w-full px-5 py-5 text-left hover:bg-zinc-50 min-h-[60px] ${
              scribe.id === encounterId ? "border-l-2 border-accent-500 bg-zinc-50" : "border-l-2 border-transparent"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium text-zinc-950">{scribe.time}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{scribe.patient}</p>
              </div>
              <StatusBadge status={scribe.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-zinc-600">{scribe.summary}</p>
          </button>
        ))}
      </div>
    );
  }

  // Task 4: scribe list aside is shown when mobilePanel === "list" on mobile, always on lg
  const scribeListVisible = mobilePanel === "list";

  return (
    // Task 2 & 4: responsive grid — 1 col on mobile, 2 col on md, 3 col on lg
    <div
      className="grid min-h-dvh bg-white text-[15px] text-zinc-900 grid-cols-1 lg:grid-cols-[68px_320px_1fr]"
    >
      {/* Icon rail — hidden on mobile (bottom nav replaces it), visible lg+ */}
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

      {/* Scribe list — hidden on mobile unless mobilePanel === "list" */}
      <aside
        className={`border-r border-zinc-200 bg-white ${scribeListVisible ? "block" : "hidden"} lg:block`}
      >
        <div className="border-b border-zinc-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="sajil-wordmark text-3xl text-zinc-950">SAJIL</h1>
            <button
              type="button"
              onClick={() => {
                setManualTranscript("");
                setResult(null);
                setActionNotice("");
                setStorageStatus("");
                setPromptAnswers({});
                setPromptInputs({});
                setChatMessages([
                  {
                    id: "seed_assistant",
                    role: "assistant",
                    content: "Ready for a new consultation.",
                    createdAt: nowLabel()
                  }
                ]);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-app border border-zinc-200 text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
              aria-label="New note"
              title="New note"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <label className="mt-5 flex h-11 items-center gap-2 rounded-app border border-zinc-200 bg-white px-3 text-[15px] text-zinc-500 focus-within:border-accent-500">
            <FileText className="h-4 w-4" />
            <input className="w-full bg-transparent outline-none" placeholder="Search notes" />
          </label>
        </div>
        {renderSidePanel()}
      </aside>

      {/* Main content — hidden on mobile when showing the scribe list */}
      <main
        className={`flex flex-col min-h-dvh min-w-0 bg-white lg:grid lg:grid-rows-[auto_1fr_auto] ${
          scribeListVisible ? "hidden lg:grid" : "flex"
        }`}
      >
        {/* Task 4: Mobile-only top bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <h1 className="sajil-wordmark text-xl text-zinc-950">SAJIL</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500">{patientRecordNumber}</p>
          </div>
        </div>

        {/* Patient context header */}
        <section className="flex-shrink-0 border-b border-zinc-200 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-zinc-400">Patient Context</p>
              <h2 className="mt-1 text-xl font-medium text-zinc-950 truncate">{patientRecordNumber} / {encounterId}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={dialectHint}
                onChange={(event) => setDialectHint(event.target.value)}
                aria-label="Dialect"
                className="h-11 rounded-app border border-zinc-200 bg-white px-3 outline-none focus:border-accent-500"
              >
                <option value="gulf">Gulf Arabic</option>
                <option value="msa">MSA</option>
                <option value="levantine">Levantine</option>
                <option value="egyptian">Egyptian</option>
              </select>
              <input
                value={patientRecordNumber}
                onChange={(event) => setPatientRecordNumber(event.target.value)}
                aria-label="Patient record number"
                className="h-11 w-24 rounded-app border border-zinc-200 px-3 outline-none focus:border-accent-500"
                required
              />
            </div>
          </div>
        </section>

        {/* Task 2: inner content — transcript panel + copilot, responsive split */}
        <section className="min-h-0 flex-1 grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Transcript + SOAP + physician review — hidden on mobile when copilot panel is active */}
          <div
            className={`min-h-0 overflow-y-auto border-r border-zinc-200 px-4 py-6 sm:px-6 ${
              mobilePanel === "copilot" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Transcript section */}
            <form onSubmit={handleSubmit} className="border-b border-zinc-100 pb-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-medium uppercase text-zinc-500">Transcript</h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setInputMode("manual")}
                    className={`rounded-app px-3 py-2.5 min-h-[44px] text-sm font-medium ${
                      inputMode === "manual" ? "bg-accent-50 text-accent-600" : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-app px-3 py-2.5 text-sm font-medium ${
                      isRecording ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? "Stop" : "Record"}
                  </button>
                  {/* Task 7: expanded accept list for upload */}
                  <label
                    className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-app px-3 py-2.5 text-sm font-medium ${
                      inputMode === "upload" ? "bg-accent-50 text-accent-600" : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    <Paperclip className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a,audio/x-m4a,audio/aac,audio/ogg,audio/webm,audio/flac,audio/mp4,video/mp4,.mp3,.wav,.m4a,.mp4,.aac,.ogg,.webm,.flac"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (file) {
                          const validationError = validateAudioFile(file);
                          if (validationError) {
                            setError(validationError);
                            event.target.value = "";
                            return;
                          }
                        }
                        setAudioFile(file);
                        setInputMode("upload");
                        setRecordingLabel("");
                        setError("");
                      }}
                    />
                  </label>
                </div>
              </div>

              {inputMode === "manual" ? (
                /* Task 1: empty placeholder, no default text */
                <div>
                  <textarea
                    value={manualTranscript}
                    onChange={(event) => setManualTranscript(event.target.value)}
                    dir="rtl"
                    className="arabic-text min-h-36 w-full resize-none border border-zinc-200 bg-white p-4 text-base leading-8 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-950"
                    placeholder="اكتب نص الاستشارة هنا..."
                    required
                  />
                  {/* Task 1: empty state guidance when transcript is empty and no result */}
                  {!manualTranscript && !result && (
                    <p className="mt-2 text-sm text-zinc-400 text-center py-2">
                      Type or paste the consultation transcript above, or switch to Record / Upload.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bitmap-trace flex min-h-32 flex-col items-center justify-center border border-zinc-200 text-center text-[15px] text-zinc-500">
                  {/* Task 3: pixel pulse animation on recording dot */}
                  <div
                    className={`mb-3 h-3 w-3 rounded-full transition-colors ${
                      isRecording ? "bg-accent-500 recording-pulse" : "bg-zinc-300"
                    }`}
                  />
                  <p className="font-medium text-zinc-950">
                    {isRecording ? "Recording in progress" : audioFile ? "Audio ready" : "Record or upload audio"}
                  </p>
                  <p className="mt-1">{recordingLabel || "Generate when the consultation audio is ready."}</p>
                  {/* Task 7: note about MP4 video extraction */}
                  {audioFile && audioFile.type === "video/mp4" && (
                    <p className="mt-3 max-w-xs text-xs text-amber-600">
                      MP4 files contain video — the backend will extract audio for transcription.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-sm text-zinc-500">
                  {error ? (
                    <span className="inline-flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </span>
                  ) : storageStatus ? (
                    storageStatus
                  ) : audioFile ? (
                    "Audio ready for note generation."
                  ) : (
                    "Doctor reviews before anything is saved."
                  )}
                </div>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (inputMode === "manual" && !manualTranscript.trim()) ||
                    (inputMode !== "manual" && !audioFile)
                  }
                  className={`inline-flex h-11 items-center gap-2 rounded-app px-4 text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSubmitting ? "pixel-generating" : "bg-zinc-950 hover:bg-accent-600"
                  }`}
                >
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Generating…" : "Generate note"}
                </button>
              </div>

              {result ? (
                <div className="mt-5 border-t border-zinc-100 pt-5">
                  <p className="text-sm font-medium text-zinc-950">Output transcript</p>
                  <div className="arabic-text mt-3 text-lg leading-9 text-zinc-700">
                    {highlightTerms(transcriptionText || manualTranscript, uncertainTerms)}
                  </div>
                  {translationText ? <p className="mt-4 text-sm leading-6 text-zinc-500">{translationText}</p> : null}
                </div>
              ) : null}
            </form>

            {/* SOAP note section */}
            <section className="border-b border-zinc-100 py-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase text-zinc-950">SOAP Note</h3>
                <span className="border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700">
                  Overall quality level: {soapSections.length > 0 ? "Needs review" : "Draft"}
                </span>
              </div>
              {soapSections.length > 0 ? (
                <div className="border-y border-zinc-950 bg-white">
                  {soapSections.map((section) => (
                    <article key={section.title} className="border-b border-zinc-200 py-5 last:border-b-0">
                      <h4 className="text-xs font-semibold uppercase text-zinc-950">
                        {section.title.charAt(0).toUpperCase() + section.title.slice(1)}
                      </h4>
                      {/* Task 6: show "Not provided" instead of omitting empty sections */}
                      {section.body ? (
                        <p className="mt-2 whitespace-pre-wrap text-base leading-8 text-zinc-900">{section.body}</p>
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
            </section>

          </div>

          {/* Clinical Copilot panel — hidden on mobile unless mobilePanel === "copilot" */}
          <aside
            className={`min-h-0 grid-rows-[auto_1fr_auto_auto] bg-white ${
              mobilePanel === "copilot" ? "grid" : "hidden lg:grid"
            }`}
          >
            <header className="border-b border-zinc-200 px-5 py-4">
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

            <div className="min-h-0 overflow-y-auto px-5 py-5">
              <div className="space-y-6">
                <section className="border-l-2 border-zinc-950 pl-4">
                  <p className="text-xs font-medium uppercase text-zinc-400">AI status</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-800">
                    {result
                      ? "I drafted the note and will ask one review question at a time. The final note still needs physician review."
                      : "Generate a note from the transcript, then I will guide the review here."}
                  </p>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase text-zinc-400">Uncertainty review</p>
                    {reviewPrompts.length > 0 ? (
                      <span className="text-xs text-zinc-500">
                        {answeredPromptCount} of {reviewPrompts.length}
                      </span>
                    ) : null}
                  </div>

                  {currentPrompt ? (
                    <article className="border border-zinc-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase text-accent-600">
                        Question {answeredPromptCount + 1} of {reviewPrompts.length}
                      </p>
                      <p className="mt-2 text-[15px] font-medium leading-7 text-zinc-950">{currentPrompt.question}</p>
                      {currentPrompt.reason ? (
                        <p className="mt-2 text-sm leading-6 text-zinc-500">{currentPrompt.reason}</p>
                      ) : null}

                      <div className="mt-4 space-y-2">
                        {currentPrompt.options.map((option) => (
                          <button
                            key={`${currentPrompt.id}-${option.value}`}
                            type="button"
                            onClick={() => handlePromptAnswer(currentPrompt, option)}
                            className="block min-h-[44px] w-full border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-800 hover:border-zinc-950"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <input
                          value={promptInputs[currentPrompt.id] ?? ""}
                          onChange={(event) =>
                            setPromptInputs((prev) => ({
                              ...prev,
                              [currentPrompt.id]: event.target.value
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              const text = promptInputs[currentPrompt.id]?.trim();
                              if (text) handlePromptAnswer(currentPrompt, { text });
                            }
                          }}
                          className="min-h-[44px] min-w-0 flex-1 rounded-app border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                          placeholder="Add correction manually"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const text = promptInputs[currentPrompt.id]?.trim();
                            if (text) handlePromptAnswer(currentPrompt, { text });
                          }}
                          className="min-h-[44px] rounded-app bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-40"
                          disabled={!promptInputs[currentPrompt.id]?.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </article>
                  ) : result && reviewPrompts.length > 0 ? (
                    <div className="border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <p className="text-sm leading-6 text-emerald-800">
                          Review questions are answered. The draft is ready for final physician review.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="border border-zinc-200 p-4 text-sm leading-6 text-zinc-500">
                      Review questions will appear after note generation.
                    </p>
                  )}

                  {answeredPromptCount > 0 ? (
                    <div className="mt-4 space-y-2">
                      {reviewPrompts.filter((prompt) => promptAnswers[prompt.id]).map((prompt) => (
                        <div key={prompt.id} className="border-l-2 border-emerald-500 pl-3">
                          <p className="text-xs font-medium uppercase text-zinc-400">Answered</p>
                          <p className="mt-1 text-sm text-zinc-700">{promptAnswers[prompt.id]}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section>
                  <p className="text-xs font-medium uppercase text-zinc-400">Tool suggestions</p>
                  <div className="mt-3 space-y-2">
                    {noteActions.map((action, index) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleNoteAction(action)}
                        className="flex min-h-[44px] w-full items-center gap-2 border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-800 hover:border-zinc-950"
                      >
                        {index === 0 ? <Brain className="h-4 w-4 text-zinc-500" /> : <Activity className="h-4 w-4 text-zinc-500" />}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                  {actionNotice ? <p className="mt-3 text-sm text-zinc-500">{actionNotice}</p> : null}
                </section>

                <section className="space-y-4">
                  <p className="text-xs font-medium uppercase text-zinc-400">Messages</p>
                {chatMessages.map((message) => (
                  <article key={message.id} className={message.role === "physician" ? "text-right" : ""}>
                    <p className="text-xs font-medium uppercase text-zinc-400">{message.role} · {message.createdAt}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{message.content}</p>
                  </article>
                ))}
                </section>
              </div>
            </div>

            <div className="border-t border-zinc-100 px-5 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {toolItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        addChatMessage({
                          role: "tool",
                          content: `${item.label} support is available for this consultation review.`
                        });
                      }}
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

            <div className="border-t border-zinc-200 p-5">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  className="min-h-[44px] min-w-0 flex-1 rounded-app border border-zinc-200 px-3 py-2 outline-none focus:border-accent-500"
                  placeholder="Ask Copilot..."
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center rounded-app bg-zinc-950 px-3 text-white hover:bg-accent-600"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </aside>
        </section>

        {/* Task 4: Mobile bottom navigation — hidden on lg+ */}
        <nav className="flex-shrink-0 flex items-stretch justify-around border-t border-zinc-200 bg-white lg:hidden">
          <button
            type="button"
            onClick={() => setMobilePanel("list")}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs font-medium ${
              mobilePanel === "list" ? "text-accent-600" : "text-zinc-500"
            }`}
          >
            <FileText className="h-5 w-5" />
            Scribes
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("main")}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs font-medium ${
              mobilePanel === "main" ? "text-accent-600" : "text-zinc-500"
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            Note
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("copilot")}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs font-medium ${
              mobilePanel === "copilot" ? "text-accent-600" : "text-zinc-500"
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            Copilot
          </button>
        </nav>
      </main>
    </div>
  );
}
