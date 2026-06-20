import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-4xl items-center gap-12 lg:gap-20">

          {/* Hero text */}
          <section className="flex-1">
            <p className="sajil-wordmark text-4xl text-zinc-950 sm:text-6xl">SAJIL</p>
            <h1 className="mt-8 max-w-2xl text-3xl font-medium leading-tight text-zinc-950 sm:text-5xl">
              A physician-in-the-loop copilot for Arabic consultations.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">
              SAJIL drafts the note, highlights uncertainty, and keeps final review in the physician&apos;s hands.
            </p>
            <Link
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-app bg-accent-500 px-4 text-sm font-medium text-white hover:bg-accent-600"
              href={routes.consultation("E001")}
            >
              Open scribe
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          {/* Mascot — desktop: right column; mobile: hidden (keeps CTA clean) */}
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
      </main>
    </AppShell>
  );
}
