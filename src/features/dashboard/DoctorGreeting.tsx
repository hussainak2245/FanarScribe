import { arabicGreeting } from "@/lib/utils/arabic";

export function DoctorGreeting() {
  return (
    <div>
      <p className="text-sm font-bold text-magenta-500">{arabicGreeting()} / Good morning</p>
      <h2 className="mt-2 text-3xl font-black leading-tight text-navy-900 sm:text-5xl">Dr. Aisha</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
        The day opens as a living manuscript: pre-visit signals, note risk, and patient context in one calm flow.
      </p>
    </div>
  );
}
