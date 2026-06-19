import { Network } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { ClinicalSignalNode } from "./ClinicalSignalNode";

export function ClinicalConstellationPanel() {
  return (
    <SoftPanel className="p-4" tone="plum">
      <div className="mb-4 flex items-center gap-2">
        <Network className="h-4 w-4 text-cyan-400" aria-hidden="true" />
        <h3 className="text-lg font-black">Clinical constellation</h3>
      </div>
      <div className="grid gap-2">
        <ClinicalSignalNode label="Symptom" value="كتمة + cough" tone="magenta" />
        <ClinicalSignalNode label="Context" value="Mild asthma + diabetes" tone="cyan" />
        <ClinicalSignalNode label="Missing" value="SpO2, chest exam" tone="gold" />
        <ClinicalSignalNode label="Safety" value="Respiratory escalation screen" tone="ruby" />
      </div>
    </SoftPanel>
  );
}
