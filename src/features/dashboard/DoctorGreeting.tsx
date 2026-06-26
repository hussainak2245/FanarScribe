import { arabicGreeting } from "@/lib/utils/arabic";

export function DoctorGreeting() {
  return (
    <div>
      <p className="text-sm font-bold text-magenta-500">{arabicGreeting()} / Good morning</p>
      <h2 className="mt-2 text-3xl font-black leading-tight text-navy-900 sm:text-5xl">Dr. Aisha</h2>
    </div>
  );
}
