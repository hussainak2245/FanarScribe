import { Siren } from "lucide-react";
import { FloatingPrompt } from "@/components/shared/FloatingPrompt";

export function SafetyAlertCard() {
  return (
    <FloatingPrompt tone="gold">
      <span className="flex items-center gap-2 font-semibold text-navy-900">
        <Siren className="h-4 w-4 text-ruby-500" aria-hidden="true" />
        Respiratory complaint detected; ask about SpO2 and wheezing.
      </span>
    </FloatingPrompt>
  );
}
