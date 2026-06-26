import Link from "next/link";
import { UncertaintyDemo } from "@/features/landing/UncertaintyDemo";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <div className="bg-white text-zinc-950">


      <main>

        {/* HERO */}
        <section className="px-4 pb-16 pt-8 sm:px-6 sm:pt-14 sm:pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-12">

              <div className="flex-1">
                <h1 className="sajil-wordmark text-[72px] leading-none text-zinc-950 sm:text-[108px]">
                  SAJIL
                </h1>

                <p className="mt-6 text-2xl font-semibold leading-snug text-zinc-950 sm:text-3xl">
                  Focus on the patient,<br className="hidden sm:block" /> not the documentation.
                </p>

                <div className="mt-8">
                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-600 hover:translate-y-[-1px]"
                  >
                    See the demo
                    <span>↓</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HIGHLIGHT: "Scribe that knows what it doesn't know" */}
        <section className="border-y border-zinc-100 bg-zinc-950 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
              <h2 className="text-2xl font-bold text-white sm:text-3xl sm:max-w-[220px] sm:flex-shrink-0">
                A scribe that knows what it doesn&apos;t know.
              </h2>
              <div className="h-px w-full bg-zinc-800 sm:h-16 sm:w-px sm:flex-shrink-0" />
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
                {[
                  { num: "01", label: "Flag uncertain terms" },
                  { num: "02", label: "Checkpoint the physician" },
                  { num: "03", label: "SOAP ships with confidence" },
                ].map(({ num, label }) => (
                  <div key={num} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <span className="font-mono text-base font-bold text-accent-400 flex-shrink-0">{num}</span>
                    <p className="text-base font-semibold text-zinc-200 leading-6">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* THE RISK MOMENT */}
        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-2">

              {/* The problem card */}
              <div className="rounded-2xl border border-zinc-200 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">The risk</p>
                <h3 className="mt-4 text-xl font-bold text-zinc-950">
                  One word. Three clinical meanings.
                </h3>
                <div className="mt-6 rounded-xl bg-zinc-50 p-5" style={{ textAlign: "center" }}>
                  <p className="arabic-text text-4xl font-bold text-zinc-950" style={{ textAlign: "center" }}>كتمة</p>
                  <p className="mt-2 text-xs text-zinc-500">Patient says this. What does it mean?</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {["Chest tightness", "Shortness of breath", "Both"].map((m, i) => (
                    <div key={m} className={`rounded-lg border border-zinc-200 p-3 text-center ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                      <p className="text-xs font-semibold text-zinc-700 leading-tight">{m}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-zinc-500">
                  Other AI scribes pick one. No flag. No question. The doctor signs it. That is how errors enter the clinical record.
                </p>
              </div>

              {/* Sajil approach card */}
              <div className="rounded-2xl border border-zinc-200 p-8">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-semibold text-white">
                  Sajil approach
                </div>
                <h3 className="mt-4 text-xl font-bold text-zinc-950">
                  Flags it. Asks the physician. Then writes.
                </h3>
                <div className="mt-6 space-y-3">
                  {[
                    { n: "01", title: "Transcribe", body: "Arabic speech to text, dialect-aware via Fanar." },
                    { n: "02", title: "Flag", body: "Every uncertain term highlighted. No silent guesses." },
                    { n: "03", title: "Ask", body: "One physician checkpoint per uncertain claim." },
                    { n: "04", title: "Approve", body: "SOAP note ships only after the doctor confirms." },
                  ].map(({ n, title, body }) => (
                    <div key={n} className="flex gap-4 rounded-xl bg-zinc-50 p-4">
                      <span className="mt-0.5 w-6 flex-shrink-0 font-mono text-xs font-bold text-accent-500">{n}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">{title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="demo" className="border-y border-zinc-100 bg-zinc-50 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Interactive demo</p>
                <h2 className="mt-3 text-2xl font-bold text-zinc-950">
                  Try the uncertainty moment.
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  Step through كتمة — from raw patient phrase to physician-confirmed SOAP note.
                </p>
                <div className="mt-8 space-y-2">
                  {[
                    "Patient speaks",
                    "Sajil transcribes and flags",
                    "SOAP draft generated",
                    "Physician resolves",
                    "Note confirmed",
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 font-mono text-[10px] font-bold text-zinc-600">{i + 1}</span>
                      <span className="text-sm text-zinc-600">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <UncertaintyDemo />
              </div>
            </div>
          </div>
        </section>

        {/* BENTO FEATURES */}
        <section id="features" className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Built today</p>
            <h2 className="mt-3 text-2xl font-bold text-zinc-950">
              What actually works right now.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Arabic transcription",
                  body: "Live audio to text. Gulf, Levantine, MSA. Via Fanar.",
                  tag: "Core",
                },
                {
                  title: "Uncertainty flagging",
                  body: "Model-calibrated confidence. Low-confidence terms highlighted, not guessed.",
                  tag: "Core",
                  accent: true,
                },
                {
                  title: "SOAP generation",
                  body: "Structured note from transcript. Subjective, Objective, Assessment, Plan.",
                  tag: "Core",
                },
                {
                  title: "Physician checkpoints",
                  body: "One question per uncertain claim. Physician resolves before note ships.",
                  tag: "Core",
                },
                {
                  title: "Clinical copilot",
                  body: "Ask Sajil about the note, evidence gaps, or red-flag completeness.",
                  tag: "Core",
                },
                {
                  title: "Pre-consultation intake",
                  body: "Fanar calls the patient before the visit. Structured summary ready at opening.",
                  tag: "Coming soon",
                  muted: true,
                },
              ].map(({ title, body, tag, accent, muted }) => (
                <div
                  key={title}
                  className={`rounded-2xl border p-5 ${muted ? "border-zinc-100 bg-zinc-50" : "border-zinc-200 bg-white"}`}
                >
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                    muted ? "bg-zinc-100 text-zinc-400"
                    : accent ? "bg-accent-50 text-accent-600"
                    : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {tag}
                  </span>
                  <p className={`mt-3 text-sm font-semibold ${muted ? "text-zinc-400" : "text-zinc-950"}`}>{title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="border-t border-zinc-100 bg-zinc-950 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Ready?</p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Open the demo workspace.
            </h2>
            <p className="mt-3 text-sm text-zinc-400">No login required. Real Arabic consultation, real SOAP output.</p>
            <Link
              href={routes.doctorDashboard}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-accent-500 hover:text-white hover:translate-y-[-1px]"
            >
              Open demo workspace
              <span>→</span>
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-100 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <span className="sajil-wordmark text-xs text-zinc-400">SAJIL</span>
          <p className="text-xs text-zinc-400">
            Powered by <span className="font-semibold text-zinc-600">Fanar AI</span> · Fanar Hackathon 2026
          </p>
        </div>
      </footer>

    </div>
  );
}
