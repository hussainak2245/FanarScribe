import { SoftPanel } from "@/components/shared/SoftPanel";
import { DoctorGreeting } from "./DoctorGreeting";
import { PatientSearch } from "./PatientSearch";

export function DashboardHero() {
  return (
    <SoftPanel className="overflow-hidden p-5 sm:p-7" tone="cloud">
      <div className="space-y-6">
        <DoctorGreeting />
        <PatientSearch />
      </div>
    </SoftPanel>
  );
}
