import * as React from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "teal" | "cyan" | "coral" | "magenta" | "plum" | "gold" | "ruby" | "mist";

const tones: Record<BadgeTone, string> = {
  teal: "bg-accent-50 text-accent-600 ring-accent-100",
  cyan: "bg-accent-50 text-accent-600 ring-accent-100",
  coral: "bg-accent-50 text-accent-600 ring-accent-100",
  magenta: "bg-accent-50 text-accent-600 ring-accent-100",
  plum: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  gold: "bg-gold-400/20 text-gold-500 ring-gold-400/20",
  ruby: "bg-ruby-500/10 text-ruby-500 ring-ruby-500/20",
  mist: "bg-zinc-100 text-zinc-600 ring-zinc-200"
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "mist", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-app px-2.5 py-1 text-xs font-medium ring-1",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
