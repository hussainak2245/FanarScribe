import type { ReactNode } from "react";
import { CloudBackground } from "./CloudBackground";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <CloudBackground />
      <div className="min-h-screen">{children}</div>
    </>
  );
}
