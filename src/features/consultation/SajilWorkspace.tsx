"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
  Plus,
  Search,
  Settings,
  Square,
  Users
} from "lucide-react";
import { processScribe, type ScribeResponse, type ScribeSourceMode } from "@/lib/api/scribe";

type InputMode = "manual" | "record" | "upload";

const sampleTranscript = "دكتور عندي كتمة من أمس وما قدرت أنام";

const scribes = [
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
    for (const key of ["items", "questions", "words", "spans", "flags", "data"]) {
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
  const source =
    record.sections && typeof record.sections === "object" ? (record.sections as Record<string, unknown>) : record;

  const order = ["subjective", "objective", "assessment", "plan"];
  const sections = order
    .map((key) => ({ title: key, body: asText(source[key]) }))
    .filter((section) => section.body);

  return sections.length > 0 ? sections : [{ title: "SOAP", body: asText(value) }];
}

function getQuestions(value: unknown): Array<{ question: string; reason?: string }> {
  return getArray(value)
    .map((item) => {
      if (typeof item === "string") return { question: item };
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return {
          question: asText(record.question ?? record.prompt ?? record.text),
          reason: asText(record.reason)
        };
      }
      return { question: "" };
    })
    .filter((item) => item.question)
    .slice(0, 3);
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
    .slice(0, 4);
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
    <span className="rounded-app bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
      {status}
    </span>
  );
}

export function SajilWorkspace({ encounterId }: { encounterId: string }) {
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [patientRecordNumber, setPatientRecordNumber] = useState("P023");
  const [dialectHint, setDialectHint] = useState("gulf");
  const [manualTranscript, setManualTranscript] = useState(sampleTranscript);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScribeResponse | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLabel, setRecordingLabel] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcriptionText = asText(result?.transcription);
  const translationText = asText(result?.translation);
  const soapSections = useMemo(() => getSoapSections(result?.soap_note), [result]);
  const questions = useMemo(() => getQuestions(result?.physician_questions), [result]);
  const uncertainTerms = useMemo(() => getUncertainTerms(result?.uncertain_words), [result]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const sourceMode: ScribeSourceMode = inputMode === "manual" ? "manual_transcript" : "audio";

    try {
      const data = await processScribe({
        patientRecordNumber,
        encounterId,
        consultationTime: new Date().toISOString(),
        sourceMode,
        manualTranscript,
        audioFile,
        dialectHint,
        languageHint: "ar",
        noteFormat: "SOAP",
        privacyMode: "prototype"
      });
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to process this consultation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid min-h-screen bg-white text-[15px] text-zinc-900 lg:grid-cols-[68px_336px_1fr]">
      <aside className="flex border-r border-zinc-200 bg-white">
        <nav className="flex w-full flex-col items-center gap-3 px-2 py-5" aria-label="Primary">
          <div className="sajil-wordmark mb-3 text-sm text-zinc-950" aria-label="SAJIL">
            SJ
          </div>
          <button type="button" className="rounded-app bg-accent-50 p-2.5 text-accent-600" aria-label="Scribes" title="Scribes">
            <FileText className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-app p-2.5 text-zinc-500 hover:bg-zinc-100" aria-label="Patients" title="Patients">
            <Users className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-app p-2.5 text-zinc-500 hover:bg-zinc-100" aria-label="Calendar" title="Calendar">
            <CalendarDays className="h-5 w-5" />
          </button>
          <button type="button" className="mt-auto rounded-app p-2.5 text-zinc-500 hover:bg-zinc-100" aria-label="Settings" title="Settings">
            <Settings className="h-5 w-5" />
          </button>
        </nav>
      </aside>

      <aside className="border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="sajil-wordmark text-3xl text-zinc-950">SAJIL</h1>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-1.5 rounded-app bg-accent-500 px-3.5 text-[15px] font-medium text-white hover:bg-accent-600"
            >
              New scribe
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <label className="mt-5 flex h-11 items-center gap-2 rounded-app border border-zinc-200 bg-white px-3 text-[15px] text-zinc-500 focus-within:border-accent-500">
            <Search className="h-4 w-4" />
            <input className="w-full bg-transparent outline-none" placeholder="Search scribes..." />
          </label>
        </div>

        <div className="divide-y divide-zinc-100">
          {scribes.map((scribe) => (
            <button
              key={scribe.id}
              type="button"
              className={`block w-full px-5 py-5 text-left hover:bg-zinc-50 ${
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
      </aside>

      <main className="grid min-h-screen min-w-0 bg-white lg:grid-cols-2">
        <section className="min-w-0 border-r border-zinc-200">
          <header className="flex min-h-[72px] items-center justify-between gap-3 border-b border-zinc-200 px-6">
            <div>
              <h2 className="text-lg font-medium text-zinc-950">Transcript</h2>
              <p className="text-[15px] text-zinc-500">
                {isRecording ? "Listening..." : audioFile ? audioFile.name : `Encounter ${encounterId}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`rounded-app px-3 py-2 text-sm font-medium ${
                  inputMode === "manual" ? "bg-accent-50 text-accent-600" : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`inline-flex items-center gap-1.5 rounded-app px-3 py-2 text-sm font-medium ${
                  isRecording ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? "Stop" : "Record"}
              </button>
              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-app px-3 py-2 text-sm font-medium ${
                  inputMode === "upload" ? "bg-accent-50 text-accent-600" : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <Paperclip className="h-4 w-4" />
                Upload
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(event) => {
                    setAudioFile(event.target.files?.[0] ?? null);
                    setInputMode("upload");
                    setRecordingLabel("");
                  }}
                />
              </label>
            </div>
          </header>

          <div className="px-6 py-6">
            {inputMode === "manual" ? (
              <textarea
                value={manualTranscript}
                onChange={(event) => setManualTranscript(event.target.value)}
                dir="rtl"
                className="arabic-text min-h-[360px] w-full resize-none bg-transparent text-lg leading-9 text-zinc-950 outline-none placeholder:text-zinc-400"
                placeholder="اكتب نص الاستشارة هنا..."
                required
              />
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center text-[15px] text-zinc-500">
                <div className={`mb-3 h-2.5 w-2.5 rounded-full ${isRecording ? "bg-accent-500" : "bg-zinc-300"}`} />
                <p className="font-medium text-zinc-950">
                  {isRecording ? "Recording in progress" : audioFile ? "Audio ready" : "Record or upload audio"}
                </p>
                <p className="mt-1">{recordingLabel || "Generate when the consultation audio is ready."}</p>
              </div>
            )}

            {error ? (
              <div className="mt-4 flex gap-2 rounded-app border border-red-200 bg-white p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="break-words">{error}</p>
              </div>
            ) : null}

            <div className="mt-8 border-t border-zinc-100 pt-5">
              <p className="text-[15px] font-medium text-zinc-950">Output transcript</p>
              <div className="arabic-text mt-3 min-h-24 text-lg leading-9 text-zinc-700">
                {result ? highlightTerms(transcriptionText || manualTranscript, uncertainTerms) : manualTranscript}
              </div>
              {translationText ? <p className="mt-4 text-sm leading-6 text-zinc-500">{translationText}</p> : null}
            </div>
          </div>
        </section>

        <section className="min-w-0">
          <header className="flex min-h-[72px] items-center justify-between gap-3 border-b border-zinc-200 px-6">
            <div>
              <h2 className="text-lg font-medium text-zinc-950">SOAP Note</h2>
              <div className="mt-0.5 flex items-center gap-2 text-[15px] text-zinc-500">
                <input
                  value={patientRecordNumber}
                  onChange={(event) => setPatientRecordNumber(event.target.value)}
                  aria-label="Patient record number"
                  className="w-16 bg-transparent outline-none focus:text-accent-600"
                  required
                />
                <span>/</span>
                <select
                  value={dialectHint}
                  onChange={(event) => setDialectHint(event.target.value)}
                  aria-label="Dialect"
                  className="bg-transparent outline-none focus:text-accent-600"
                >
                  <option value="gulf">Gulf Arabic</option>
                  <option value="msa">MSA</option>
                  <option value="levantine">Levantine</option>
                  <option value="egyptian">Egyptian</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={soapSections.length > 0 ? "Saved" : "Draft"} />
              <button
                type="submit"
                disabled={isSubmitting || (inputMode !== "manual" && !audioFile)}
                className="inline-flex h-10 items-center gap-2 rounded-app bg-accent-500 px-4 text-[15px] font-medium text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Generate
              </button>
            </div>
          </header>

          <div className="px-6 py-6">
            {soapSections.length > 0 ? (
              <div className="space-y-7">
                {soapSections.map((section) => (
                  <article key={section.title}>
                    <h3 className="text-xs font-medium uppercase text-zinc-500">{section.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-base leading-8 text-zinc-800">{section.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="flex min-h-[360px] items-center justify-center text-center text-base text-zinc-400">
                Generate a SOAP note from the transcript.
              </p>
            )}

            <div className="mt-8 border-t border-zinc-100 pt-5">
              <h3 className="text-sm font-medium text-zinc-950">Review</h3>
              {questions.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {questions.map((item, index) => (
                    <article key={`${item.question}-${index}`}>
                      <p className="text-sm font-medium leading-6 text-zinc-900">{item.question}</p>
                      {item.reason ? <p className="mt-1 text-sm leading-6 text-zinc-500">{item.reason}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-zinc-400">No review questions yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </form>
  );
}
