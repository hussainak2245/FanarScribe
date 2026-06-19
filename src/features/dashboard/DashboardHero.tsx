import { CalendarCheck, Mic2, Sparkles } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { SignalDot } from "@/components/shared/SignalDot";
import { DoctorGreeting } from "./DoctorGreeting";
import { PatientSearch } from "./PatientSearch";

export function DashboardHero({ appointmentCount }: { appointmentCount: number }) {
  return (
    <SoftPanel className="overflow-hidden p-5 sm:p-7" tone="cloud">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="space-y-8">
          <DoctorGreeting />
          <PatientSearch />
        </div>
        <div className="rounded-app border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-950">Today’s scribe surface</p>
            <SignalDot tone="cyan" pulse />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-app bg-zinc-50 p-3">
              <CalendarCheck className="h-5 w-5 text-accent-500" aria-hidden="true" />
              <p className="mt-4 text-2xl font-medium text-zinc-950">{appointmentCount}</p>
              <p className="text-xs font-medium text-zinc-500">Appointments</p>
            </div>
            <div className="rounded-app bg-zinc-50 p-3">
              <Sparkles className="h-5 w-5 text-accent-500" aria-hidden="true" />
              <p className="mt-4 text-2xl font-medium text-zinc-950">7</p>
              <p className="text-xs font-medium text-zinc-500">Signals</p>
            </div>
            <div className="rounded-app bg-zinc-50 p-3">
              <Mic2 className="h-5 w-5 text-accent-500" aria-hidden="true" />
              <p className="mt-4 text-2xl font-medium text-zinc-950">3</p>
              <p className="text-xs font-medium text-zinc-500">Ready</p>
            </div>
          </div>
        </div>
      </div>
    </SoftPanel>
  );
}
