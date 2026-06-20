"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, FileAudio, LoaderCircle, Send, Upload } from "lucide-react";
import { processScribe, type ScribeResponse, type ScribeSourceMode } from "@/lib/api/scribe";
import { API_BASE_URL } from "@/lib/api/client";

type Tone = "cyan" | "teal" | "gold" | "ruby" | "plum";

const sampleTranscript = "دكتور عندي كتمة من أمس وما قدرت أنام";

const toneClasses: Record<Tone, string> = {
  cyan: "border-cyan-400 bg-cyan-400",
  teal: "border-teal-500 bg-teal-500",
  gold: "border-gold-400 bg-gold-400",
  ruby: "border-ruby-500 bg-ruby-500",
  plum: "border-plum-700 bg-plum-700"
};

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join("\n");
  }
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
      "transcript",
      "translation",
      "note",
      "value"
    ];
    for (const key of preferred) {
      if (typeof record[key] === "string") return record[key] as string;
    }
    return Object.entries(record)
      .map(([key, entry]) => {
        const text = asText(entry);
        if (!text) return "";
        return `${key.replaceAll("_", " ")}: ${text}`;
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

function extractTerms(value: unknown): string[] {
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
    .slice(0, 8);
}

function getSoapSections(value: unknown): Array<{ title: string; body: string }> {
  if (!value) return [];
  if (typeof value === "string") return [{ title: "SOAP", body: value }];
  if (typeof value !== "object") return [{ title: "SOAP", body: asText(value) }];

  const record = value as Record<string, unknown>;
  const source = record.sections && typeof record.sections === "object"
    ? (record.sections as Record<string, unknown>)
    : record;

  const order = ["subjective", "objective", "assessment", "plan"];
  const sections = order
    .map((key) => ({ title: key, body: asText(source[key]) }))
    .filter((section) => section.body);

  if (sections.length > 0) return sections;
  return [{ title: "SOAP", body: asText(value) }];
}

function getQuestions(value: unknown): Array<{ question: string; reason?: string; resolution?: string }> {
  return getArray(value)
    .map((item) => {
      if (typeof item === "string") return { question: item };
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return {
          question: asText(record.question ?? record.prompt ?? record.text),
          reason: asText(record.reason),
          resolution: asText(record.suggested_resolution ?? record.suggestedResolution ?? record.resolution)
        };
      }
      return { question: "" };
    })
    .filter((item) => item.question);
}

function highlightTerms(text: string, terms: string[]) {
  if (!text) return null;
  if (terms.length === 0) return text;

  const escaped = terms
    .filter((term) => term.length > 1)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) return text;

  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(pattern).map((part, index) => {
    const isMatch = terms.some((term) => term.toLowerCase() === part.toLowerCase());
    if (!isMatch) return part;
    return (
      <span key={`${part}-${index}`} className="border-b-2 border-gold-400 bg-gold-400/20">
        {part}
      </span>
    );
  });
}

function SignalDot({ tone }: { tone: Tone }) {
  return <span className={`inline-block h-2.5 w-2.5 border ${toneClasses[tone]}`} aria-hidden="true" />;
}

export function FanarScribeWorkspace({ encounterId }: { encounterId: string }) {
  const [sourceMode, setSourceMode] = useState<ScribeSourceMode>("manual_transcript");
  const [patientRecordNumber, setPatientRecordNumber] = useState("P023");
  const [doctorId, setDoctorId] = useState("D001");
  const [dialectHint, setDialectHint] = useState("gulf");
  const [manualTranscript, setManualTranscript] = useState(sampleTranscript);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScribeResponse | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transcriptionText = asText(result?.transcription);
  const translationText = asText(result?.translation);
  const uncertainTerms = useMemo(() => extractTerms(result?.uncertain_words), [result]);
  const soapSections = useMemo(() => getSoapSections(result?.soap_note), [result]);
  const questions = useMemo(() => getQuestions(result?.physician_questions), [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await processScribe({
        patientRecordNumber,
        encounterId,
        doctorId,
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
    <main className="mx-auto w-full max-w-[1380px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="border-2 border-navy-900 bg-mist-50">
        <header className="grid gap-4 border-b-2 border-navy-900 p-4 md:grid-cols-[1fr_auto] md:items-end md:p-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-normal text-teal-600">Consultation / {encounterId}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-navy-900 sm:text-5xl">
              FanarScribe clinical manuscript
            </h1>
          </div>
          <div className="font-mono text-xs text-navy-900">
            <div>API {API_BASE_URL.replace("https://", "")}</div>
            <div>{new Date().toLocaleDateString()}</div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid border-b-2 border-navy-900 lg:grid-cols-[280px_1fr]">
          <section className="border-b-2 border-navy-900 p-4 lg:border-b-0 lg:border-r-2 lg:p-5">
            <h2 className="text-sm font-black uppercase text-navy-900">Patient Context</h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="font-mono text-xs text-navy-900">MRN</span>
                <input
                  value={patientRecordNumber}
                  onChange={(event) => setPatientRecordNumber(event.target.value)}
                  className="mt-1 h-10 w-full border border-navy-900 bg-white px-3 font-mono text-sm outline-none focus:border-teal-500"
                  required
                />
              </label>
              <label className="block">
                <span className="font-mono text-xs text-navy-900">Doctor ID</span>
                <input
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                  className="mt-1 h-10 w-full border border-navy-900 bg-white px-3 font-mono text-sm outline-none focus:border-teal-500"
                />
              </label>
              <label className="block">
                <span className="font-mono text-xs text-navy-900">Dialect</span>
                <select
                  value={dialectHint}
                  onChange={(event) => setDialectHint(event.target.value)}
                  className="mt-1 h-10 w-full border border-navy-900 bg-white px-3 font-mono text-sm outline-none focus:border-teal-500"
                >
                  <option value="gulf">gulf</option>
                  <option value="msa">msa</option>
                  <option value="levantine">levantine</option>
                  <option value="egyptian">egyptian</option>
                </select>
              </label>
            </div>
          </section>

          <section className="p-4 lg:p-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSourceMode("manual_transcript")}
                className={`border px-3 py-2 text-sm font-bold transition ${
                  sourceMode === "manual_transcript"
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-navy-900 bg-white text-navy-900 hover:bg-mist-100"
                }`}
              >
                Manual transcript
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("audio")}
                className={`border px-3 py-2 text-sm font-bold transition ${
                  sourceMode === "audio"
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-navy-900 bg-white text-navy-900 hover:bg-mist-100"
                }`}
              >
                Audio upload
              </button>
            </div>

            <div className="mt-5">
              {sourceMode === "manual_transcript" ? (
                <label className="block">
                  <span className="font-mono text-xs uppercase text-navy-900">Transcript Area</span>
                  <textarea
                    value={manualTranscript}
                    onChange={(event) => setManualTranscript(event.target.value)}
                    dir="rtl"
                    className="arabic-text mt-2 min-h-40 w-full resize-y border border-navy-900 bg-white p-4 text-base leading-8 outline-none focus:border-teal-500"
                    required
                  />
                </label>
              ) : (
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-navy-900 bg-white p-5 text-center transition hover:border-teal-500">
                  <Upload className="h-6 w-6 text-teal-600" aria-hidden="true" />
                  <span className="mt-3 text-sm font-bold text-navy-900">
                    {audioFile ? audioFile.name : "Choose consultation audio"}
                  </span>
                  <span className="mt-1 font-mono text-xs text-slate-600">webm, wav, mp3</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
                    required={sourceMode === "audio"}
                  />
                </label>
              )}
            </div>

            {error ? (
              <div className="mt-4 flex gap-2 border border-ruby-500 bg-ruby-500/10 p-3 text-sm text-ruby-500">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="break-words">{error}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center gap-2 border-2 border-navy-900 bg-navy-900 px-4 text-sm font-black text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : sourceMode === "audio" ? (
                  <FileAudio className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Process note
              </button>
              <p className="font-mono text-xs text-slate-600">
                {isSubmitting ? "Processing clinical document" : "One request creates transcript, SOAP, and review questions"}
              </p>
            </div>
          </section>
        </form>

        <section className="grid lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <section className="border-b-2 border-navy-900 p-4 lg:p-6">
              <div className="flex items-center gap-2">
                <SignalDot tone={result ? "teal" : "cyan"} />
                <h2 className="text-lg font-black text-navy-900">Transcript</h2>
              </div>
              <div className="arabic-text mt-4 min-h-28 border-l-4 border-cyan-400 bg-white p-4 text-lg leading-9 text-navy-900">
                {result ? highlightTerms(transcriptionText || manualTranscript, uncertainTerms) : manualTranscript}
              </div>
              {translationText ? (
                <p className="mt-3 border-l-4 border-teal-500 bg-mist-100 p-3 text-sm leading-6 text-navy-900">
                  {translationText}
                </p>
              ) : null}
            </section>

            <section className="p-4 lg:p-6">
              <div className="flex items-center gap-2">
                <SignalDot tone="teal" />
                <h2 className="text-lg font-black text-navy-900">SOAP Note Area</h2>
              </div>
              <div className="mt-4 divide-y divide-navy-900 border border-navy-900 bg-white">
                {soapSections.length > 0 ? (
                  soapSections.map((section) => (
                    <article key={section.title} className="grid gap-3 p-4 md:grid-cols-[150px_1fr]">
                      <h3 className="font-mono text-xs uppercase text-teal-600">{section.title}</h3>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-navy-900">{section.body}</p>
                    </article>
                  ))
                ) : (
                  <p className="p-4 text-sm leading-7 text-slate-600">
                    Process a transcript or audio file to generate the clinical note.
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className="border-t-2 border-navy-900 p-4 lg:border-l-2 lg:border-t-0 lg:p-5">
            <section>
              <div className="flex items-center gap-2">
                <SignalDot tone={questions.length > 0 ? "gold" : "cyan"} />
                <h2 className="text-sm font-black uppercase text-navy-900">Margin Notes / Review</h2>
              </div>

              <div className="mt-4 space-y-3">
                {questions.length > 0 ? (
                  questions.map((item, index) => (
                    <article key={`${item.question}-${index}`} className="border border-navy-900 bg-white p-3">
                      <p className="font-bold leading-6 text-navy-900">{item.question}</p>
                      {item.reason ? <p className="mt-2 text-xs leading-5 text-slate-600">{item.reason}</p> : null}
                      {item.resolution ? (
                        <p className="mt-2 border-l-4 border-plum-700 pl-2 text-xs font-semibold leading-5 text-plum-700">
                          {item.resolution}
                        </p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="border border-navy-900 bg-white p-3 text-sm leading-6 text-slate-600">
                    Physician checkpoint questions will appear here after processing.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-center gap-2">
                <SignalDot tone="plum" />
                <h2 className="text-sm font-black uppercase text-navy-900">Intelligence</h2>
              </div>
              <div className="mt-4 border border-plum-700 bg-white p-3">
                <p className="text-xs font-black uppercase text-plum-700">Clinical Suggestion</p>
                <p className="mt-2 text-sm leading-6 text-navy-900">
                  Review highlighted spans before signing. Missing allergies, severity, and duration are prioritized.
                </p>
              </div>
            </section>

            {uncertainTerms.length > 0 ? (
              <section className="mt-6">
                <div className="flex items-center gap-2">
                  <SignalDot tone="gold" />
                  <h2 className="text-sm font-black uppercase text-navy-900">Uncertain Phrases</h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {uncertainTerms.map((term) => (
                    <span key={term} className="border border-gold-400 bg-gold-400/20 px-2 py-1 font-mono text-xs text-navy-900">
                      {term}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}
