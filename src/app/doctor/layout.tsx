import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
