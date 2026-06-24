import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UncertaintyDemo } from "@/features/landing/UncertaintyDemo";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <div className="bg-white text-zinc-950">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link className="sajil-wordmark text-base text-zinc-950" href="/">SAJIL</Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "#problem",     label: "Problem" },
              { href: "#sajil",       label: "What we do" },
              { href: "#uncertainty", label: "Demo" },
              { href: "#contact",     label: "Contact" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-950"
              >
                {label}
              </a>
            ))}
          </nav>
          <Link
            href={routes.doctorDashboard}
            className="rounded-app border border-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-950 hover:text-white"
          >
            Open workspace →
          </Link>
        </div>
      </header>

      <main>

        {/* ── 1. HERO ── */}
        <section className="flex min-h-[88vh] flex-col items-start justify-center px-6 py-20">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex items-start justify-between gap-12">
              <div className="max-w-2xl">
                <div className="mb-10 h-px w-10 bg-accent-500" />
                <p className="sajil-wordmark text-6xl text-zinc-950 sm:text-8xl">SAJIL</p>
                <h1 className="mt-6 max-w-xl text-2xl font-medium leading-snug text-zinc-950 sm:text-3xl">
                  From Arabic consultation<br />to physician-approved note.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-zinc-500">
                  Sajil listens to Arabic clinical consultations, drafts a structured SOAP
                  note, flags uncertain terms like{" "}
                  <span
                    className="font-medium text-zinc-950"
                    dir="rtl"
                    style={{ borderBottom: "2px solid #fa2a55" }}
                  >
                    كتمة
                  </span>
                  , and keeps the physician firmly in control.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href={routes.doctorDashboard}
                    className="inline-flex h-11 items-center gap-2 rounded-app bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-accent-500"
                  >
                    Open demo workspace
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a
                    href="#uncertainty"
                    className="text-sm text-zinc-400 transition-colors hover:text-zinc-950"
                  >
                    See the demo ↓
                  </a>
                </div>
              </div>

              {/* Falcon */}
              <div className="hidden flex-shrink-0 lg:block">
                <Image
                  src="/mascot.png"
                  alt=""
                  aria-hidden="true"
                  width={130}
                  height={130}
                  className="bird-idle select-none grayscale opacity-50"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. PROBLEM ── */}
        <section id="problem" className="border-t border-zinc-100 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              The problem
            </p>
            <h2 className="mt-4 max-w-lg text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
              Doctors are drowning in notes.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
              Consultations are slowed down by documentation, tedious systems, and repeated
              note cleanup. At scale, this becomes a burden on doctors, patients, and the
              healthcare system.
            </p>
            <div className="mt-12 grid gap-px border border-zinc-100 bg-zinc-100 sm:grid-cols-3">
              {[
                { stat: "20–40 min", label: "Spent on documentation per consultation" },
                { stat: "كتمة",      label: "One ambiguous word that can change a diagnosis", rtl: true },
                { stat: "0",         label: "Arabic-first clinical AI products built for the Gulf" },
              ].map(({ stat, label, rtl }) => (
                <div key={stat} className="bg-white px-6 py-8">
                  <p
                    className="text-3xl font-medium text-zinc-950"
                    dir={rtl ? "rtl" : "ltr"}
                  >
                    {stat}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. WHAT AI SCRIBES DO NOW ── */}
        <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              The current state
            </p>
            <h2 className="mt-4 max-w-lg text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
              AI scribes already exist.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
              AI scribes can record consultations, transcribe speech, and generate notes.
              That is useful — but in healthcare, writing a note is not enough.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-zinc-200" />
              <p className="text-sm text-zinc-400">But there is a problem.</p>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>
          </div>
        </section>

        {/* ── 4. WHY THEY ARE RISKY ── */}
        <section className="border-t border-zinc-100 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              The risk
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-medium leading-tight text-zinc-950 sm:text-5xl">
              AI should know when to say:{" "}
              <span className="relative inline-block whitespace-nowrap">
                <em className="not-italic">&ldquo;I am not sure.&rdquo;</em>
                <span
                  className="absolute -right-4 top-0 text-xl text-accent-500"
                  aria-hidden="true"
                >
                  ※
                </span>
              </span>
            </h2>
            <p className="mt-8 max-w-xl text-base leading-7 text-zinc-500">
              Medical notes are high-stakes. A confident mistake in a multilingual
              consultation can become a clinical risk.
            </p>
            <div className="mt-10 border-l-2 border-accent-500 pl-6">
              <p className="max-w-xl text-sm leading-7 text-zinc-500">
                When an AI scribe transcribes{" "}
                <span className="font-semibold text-zinc-950" dir="rtl">كتمة</span>{" "}
                as &ldquo;chest tightness&rdquo; with no flag, no question, and no physician
                review — the doctor signs a note they didn&apos;t fully verify.
              </p>
              <p className="mt-3 text-sm font-medium text-accent-500">
                That is how documentation errors enter the clinical record.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. WHY ARABIC IS HARDER ── */}
        <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              The Arabic challenge
            </p>
            <h2 className="mt-4 max-w-lg text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
              Gulf Arabic is not just another language.
            </h2>
            <div className="mt-10 max-w-xl rounded-lg border border-zinc-200 bg-white p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Patient says
              </p>
              <p className="arabic-text mt-3 text-2xl leading-loose text-zinc-950">
                دكتور عندي{" "}
                <span style={{ borderBottom: "2px solid #fa2a55" }}>كتمة</span>{" "}
                من أمس
              </p>
              <div className="mt-6 border-t border-zinc-100 pt-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  كتمة may mean
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Chest tightness", "Shortness of breath", "Both"].map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  The right interpretation changes the assessment and possibly the
                  clinical plan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. WHAT SAJIL BRINGS ── */}
        <section id="sajil" className="border-t border-zinc-100 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              What Sajil brings
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
              Control builds trust.<br />
              Uncertainty makes Sajil different.
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {[
                {
                  label: "Arabic-first",
                  body:  "Powered by Fanar. Built for Gulf, Levantine, Egyptian, and MSA — including code-switching and dialect-heavy consultations.",
                },
                {
                  label:  "Uncertainty",
                  body:   "Highlights unclear phrases, weak evidence, missing details, and risky assumptions before the physician approves.",
                  accent: true,
                },
                {
                  label: "Control",
                  body:  "The doctor confirms, edits, rejects, and approves. Nothing enters the record without physician sign-off.",
                },
                {
                  label: "Privacy",
                  body:  "Consent-first, minimal storage, secure handling, and Qatar-local deployment direction.",
                },
              ].map(({ label, body, accent }) => (
                <div key={label} className="border-t-2 border-zinc-950 pt-5">
                  <p
                    className={`text-sm font-semibold ${
                      accent ? "text-accent-500" : "text-zinc-950"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. FEATURE BENTO ── */}
        <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Features
            </p>
            <h2 className="mt-4 text-2xl font-medium text-zinc-950 sm:text-3xl">
              Built for the clinical workflow.
            </h2>
            <div className="mt-10 grid gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Arabic + dialect-aware",
                  body:  "Gulf, Levantine, Egyptian, MSA. Handles code-switching naturally.",
                },
                {
                  title:  "Uncertainty lens",
                  body:   "Flags every term the model isn't confident about, with clinical reasoning.",
                  accent: true,
                },
                {
                  title: "Physician checkpoints",
                  body:  "One clear question at a time. No cognitive overload.",
                },
                {
                  title: "Editable SOAP note",
                  body:  "Every section is reviewable and editable before physician approval.",
                },
                {
                  title: "Clinical copilot",
                  body:  "Ask Sajil about the note, the evidence, or the next clinical step.",
                },
                {
                  title: "Tool calling",
                  body:  "Red-flag detection. Checklist completeness. Evidence linking.",
                },
                {
                  title: "Privacy modes",
                  body:  "Consent-first. Prototype, clinical, and de-identification modes.",
                },
                {
                  title: "Patient instructions",
                  body:  "Arabic discharge notes generated from the physician-approved SOAP.",
                },
                {
                  title:  "Pre-consultation intake",
                  body:   "Coming. Fanar speaks with patients before the visit.",
                  muted:  true,
                  wide:   true,
                },
              ].map(({ title, body, accent, muted, wide }) => (
                <div
                  key={title}
                  className={`bg-white px-5 py-6 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}
                >
                  {accent && (
                    <span className="mb-2 inline-block h-0.5 w-4 bg-accent-500" />
                  )}
                  <p
                    className={`text-sm font-semibold ${
                      muted ? "text-zinc-400" : "text-zinc-950"
                    }`}
                  >
                    {title}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. UNCERTAINTY DEMO ── */}
        <section id="uncertainty" className="border-t border-zinc-100 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Interactive demo
                </p>
                <h2 className="mt-4 text-3xl font-medium leading-tight text-zinc-950">
                  Try the uncertainty moment.
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-500">
                  Step through how Sajil catches an ambiguous Arabic term and routes it
                  to the physician before the note is finalised.
                </p>
                <div className="mt-8 space-y-3 border-l-2 border-zinc-100 pl-5">
                  {[
                    "Patient phrase appears",
                    "Sajil transcribes with uncertainty highlight",
                    "SOAP claim is generated",
                    "Physician selects the correct meaning",
                    "Note is updated",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-3 text-right text-[10px] tabular-nums text-zinc-300">
                        {i + 1}
                      </span>
                      <span className="text-sm text-zinc-500">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <UncertaintyDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. CLINICAL COPILOT ── */}
        <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Clinical copilot
            </p>
            <h2 className="mt-4 max-w-lg text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
              Sajil calls the right tool at the right moment.
            </h2>
            <div className="mt-12 divide-y divide-zinc-200 border-y border-zinc-200">
              {[
                {
                  type:  "Detection",
                  title: "Respiratory complaint detected",
                  body:  "Sajil identifies a respiratory complaint from the transcript and queues tool execution.",
                  dot:   false,
                },
                {
                  type:  "Tool call",
                  title: "Red-flag checklist called",
                  body:  "Sajil runs the respiratory red-flag checklist against the current SOAP note.",
                  dot:   true,
                },
                {
                  type:  "Finding",
                  title: "Missing: SpO2 · wheezing · fever · allergy status",
                  body:  "Four critical data points are absent from the note. Sajil logs them as incomplete.",
                  dot:   true,
                },
                {
                  type:  "Action",
                  title: "Physician checkpoint created",
                  body:  "One checkpoint question surfaces for the physician. No information overload.",
                  dot:   false,
                },
              ].map(({ type, title, body, dot }) => (
                <div key={title} className="flex gap-5 py-6">
                  <div className="mt-1.5 flex-shrink-0">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        dot ? "bg-accent-500" : "bg-zinc-300"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      {type}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-950">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. FUTURE PRE-CONSULTATION ── */}
        <section className="border-t border-zinc-100 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              What&apos;s next
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
              The patient arrives prepared.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
              Next, Sajil supports pre-consultation intake. Fanar speaks with patients before
              the visit, collects symptoms, asks basic follow-up questions, and prepares a
              structured summary for the physician — before the appointment starts.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-0">
              {[
                "Patient call",
                "Symptom collection",
                "Pre-visit summary",
                "Doctor opens Sajil prepared",
              ].map((step, i, arr) => (
                <div key={step} className="flex items-center">
                  <div className="rounded-app border border-zinc-200 bg-white px-4 py-2.5">
                    <p className="text-sm text-zinc-700">{step}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="px-2 text-sm text-zinc-300">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 11. MARKET CONTEXT ── */}
        <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Market context
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
              The global need is proven.<br />The Arabic layer is missing.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
              Global AI scribes — Nuance DAX, Nabla, Abridge — prove that clinical
              documentation automation works. Sajil focuses on the Arabic trust layer:
              dialect-aware understanding, uncertainty flagging, physician checkpoints,
              and local privacy.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { label: "Dialect-aware", body: "Built on Fanar, trained on Arabic." },
                { label: "Uncertainty-first", body: "Not just a note writer. A clinical safety layer." },
                { label: "Qatar-local", body: "Privacy and deployment designed for the Gulf." },
              ].map(({ label, body }) => (
                <div key={label} className="border-l border-zinc-200 pl-4">
                  <p className="text-sm font-semibold text-zinc-950">{label}</p>
                  <p className="mt-1 text-sm text-zinc-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12. SUPPORT US ── */}
        <section id="contact" className="border-t border-zinc-100 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-xl">
              <div className="mb-10 h-px w-10 bg-accent-500" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Support us
              </p>
              <h2 className="mt-4 text-3xl font-medium leading-tight text-zinc-950 sm:text-4xl">
                Help us build safer Arabic clinical AI.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-500">
                We are looking for clinicians, researchers, Arabic speakers, healthcare
                engineers, and AI builders to help test Sajil across dialects, workflows,
                and real clinical needs.
              </p>
              <p className="mt-8 text-sm text-zinc-400">Want to help?</p>
              <a
                href="mailto:hussainak2005@gmail.com"
                className="mt-2 inline-block border-b border-zinc-950 text-base font-medium text-zinc-950 transition-colors hover:border-accent-500 hover:text-accent-500"
              >
                hussainak2005@gmail.com
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <span className="sajil-wordmark text-sm text-zinc-300">SAJIL</span>
          <p className="text-xs text-zinc-400">
            Built for Fanar Hackathon 2026 · Powered by{" "}
            <span className="font-medium text-zinc-600">Fanar AI</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
