import { FileQuestion } from "lucide-react";
import { SoftPanel } from "./SoftPanel";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <SoftPanel className="flex min-h-48 flex-col items-center justify-center p-8 text-center" tone="mist">
      <FileQuestion className="mb-3 h-8 w-8 text-magenta-400" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{body}</p>
    </SoftPanel>
  );
}
