import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LandingTryIt } from "@/features/landing/LandingTryIt";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <AppShell>
      <main>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="flex min-h-[90vh] items-center justify-center px-6 py-20">
          <div className="flex w-full max-w-4xl items-center gap-12 lg:gap-20">
            <div className="flex-1">
              <p className="sajil-wordmark text-4xl text-zinc-950 sm:text-6xl">SAJIL</p>
              <h1 className="mt-8 max-w-2xl text-3xl font-medium leading-tight text-zinc-950 sm:text-5xl">
                A physician-in-the-loop copilot for Arabic consultations.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
                SAJIL listens to Arabic clinical consultations, drafts a structured SOAP note, flags
                uncertain terms like <span className="font-semibold text-zinc-900">كتمة</span>, and
                keeps the physician firmly in control of the final record.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex h-11 items-center gap-2 rounded-app bg-accent-500 px-5 text-sm font-medium text-white hover:bg-accent-600"
                  href={routes.doctorDashboard}
                >
                  Open demo workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#try-it"
                  className="inline-flex h-11 items-center gap-2 rounded-app border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Try it here
                </a>
              </div>
            </div>
            <div className="hidden flex-shrink-0 lg:flex lg:flex-col lg:items-center">
              <Image
                src="/mascot.png"
                alt=""
                aria-hidden="true"
                width={160}
                height={160}
                className="bird-idle rounded-3xl select-none"
                priority
              />
            </div>
          </div>
        </section>

        {/* ── Problem ────────────────────────────────────────────── */}
        <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-widest text-magenta-500">The problem</p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Gulf Arabic is not just another language.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">
              Physicians in Qatar and the Gulf see patients who describe symptoms in rich dialectal
              Arabic that no existing scribe handles correctly. The word{" "}
              <span className="font-semibold text-zinc-900">كتمة</span> alone can mean chest
              tightness, breathlessness, or both — and the wrong interpretation can change a
              diagnosis.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { stat: "20–40 min", label: "Average time spent on documentation per consultation" },
                { stat: "كتمة", label: "A single ambiguous word that trained scrbes miss" },
                { stat: "0", label: "Arabic-first clinical AI products built for the Gulf" },
              ].map(({ stat, label }) => (
                <div key={stat} className="rounded-xl border border-zinc-200 bg-white p-5">
                  <p className="text-3xl font-black text-zinc-950">{stat}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── كتمة moment ────────────────────────────────────────── */}
        <section className="border-t border-zinc-100 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-widest text-magenta-500">Uncertainty detection</p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              SAJIL flags what it doesn&apos;t know.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">
              When the system encounters an ambiguous term it colour-codes the span, lists its
              possible clinical meanings, and generates a targeted physician question — before the
              note is ever finalised.
            </p>
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 font-mono text-sm leading-8 text-zinc-700 sm:text-base">
              <p>
                مريض:{" "}
                <span className="rounded bg-amber-100 px-1 text-amber-800 font-semibold ring-1 ring-amber-300">
                  كتمة
                </span>{" "}
                من أمس وما قدرت أنام.
              </p>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 font-sans text-xs text-amber-900">
                <p className="font-semibold">⚠ Uncertain term detected — risk: high</p>
                <p className="mt-1">
                  <span className="font-medium">Possible meanings:</span> chest tightness · shortness
                  of breath · both
                </p>
                <p className="mt-1">
                  <span className="font-medium">Physician question:</span> هل تشعر بضيق في التنفس أم
                  ثقل في الصدر؟
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Try it ─────────────────────────────────────────────── */}
        <section id="try-it" className="border-t border-zinc-100 bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-widest text-magenta-500">Live demo</p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Try SAJIL now.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
              Paste an Arabic (or English) clinical transcript below. SAJIL will generate a structured
              SOAP note and flag uncertain terms in seconds.
            </p>
            <div className="mt-8">
              <LandingTryIt />
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-zinc-100 px-6 py-10 text-center text-sm text-zinc-400">
          Built for the{" "}
          <span className="font-medium text-zinc-600">Fanar Hackathon 2026</span> · SAJIL by
          FanarScribe · Powered by{" "}
          <span className="font-medium text-zinc-600">Fanar AI</span>
        </footer>

      </main>
    </AppShell>
  );
}
