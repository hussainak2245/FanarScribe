"use client";

import { useState } from "react";

type Step = "phrase" | "transcript" | "soap" | "question" | "done";
type Choice = "tightness" | "breath" | "both" | "remove";

const CHOICES: { key: Choice; label: string }[] = [
  { key: "tightness", label: "Chest tightness" },
  { key: "breath",    label: "Shortness of breath" },
  { key: "both",      label: "Both" },
  { key: "remove",    label: "Remove from note" },
];

const NOTE_UPDATES: Record<Choice, string> = {
  tightness: "Patient reports chest tightness since yesterday with sleep disruption.",
  breath:    "Patient reports shortness of breath since yesterday with sleep disruption.",
  both:      "Patient reports chest tightness and shortness of breath since yesterday with sleep disruption.",
  remove:    "[Term removed — pending physician clarification before note is finalised.]",
};

export function UncertaintyDemo() {
  const [step, setStep] = useState<Step>("phrase");
  const [choice, setChoice] = useState<Choice | null>(null);

  function reset() {
    setStep("phrase");
    setChoice(null);
  }

  const stepNum = { phrase: 1, transcript: 2, soap: 3, question: 4, done: 5 }[step];

  return (
    <div className="space-y-3">

      {/* Step tracker */}
      <div className="flex items-center gap-1.5 pb-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              n <= stepNum ? "bg-zinc-950" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>

      {/* Step 1 — Patient phrase */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Patient phrase</p>
        <p className="arabic-text mt-3 text-xl leading-10 text-zinc-950">
          دكتور عندي{" "}
          <span
            className="relative"
            style={{
              borderBottom: "2px solid #fa2a55",
              paddingBottom: "1px",
            }}
          >
            كتمة
          </span>
          {" "}من أمس وما قدرت أنام
        </p>
        {step === "phrase" && (
          <button
            onClick={() => setStep("transcript")}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-app border border-zinc-200 px-4 text-xs font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
          >
            Transcribe →
          </button>
        )}
      </div>

      {/* Step 2 — Transcript */}
      {stepNum >= 2 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Sajil transcript
          </p>
          <p className="arabic-text mt-3 text-base leading-9 text-zinc-800">
            مريض:{" "}
            <span
              className="cursor-default px-0.5"
              style={{ borderBottom: "2px solid #fa2a55", color: "#18181b" }}
              title="Uncertain term flagged by Sajil"
            >
              كتمة
            </span>
            {" "}من أمس وما قدرت أنام
          </p>
          {step === "transcript" && (
            <button
              onClick={() => setStep("soap")}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-app border border-zinc-200 px-4 text-xs font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
            >
              Generate SOAP →
            </button>
          )}
        </div>
      )}

      {/* Step 3 — SOAP draft */}
      {stepNum >= 3 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            SOAP draft — Subjective
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            Patient reports{" "}
            <span
              className="px-0.5 text-zinc-950"
              style={{ backgroundColor: "#FFE0B2", color: "#E65100" }}
            >
              كتمة
            </span>{" "}
            since yesterday with sleep disruption.
          </p>
          {step === "soap" && (
            <button
              onClick={() => setStep("question")}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-app border border-accent-500 px-4 text-xs font-medium text-accent-500 hover:bg-accent-50 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Review uncertain term →
            </button>
          )}
        </div>
      )}

      {/* Step 4 — Physician question */}
      {step === "question" && (
        <div className="rounded-lg border border-zinc-950 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Sajil asks the physician
          </p>
          <p className="mt-3 text-base font-medium text-zinc-950">
            What does{" "}
            <span
              className="px-0.5"
              dir="rtl"
              style={{ borderBottom: "2px solid #fa2a55" }}
            >
              كتمة
            </span>{" "}
            mean here?
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CHOICES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setChoice(key); setStep("done"); }}
                className="rounded-app border border-zinc-200 px-3 py-2.5 text-left text-sm text-zinc-700 hover:border-zinc-950 hover:bg-zinc-50 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5 — Note updated */}
      {step === "done" && choice && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Note updated by physician confirmation
            </p>
          </div>
          <p className="text-sm leading-7 text-zinc-800">{NOTE_UPDATES[choice]}</p>
          <button
            onClick={reset}
            className="mt-4 text-xs text-zinc-400 underline hover:text-zinc-600 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

    </div>
  );
}
