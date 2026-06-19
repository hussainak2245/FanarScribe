import * as React from "react";
import { cn } from "@/lib/utils/cn";

type SoftPanelTone = "paper" | "cloud" | "mist" | "plum" | "transparent";

const tones: Record<SoftPanelTone, string> = {
  paper: "bg-white border-zinc-200",
  cloud: "bg-white border-zinc-200",
  mist: "bg-white border-zinc-200",
  plum: "bg-zinc-950 text-white border-zinc-800",
  transparent: "bg-white border-zinc-200"
};

export function SoftPanel({
  className,
  tone = "paper",
  as: Component = "section",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  tone?: SoftPanelTone;
  as?: "section" | "article" | "aside" | "div" | "header";
}) {
  return <Component className={cn("rounded-app border", tones[tone], className)} {...props} />;
}
