"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";

export function PatientSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function openNewNote() {
    const mrn = inputRef.current?.value.trim() || "P023";
    const encounterId = `${mrn}-${Date.now()}`;
    router.push(routes.consultation(encounterId));
  }

  return (
    <form
      className="grid gap-3 rounded-md border border-white/70 bg-white/60 p-3 shadow-sm sm:grid-cols-[1fr_auto]"
      onSubmit={(e) => { e.preventDefault(); openNewNote(); }}
    >
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input ref={inputRef} className="pl-9 placeholder:text-zinc-400" placeholder="Enter patient ID" defaultValue="" />
      </label>
      <button type="submit" className={buttonVariants({ variant: "primary" })}>
        New Note
      </button>
    </form>
  );
}
