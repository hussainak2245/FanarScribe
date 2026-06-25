"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { listEncounters, deleteEncounter } from "@/lib/supabase/sajil";

type Encounter = {
  id: string;
  patient_record_number: string;
  status: string;
  summary: string | null;
  consultation_time: string;
  dialect_hint: string | null;
};

const DIALECT_LABELS: Record<string, string> = {
  gulf: "Gulf",
  levantine: "Levantine",
  egyptian: "Egyptian",
  msa: "MSA",
};

function statusStyle(status: string) {
  if (status === "finalized") return "bg-zinc-950 text-white";
  if (status === "review") return "border-2 border-zinc-950 text-zinc-950 bg-white";
  return "border border-zinc-300 text-zinc-500 bg-white";
}

export function NoteHistory() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await listEncounters();
    setEncounters((data as Encounter[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteEncounter(id);
    setEncounters((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">Notes</p>
        <h2 className="mt-1 text-2xl font-black text-zinc-950">Session history</h2>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse border border-zinc-100 bg-zinc-50" />
          ))}
        </div>
      </div>
    );
  }

  if (encounters.length === 0) {
    return (
      <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">Notes</p>
        <h2 className="mt-1 text-2xl font-black text-zinc-950">Session history</h2>
        <p className="mt-4 border border-zinc-200 p-4 font-mono text-sm text-zinc-500">
          No saved notes yet. Open the scribe and process a consultation to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-zinc-950 pb-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">Notes</p>
          <h2 className="mt-0.5 text-2xl font-black text-zinc-950">Session history</h2>
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
          {encounters.length} saved
        </p>
      </div>

      <div className="divide-y divide-zinc-100">
        {encounters.map((enc) => {
          const date = new Date(enc.consultation_time);
          const dateStr = date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          const dialectLabel = DIALECT_LABELS[enc.dialect_hint ?? ""] ?? enc.dialect_hint ?? "—";

          return (
            <div
              key={enc.id}
              className="group flex items-center gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-bold text-zinc-950">
                    {enc.patient_record_number}
                  </p>
                  <span className={`px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${statusStyle(enc.status)}`}>
                    {enc.status}
                  </span>
                  <span className="border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] uppercase text-zinc-400">
                    {dialectLabel}
                  </span>
                </div>
                {enc.summary && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{enc.summary}</p>
                )}
                <p className="mt-0.5 font-mono text-[10px] text-zinc-400">{dateStr}</p>
              </div>

              <Link
                href={routes.finalReview(enc.id)}
                className="shrink-0 border border-zinc-200 px-2 py-1.5 font-mono text-[10px] font-bold uppercase text-zinc-600 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
                title="Open results"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <Link
                href={routes.consultation(enc.id)}
                className="shrink-0 border border-zinc-200 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase text-zinc-600 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
                title="Reopen scribe"
              >
                Open
              </Link>

              <button
                onClick={() => handleDelete(enc.id)}
                disabled={deletingId === enc.id}
                className="shrink-0 p-1.5 text-zinc-300 hover:text-red-600 disabled:opacity-40"
                title="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
