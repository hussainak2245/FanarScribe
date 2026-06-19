import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <section className="w-full max-w-3xl">
          <p className="sajil-wordmark text-4xl text-zinc-950 sm:text-6xl">SAJIL</p>
          <h1 className="mt-8 max-w-2xl text-3xl font-medium leading-tight text-zinc-950 sm:text-5xl">
            Minimal clinical scribing for Arabic consultations.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">
            Record or upload a consultation, generate a SOAP note, and review uncertainty without leaving the document.
          </p>
          <Link
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-app bg-accent-500 px-4 text-sm font-medium text-white hover:bg-accent-600"
            href={routes.consultation("E001")}
          >
            Open scribe
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
