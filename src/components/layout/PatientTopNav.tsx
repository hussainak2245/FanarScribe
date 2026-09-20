import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { routes } from "@/lib/constants/routes";

export function PatientTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="flex items-center gap-2 text-zinc-950" href={routes.patientIntake("A001")} aria-label="Sajil intake">
          <img className="h-7 w-7 rounded-lg object-contain" src="/images/sajil-logo.png" alt="" aria-hidden="true" />
          <span className="sajil-wordmark text-xl">SAJIL</span>
        </Link>
        <div className="flex items-center gap-2 rounded-app border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600">
          <ShieldCheck className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          Consent aware
        </div>
      </div>
    </header>
  );
}
