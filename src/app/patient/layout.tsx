import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PatientTopNav } from "@/components/layout/PatientTopNav";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <PatientTopNav />
      {children}
    </AppShell>
  );
}
