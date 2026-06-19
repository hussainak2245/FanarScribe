import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/types/appointment";
import type { ComponentProps } from "react";

const appointmentTone: Record<AppointmentStatus, ComponentProps<typeof Badge>["tone"]> = {
  "pre-consultation available": "mist",
  "follow-up": "mist",
  "pending note": "gold",
  "urgent flag": "ruby",
  ready: "mist"
};

const appointmentLabel: Record<AppointmentStatus, string> = {
  "pre-consultation available": "Pre-consultation available",
  "follow-up": "Follow-up",
  "pending note": "Pending note",
  "urgent flag": "Urgent flag",
  ready: "Ready"
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={appointmentTone[status]}>{appointmentLabel[status]}</Badge>;
}
