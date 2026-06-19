import type { ComponentProps } from "react";
import { statusLabel } from "@/lib/utils/confidence";
import { Badge } from "@/components/ui/badge";
import type { UncertaintyStatus } from "@/types/uncertainty";

const statusTone: Record<UncertaintyStatus, ComponentProps<typeof Badge>["tone"]> = {
  confirmed: "teal",
  likely: "cyan",
  unclear: "magenta",
  inferred: "gold",
  missing: "ruby",
  unsupported: "ruby",
  physician_required: "magenta"
};

export function UncertaintyTag({ status }: { status: UncertaintyStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel(status)}</Badge>;
}
