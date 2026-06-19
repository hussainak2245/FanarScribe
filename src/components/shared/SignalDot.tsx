import { cn } from "@/lib/utils/cn";

type SignalDotTone = "teal" | "cyan" | "coral" | "magenta" | "gold" | "ruby" | "slate";

const tones: Record<SignalDotTone, string> = {
  teal: "bg-accent-500",
  cyan: "bg-accent-400",
  coral: "bg-accent-300",
  magenta: "bg-accent-500",
  gold: "bg-gold-400",
  ruby: "bg-ruby-500",
  slate: "bg-zinc-400"
};

export function SignalDot({ tone = "teal", pulse = false }: { tone?: SignalDotTone; pulse?: boolean }) {
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", tones[tone], pulse && "animate-pulse")} />;
}
