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

const STEP_ORDER: Step[] = ["phrase", "transcript", "soap", "question", "done"];

const UNCERTAIN_STYLE = { borderBottom: "2px solid #D20A2E", paddingBottom: "1px" };
const HIGHLIGHT_STYLE = { backgroundColor: "#fce4e8", color: "#D20A2E" };

export function UncertaintyDemo() {
  const [step, setStep] = useState<Step>("phrase");
  const [choice, setChoice] = useState<Choice | null>(null);

  function reset() {
    setStep("phrase");
    setChoice(null);
  }

  const stepNum = STEP_ORDER.indexOf(step) + 1;

  return (
    <div className="space-y-4">

      {/* Step progress */}
      <div className="flex items-center gap-1.5">
        {STEP_ORDER.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i + 1 <= stepNum ? "bg-accent-500" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>

      {/* Step 1 — Patient phrase */}
      {step === "phrase" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Patient phrase</p>
          <p className="arabic-text mt-4 text-xl leading-10 text-zinc-950 w-full" style={{ textAlign: "center" }}>
            دكتور عندي{" "}
            <span style={UNCERTAIN_STYLE}>كتمة</span>
            {" "}من أمس وما قدرت أنام
          </p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => setStep("transcript")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950"
            >
              Transcribe →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Transcript */}
      {step === "transcript" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Sajil transcript</p>
          <p className="arabic-text mt-4 text-base leading-9 text-zinc-800 w-full" style={{ textAlign: "center" }}>
            مريض:{" "}
            <span
              className="cursor-default"
              style={UNCERTAIN_STYLE}
              title="Uncertain term flagged by Sajil"
            >
              كتمة
            </span>
            {" "}من أمس وما قدرت أنام
          </p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => setStep("soap")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950"
            >
              Generate SOAP →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — SOAP draft */}
      {step === "soap" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">SOAP draft — Subjective</p>
          <p className="mt-4 text-sm leading-7 text-zinc-700">
            Patient reports{" "}
            <span className="rounded px-1" style={HIGHLIGHT_STYLE}>كتمة</span>
            {" "}since yesterday with sleep disruption.
          </p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => setStep("question")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-accent-500 bg-accent-50 px-4 text-xs font-semibold text-accent-600 transition-colors hover:bg-accent-500 hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Review uncertain term →
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Physician question */}
      {step === "question" && (
        <div className="rounded-xl border-2 border-accent-500 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-500">Sajil asks the physician</p>
          <p className="mt-3 text-base font-semibold text-zinc-950">
            What does{" "}
            <span className="px-0.5" dir="rtl" style={UNCERTAIN_STYLE}>كتمة</span>
            {" "}mean here?
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CHOICES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setChoice(key); setStep("done"); }}
                className="rounded-lg border border-zinc-200 px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5 — Note updated */}
      {step === "done" && choice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Note confirmed by physician
            </p>
          </div>
          <p className="text-sm leading-7 text-zinc-800">{NOTE_UPDATES[choice]}</p>
          <button
            onClick={reset}
            className="mt-4 text-xs font-medium text-zinc-400 underline transition-colors hover:text-accent-500"
          >
            Try again
          </button>
        </div>
      )}

    </div>
  );
}
