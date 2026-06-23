import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DoctorTopNav } from "@/components/layout/DoctorTopNav";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <DoctorTopNav />
      {children}
    </AppShell>
  );
}
