import Image from "next/image";
import Link from "next/link";
import { UncertaintyDemo } from "@/features/landing/UncertaintyDemo";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <div className="bg-white text-zinc-950">

      {/* ── NAV ── */}
      <header className="sticky top-0 z-40 border-b-2 border-zinc-950 bg-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link className="sajil-wordmark text-sm text-zinc-950" href="/">SAJIL</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden items-center gap-0 divide-x-2 divide-zinc-950 border-2 border-zinc-950 md:flex">
              {[
                { href: "#problem",     label: "Problem" },
                { href: "#how",         label: "How" },
                { href: "#demo",        label: "Demo" },
                { href: "#contact",     label: "Contact" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>
            <Link
              href={routes.doctorDashboard}
              className="border-2 border-zinc-950 bg-zinc-950 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-accent-500 hover:border-accent-500"
            >
              Open →
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── 01 HERO ── */}
        <section className="border-b-2 border-zinc-950 px-4 pb-12 pt-10 sm:px-6 sm:pt-16 sm:pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-8">
              <div className="flex-1">
                <p className="font-mono text-xs font-bold text-zinc-400">01 / SAJIL</p>
                <h1 className="sajil-wordmark mt-3 text-[72px] leading-none text-zinc-950 sm:text-[120px]">
                  SAJIL
                </h1>
                <div className="mt-4 h-1 w-full bg-zinc-950" />
                <p className="mt-5 font-mono text-base font-bold uppercase tracking-widest text-zinc-950 sm:text-xl">
                  Arabic → SOAP.
                </p>
                <p className="mt-1 font-mono text-base text-zinc-500 sm:text-lg">
                  Every uncertain term flagged before you sign.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Link
                    href={routes.doctorDashboard}
                    className="inline-block border-2 border-zinc-950 bg-zinc-950 px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-accent-500 hover:border-accent-500 hover:translate-y-[-2px]"
                  >
                    Open demo workspace →
                  </Link>
                  <a
                    href="#demo"
                    className="inline-block border-2 border-zinc-300 px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-500 transition-all hover:border-zinc-950 hover:text-zinc-950"
                  >
                    See the demo ↓
                  </a>
                </div>
              </div>
              <div className="hidden flex-shrink-0 flex-col items-end gap-3 lg:flex">
                <Image
                  src="/mascot.png"
                  alt="Sajil mascot"
                  width={160}
                  height={160}
                  className="bird-idle select-none"
                  priority
                />
                <div className="border-2 border-zinc-950 bg-zinc-950 px-3 py-1.5">
                  <p className="font-mono text-xs text-white">POWERED BY FANAR</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 PROBLEM ── */}
        <section id="problem" className="border-b-2 border-zinc-950 bg-zinc-950 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs font-bold text-zinc-500">02 / THE PROBLEM</p>
            <div className="mt-6 grid gap-0 border-2 border-zinc-700 sm:grid-cols-2">
              <div className="border-b-2 border-zinc-700 p-6 sm:border-b-0 sm:border-r-2">
                <p className="font-mono text-5xl font-bold text-white sm:text-6xl">20–40</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-widest text-zinc-500">minutes per consultation</p>
                <p className="mt-3 text-sm text-zinc-400">lost to documentation instead of the patient.</p>
              </div>
              <div className="p-6">
                <p className="font-mono text-5xl font-bold text-accent-500 sm:text-6xl">0</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-widest text-zinc-500">Arabic-native clinical AI</p>
                <p className="mt-3 text-sm text-zinc-400">products that actually understand dialect.</p>
              </div>
            </div>
            <p className="mt-8 max-w-xl text-sm leading-7 text-zinc-400">
              Existing AI scribes write confidently. One ambiguous Arabic word, transcribed without a second thought, becomes a clinical record.
            </p>
          </div>
        </section>

        {/* ── 03 THE كتمة MOMENT ── */}
        <section className="border-b-2 border-zinc-950 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-0">

              {/* Left: the problem */}
              <div className="border-2 border-zinc-950 p-6 sm:p-8 lg:border-r-0">
                <p className="font-mono text-xs font-bold text-zinc-400">03 / THE RISK</p>
                <h2 className="mt-6 text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl">
                  One word.<br />Three clinical meanings.
                </h2>
                <div className="mt-6 border-l-4 border-accent-500 pl-4">
                  <p className="arabic-text text-3xl font-bold text-zinc-950 sm:text-4xl">كتمة</p>
                  <p className="mt-2 font-mono text-xs text-zinc-500">patient says this. what does it mean?</p>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-0 border-2 border-zinc-950">
                  {["Chest\ntightness", "Shortness\nof breath", "Both"].map((m, i) => (
                    <div
                      key={m}
                      className={`p-3 ${i < 2 ? "border-r-2 border-zinc-950" : ""}`}
                    >
                      <p className="font-mono text-xs font-bold text-zinc-950 whitespace-pre-line leading-tight">{m}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-7 text-zinc-500">
                  Your current AI scribe picked one. No flag. No question. The doctor signed it.
                </p>
                <div className="mt-5 border-2 border-accent-500 bg-accent-500 p-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    That is how errors enter the clinical record.
                  </p>
                </div>
              </div>

              {/* Right: how sajil handles it */}
              <div className="border-2 border-zinc-950 p-6 sm:p-8">
                <p className="font-mono text-xs font-bold text-zinc-400">SAJIL APPROACH</p>
                <h2 className="mt-6 text-xl font-bold text-zinc-950 sm:text-2xl">
                  An AI that knows<br />what it doesn&apos;t know.
                </h2>
                <div className="mt-8 space-y-0 border-2 border-zinc-950">
                  {[
                    { n: "01", title: "Transcribe",  body: "Arabic speech → text, dialect-aware via Fanar." },
                    { n: "02", title: "Flag",         body: "Every uncertain term highlighted. No guessing." },
                    { n: "03", title: "Ask",          body: "One physician checkpoint per uncertain claim." },
                    { n: "04", title: "Approve",      body: "SOAP note ships only after doctor confirms." },
                  ].map(({ n, title, body }, i, arr) => (
                    <div key={n} className={`flex gap-4 p-4 ${i < arr.length - 1 ? "border-b-2 border-zinc-950" : ""}`}>
                      <span className="font-mono text-sm font-bold text-zinc-300 tabular-nums flex-shrink-0">{n}</span>
                      <div>
                        <p className="font-mono text-sm font-bold text-zinc-950">{title}</p>
                        <p className="mt-0.5 text-sm text-zinc-500">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 04 HOW IT WORKS ── */}
        <section id="how" className="border-b-2 border-zinc-950 bg-zinc-950 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs font-bold text-zinc-500">04 / SYSTEM</p>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              What Sajil actually does.
            </h2>
            <div className="mt-8 grid gap-px bg-zinc-700 border-2 border-zinc-700 grid-cols-2 sm:grid-cols-4">
              {[
                { label: "Record", body: "Live Arabic consultation. Consent-first." },
                { label: "Transcribe", body: "Dialect-aware via Fanar. Code-switching handled." },
                { label: "Flag", body: "Uncertain terms get orange highlights. Weak evidence logged." },
                { label: "Approve", body: "Physician confirms every flagged claim. Then SOAP ships.", accent: true },
              ].map(({ label, body, accent }) => (
                <div key={label} className="bg-zinc-950 p-4 sm:p-5">
                  <p className={`font-mono text-xs font-bold uppercase tracking-wider ${accent ? "text-accent-500" : "text-zinc-300"}`}>
                    {label}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 05 DEMO ── */}
        <section id="demo" className="border-b-2 border-zinc-950 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="font-mono text-xs font-bold text-zinc-400">05 / INTERACTIVE DEMO</p>
                <h2 className="mt-4 text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl">
                  Try the uncertainty moment.
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  Step through كتمة — from raw patient phrase to physician-confirmed SOAP note.
                </p>
                <div className="mt-6 border-l-4 border-zinc-200 pl-4 space-y-2">
                  {[
                    "Patient speaks",
                    "Sajil transcribes + flags",
                    "SOAP draft generated",
                    "Physician resolves",
                    "Note confirmed",
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold text-zinc-300 tabular-nums w-3">{i + 1}</span>
                      <span className="font-mono text-xs text-zinc-600">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-2 border-zinc-950 p-4 sm:p-6">
                <UncertaintyDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 WHAT'S REAL TODAY ── */}
        <section className="border-b-2 border-zinc-950 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs font-bold text-zinc-400">06 / BUILT TODAY</p>
            <h2 className="mt-4 text-2xl font-bold text-zinc-950 sm:text-3xl">
              What actually works right now.
            </h2>
            <div className="mt-8 grid gap-px border-2 border-zinc-950 bg-zinc-950 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  tag:  "CORE",
                  title: "Arabic transcription",
                  body:  "Live audio → text. Gulf, Levantine, MSA. Via Fanar.",
                },
                {
                  tag:  "CORE",
                  title: "Uncertainty flagging",
                  body:  "Model-calibrated confidence. Low-confidence terms highlighted, not guessed.",
                  red:   true,
                },
                {
                  tag:  "CORE",
                  title: "SOAP generation",
                  body:  "Structured note from transcript. Subjective, Objective, Assessment, Plan.",
                },
                {
                  tag:  "CORE",
                  title: "Physician checkpoints",
                  body:  "One question per uncertain claim. Physician resolves before note ships.",
                },
                {
                  tag:  "CORE",
                  title: "Clinical copilot",
                  body:  "Ask Sajil about the note, evidence gaps, or red-flag completeness.",
                },
                {
                  tag:  "COMING",
                  title: "Pre-consultation intake",
                  body:  "Fanar calls the patient before the visit. Structured summary ready at opening.",
                  muted: true,
                },
              ].map(({ tag, title, body, red, muted }) => (
                <div key={title} className="bg-white p-5">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                      muted ? "text-zinc-300" : red ? "text-accent-500" : "text-zinc-400"
                    }`}
                  >
                    {tag}
                  </span>
                  <p className={`mt-2 text-sm font-bold ${muted ? "text-zinc-400" : "text-zinc-950"}`}>{title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 07 CONTACT ── */}
        <section id="contact" className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-0">
              <div className="border-2 border-zinc-950 p-6 sm:p-10 lg:border-r-0">
                <p className="font-mono text-xs font-bold text-zinc-400">07 / SUPPORT US</p>
                <h2 className="mt-6 text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl">
                  Help us build it right.
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-500">
                  We need clinicians, Arabic speakers, and engineers who care about clinical accuracy in AI.
                </p>
                <div className="mt-8">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">Contact</p>
                  <a
                    href="mailto:hussainak2005@gmail.com"
                    className="mt-2 inline-block border-b-2 border-zinc-950 font-mono text-sm font-bold text-zinc-950 transition-colors hover:border-accent-500 hover:text-accent-500"
                  >
                    hussainak2005@gmail.com
                  </a>
                </div>
              </div>
              <div className="border-2 border-zinc-950 bg-zinc-950 p-6 sm:p-10">
                <p className="font-mono text-xs font-bold text-zinc-500">WHY IT MATTERS</p>
                <div className="mt-6 space-y-0 border-2 border-zinc-700">
                  {[
                    "Arabic-native, not Arabic-compatible",
                    "Uncertainty is architecture, not UX",
                    "Physician is in the loop, not rubber-stamping",
                    "Built on Fanar — an actual Arabic LLM",
                  ].map((point, i, arr) => (
                    <div
                      key={point}
                      className={`flex items-start gap-3 p-4 ${i < arr.length - 1 ? "border-b-2 border-zinc-700" : ""}`}
                    >
                      <span className="mt-0.5 flex-shrink-0 font-mono text-xs font-bold text-accent-500">▸</span>
                      <p className="text-xs leading-5 text-zinc-300 sm:text-sm sm:leading-6">{point}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-2 border-zinc-700 p-4">
                  <p className="font-mono text-xs text-zinc-500">Fanar Hackathon 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t-2 border-zinc-950 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <span className="sajil-wordmark text-xs text-zinc-400">SAJIL</span>
          <p className="font-mono text-[10px] text-zinc-400">
            Powered by <span className="font-bold text-zinc-600">FANAR AI</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
