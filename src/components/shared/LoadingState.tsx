import { Loader2 } from "lucide-react";
import { SoftPanel } from "./SoftPanel";

export function LoadingState({ label = "Loading clinical page" }: { label?: string }) {
  return (
    <SoftPanel className="flex min-h-48 items-center justify-center gap-3 p-8 text-sm font-semibold text-slate-500" tone="mist">
      <Loader2 className="h-5 w-5 animate-spin text-cyan-500" aria-hidden="true" />
      {label}
    </SoftPanel>
  );
}
