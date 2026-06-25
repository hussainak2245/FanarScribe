import { arabicGreeting } from "@/lib/utils/arabic";

export function DoctorGreeting() {
  return (
    <div>
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">{arabicGreeting()} / Good morning</p>
      <h2 className="mt-2 text-3xl font-black leading-tight text-zinc-950 sm:text-5xl">Dr. Aisha</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
        Consultations, scribe notes, and clinical copilot — all in one place.
      </p>
    </div>
  );
}
