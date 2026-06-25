import { CalendarCheck, Mic2, Sparkles } from "lucide-react";
import { DoctorGreeting } from "./DoctorGreeting";
import { PatientSearch } from "./PatientSearch";

export function DashboardHero({
  appointmentCount,
  signals = 0,
  notesReady = 0
}: {
  appointmentCount: number;
  signals?: number;
  notesReady?: number;
}) {
  return (
    <div className="border-2 border-zinc-950 bg-white p-5 sm:p-7">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="space-y-6">
          <DoctorGreeting />
          <PatientSearch />
        </div>
        <div className="border-2 border-zinc-950 p-4">
          <div className="mb-3 border-b-2 border-zinc-950 pb-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">Today&apos;s surface</p>
          </div>
          <div className="grid grid-cols-3 divide-x-2 divide-zinc-950">
            <div className="pr-3">
              <CalendarCheck className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              <p className="mt-3 text-3xl font-black text-zinc-950">{appointmentCount}</p>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">Visits</p>
            </div>
            <div className="px-3">
              <Sparkles className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              <p className="mt-3 text-3xl font-black text-zinc-950">{signals}</p>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">Signals</p>
            </div>
            <div className="pl-3">
              <Mic2 className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              <p className="mt-3 text-3xl font-black text-zinc-950">{notesReady}</p>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
