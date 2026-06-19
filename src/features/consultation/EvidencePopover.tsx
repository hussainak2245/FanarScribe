import { EvidenceLink } from "@/features/uncertainty/EvidenceLink";

export function EvidencePopover({ evidence }: { evidence?: string }) {
  return <EvidenceLink evidence={evidence} />;
}
