"use client";

import { use, useEffect, useRef, useState } from "react";
import { Check, Clipboard, Download, Pencil } from "lucide-react";
import { getLatestScribeRun, updateScribeRunSoapNote } from "@/lib/supabase/sajil";

type SoapSections = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

const SOAP_ORDER = ["subjective", "objective", "assessment", "plan"] as const;

const SOAP_LABELS: Record<typeof SOAP_ORDER[number], string> = {
  subjective: "Subjective",
  objective: "Objective",
  assessment: "Assessment",
  plan: "Plan",
};

function extractText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(extractText).filter(Boolean).join("\n");
  if (typeof v === "object") {
    const r = v as Record<string, unknown>;
    for (const k of ["cleaned_text", "text", "content", "summary", "note", "value"]) {
      if (typeof r[k] === "string") return r[k] as string;
    }
    return Object.values(r).map(extractText).filter(Boolean).join("\n");
  }
  return String(v);
}

function parseSoapNote(raw: unknown): SoapSections {
  if (!raw) return { subjective: "", objective: "", assessment: "", plan: "" };
  const obj = raw as Record<string, unknown>;
  const src = obj.sections && typeof obj.sections === "object"
    ? (obj.sections as Record<string, unknown>)
    : obj;
  return {
    subjective: extractText(src.subjective),
    objective: extractText(src.objective),
    assessment: extractText(src.assessment),
    plan: extractText(src.plan),
  };
}

function Tooltip({ children }: { children: string }) {
  return (
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
      {children}
    </span>
  );
}

export default function FinalReviewPage({
  params,
}: {
  params: Promise<{ encounterId: string }>;
}) {
  const { encounterId } = use(params);
  const [sections, setSections] = useState<SoapSections | null>(null);
  const [runId, setRunId] = useState<string | undefined>();
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedSections, setEditedSections] = useState<SoapSections>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await getLatestScribeRun(encounterId);
      if (!active) return;
      if (error || !data) {
        setFetchError(error ?? "No completed scribe run found for this encounter.");
        setLoading(false);
        return;
      }
      const parsed = parseSoapNote(data.soap_note);
      setSections(parsed);
      setEditedSections(parsed);
      setRunId(data.id);
      setCreatedAt(data.created_at);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [encounterId]);

  function startEdit() {
    setEditedSections({ ...sections! });
    setIsEditing(true);
  }

  async function saveEdit() {
    setIsSaving(true);
    const next = { ...editedSections };
    if (runId) {
      await updateScribeRunSoapNote(runId, next);
    }
    setSections(next);
    setIsEditing(false);
    setIsSaving(false);
  }

  async function handleDownloadPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const contentW = pageW - margin * 2;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SOAP Note", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(`Encounter: ${encounterId}`, margin, y);
    y += 5;
    if (createdAt) {
      doc.text(`Date: ${new Date(createdAt).toLocaleDateString()}`, margin, y);
      y += 5;
    }
    doc.setTextColor(0, 0, 0);
    y += 6;

    for (const key of SOAP_ORDER) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(SOAP_LABELS[key].toUpperCase(), margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const text = sections![key] || "Not provided";
      const lines = doc.splitTextToSize(text, contentW);

      if (y + lines.length * 5 > pageH - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(lines, margin, y);
      y += lines.length * 5 + 10;
    }

    doc.save(`SOAP-Note-${encounterId}.pdf`);
  }

  async function handleCopy() {
    const text = SOAP_ORDER
      .map((k) => `${SOAP_LABELS[k].toUpperCase()}\n${sections![k] || "Not provided"}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setCopied(true);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  if (fetchError || !sections) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Final Review</p>
          <p className="mt-4 text-sm text-zinc-500">{fetchError || "No note found for this encounter."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Final Review</p>

        {/* SOAP sections */}
        <div className="mt-8 divide-y divide-zinc-100 border-y border-zinc-950">
          {SOAP_ORDER.map((key) => (
            <article key={key} className="py-6">
              <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-950">
                {SOAP_LABELS[key]}
              </h2>
              {isEditing ? (
                <textarea
                  value={editedSections[key]}
                  onChange={(e) =>
                    setEditedSections((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="mt-3 w-full resize-none rounded-app border border-zinc-200 px-3 py-2 text-base leading-8 text-zinc-900 outline-none focus:border-zinc-950"
                  rows={4}
                />
              ) : sections[key] ? (
                <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-zinc-700">
                  {sections[key]}
                </p>
              ) : (
                <p className="mt-3 text-base italic text-zinc-400">Not provided</p>
              )}
            </article>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {isEditing ? (
            <button
              type="button"
              onClick={saveEdit}
              disabled={isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-app border border-accent-500 px-5 text-sm font-medium text-accent-500 hover:bg-accent-50 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="group relative inline-flex h-11 items-center gap-2 rounded-app border border-accent-500 px-5 text-sm font-medium text-accent-500 hover:bg-accent-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
                <Tooltip>Edit the SOAP note</Tooltip>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="group relative inline-flex h-11 items-center gap-2 rounded-app border border-accent-500 px-5 text-sm font-medium text-accent-500 hover:bg-accent-50"
              >
                <Download className="h-4 w-4" />
                Download as PDF
                <Tooltip>Download as PDF</Tooltip>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="group relative inline-flex h-11 items-center gap-2 rounded-app border border-accent-500 px-5 text-sm font-medium text-accent-500 hover:bg-accent-50"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy to clipboard"}
                <Tooltip>Copy to clipboard</Tooltip>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
