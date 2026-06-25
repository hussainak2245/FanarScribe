"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { listEncounters, deleteEncounter } from "@/lib/supabase/sajil";
import { SoftPanel } from "@/components/shared/SoftPanel";

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

export function NoteHistory() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listEncounters();
    if (error) {
      console.error("[NoteHistory] listEncounters error:", error);
      setLoadError(error);
    }
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
      <SoftPanel className="p-4 sm:p-5" tone="paper">
        <p className="text-xs font-black uppercase text-magenta-500">Notes</p>
        <h2 className="mt-1 text-2xl font-black text-navy-900">Session history</h2>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </SoftPanel>
    );
  }

  if (encounters.length === 0) {
    return (
      <SoftPanel className="p-4 sm:p-5" tone="paper">
        <p className="text-xs font-black uppercase text-magenta-500">Notes</p>
        <h2 className="mt-1 text-2xl font-black text-navy-900">Session history</h2>
        {loadError ? (
          <p className="mt-4 text-sm text-red-500">Could not load notes: {loadError}</p>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            No saved notes yet. Open the scribe and process a consultation to see it here.
          </p>
        )}
      </SoftPanel>
    );
  }

  return (
    <SoftPanel className="p-4 sm:p-5" tone="paper">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-magenta-500">Notes</p>
          <h2 className="mt-1 text-2xl font-black text-navy-900">Session history</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">{encounters.length} saved</p>
      </div>

      <div className="space-y-2">
        {encounters.map((enc) => {
          const date = new Date(enc.consultation_time);
          const dateStr = date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          const dialectLabel = DIALECT_LABELS[enc.dialect_hint ?? ""] ?? enc.dialect_hint;

          return (
            <div
              key={enc.id}
              className="group flex items-center gap-3 rounded-lg border border-zinc-100 bg-white p-3 transition-shadow hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {enc.patient_record_number}
                  </p>
                  {dialectLabel && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      {dialectLabel}
                    </span>
                  )}
                </div>
                {enc.summary && (
                  <p className="truncate text-xs text-zinc-500">{enc.summary}</p>
                )}
                <p className="mt-0.5 text-xs text-zinc-400">{dateStr}</p>
              </div>

              <span
                className={
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " +
                  (enc.status === "finalized"
                    ? "bg-emerald-50 text-emerald-700"
                    : enc.status === "review"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-zinc-100 text-zinc-500")
                }
              >
                {enc.status}
              </span>

              <Link
                href={routes.finalReview(enc.id)}
                className="shrink-0 rounded p-1 text-zinc-400 hover:text-accent-600"
                title="Open results"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>

              <Link
                href={routes.consultation(enc.id)}
                className="shrink-0 rounded p-1 text-zinc-400 hover:text-zinc-700"
                title="Reopen note"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>

              <button
                onClick={() => handleDelete(enc.id)}
                disabled={deletingId === enc.id}
                className="shrink-0 rounded p-1 text-zinc-300 hover:text-red-500 disabled:opacity-40"
                title="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </SoftPanel>
  );
}
