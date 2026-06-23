"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Sparkles, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { processScribe } from "@/lib/api/scribe";
import { savePublicDemoRun } from "@/lib/supabase/sajil";

const DEMO_TRANSCRIPT =
  "دكتور: أهلاً، كيف حالك اليوم؟\nمريض: دكتور عندي كتمة من أمس وما قدرت أنام.\nدكتور: هل عندك حرارة أو كحة؟\nمريض: ما عندي حرارة بس عندي شوية كحة.";

function getSessionId(): string {
  const KEY = "sajil_landing_session";
  if (typeof window === "undefined") return crypto.randomUUID();
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

type SoapNote = Record<string, unknown>;
type UncertainWord = { text: string; risk?: string; possible_meanings?: string[]; reason?: string };

export function LandingTryIt() {
  const [transcript, setTranscript] = useState(DEMO_TRANSCRIPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);
  const [uncertainWords, setUncertainWords] = useState<UncertainWord[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const encounterId = useRef(`LAND_${Date.now()}`);

  useEffect(() => {
    // Reset encounter id each time the component mounts
    encounterId.current = `LAND_${Date.now()}`;
  }, []);

  async function handleRun() {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    setSoapNote(null);
    setUncertainWords([]);
    setProvider(null);
    encounterId.current = `LAND_${Date.now()}`;

    try {
      const result = await processScribe({
        patientRecordNumber: "LANDING_DEMO",
        encounterId: encounterId.current,
        consultationTime: new Date().toISOString(),
        sourceMode: "manual_transcript",
        manualTranscript: transcript,
        dialectHint: "gulf",
        noteFormat: "SOAP",
      });

      const soap = result.soap_note as SoapNote | null;
      const words = (result.uncertain_words ?? []) as UncertainWord[];
      const prov = (result.providers_used as Record<string, string> | undefined)?.generation ?? null;

      setSoapNote(soap);
      setUncertainWords(words);
      setProvider(prov);

      // Fire-and-forget secure storage
      savePublicDemoRun({
        sessionId: getSessionId(),
        transcript,
        dialect: "gulf",
        soapNote: soap,
        uncertainWords: words,
        pipeline: result.pipeline ?? {},
        provider: prov ?? undefined,
        requestId: result.request_id ?? undefined,
      });

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const soapSections = soapNote
    ? (["subjective", "objective", "assessment", "plan"] as const).filter((k) => soapNote[k])
    : [];

  return (
    <div className="space-y-4">
      {/* Transcript input */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Transcript
          </span>
          <button
            onClick={() => setTranscript(DEMO_TRANSCRIPT)}
            className="text-xs text-accent-500 hover:text-accent-600 font-medium"
          >
            Load demo transcript
          </button>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          dir="auto"
          rows={7}
          placeholder="Paste an Arabic or English clinical conversation here…"
          className="w-full resize-none px-4 py-3 text-sm leading-7 text-zinc-800 placeholder-zinc-400 focus:outline-none"
        />
      </div>

      <button
        onClick={handleRun}
        disabled={loading || !transcript.trim()}
        className="inline-flex h-11 items-center gap-2 rounded-app bg-accent-500 px-6 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate SOAP note
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {soapNote && (
        <div ref={resultRef} className="space-y-4 pt-2">
          {/* Provider badge */}
          {provider && (
            <p className="text-xs text-zinc-400">
              Generated by{" "}
              <span className="font-semibold text-zinc-600">{provider}</span>
            </p>
          )}

          {/* Uncertain words */}
          {uncertainWords.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-amber-700">
                Uncertain terms flagged — {uncertainWords.length}
              </p>
              <div className="space-y-2">
                {uncertainWords.slice(0, 4).map((w, i) => (
                  <div key={i} className="rounded-lg bg-white p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900" dir="rtl">
                        {w.text}
                      </span>
                      {w.risk && (
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " +
                            (w.risk === "critical"
                              ? "bg-red-100 text-red-700"
                              : w.risk === "high"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-zinc-100 text-zinc-500")
                          }
                        >
                          {w.risk}
                        </span>
                      )}
                    </div>
                    {w.possible_meanings && w.possible_meanings.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Possible meanings: {w.possible_meanings.join(" · ")}
                      </p>
                    )}
                    {w.reason && (
                      <p className="mt-0.5 text-xs text-zinc-400">{w.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOAP note */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                SOAP Note
              </p>
            </div>
            <div className="divide-y divide-zinc-50">
              {soapSections.slice(0, showFull ? undefined : 2).map((section) => {
                const content = soapNote[section] as Record<string, unknown> | string;
                return (
                  <div key={section} className="px-4 py-4">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {section}
                    </p>
                    <div className="text-sm leading-6 text-zinc-700">
                      {typeof content === "string" ? (
                        <p>{content}</p>
                      ) : (
                        Object.entries(content).map(([k, v]) => (
                          <p key={k} className="mb-1">
                            <span className="font-medium text-zinc-600 capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                            {Array.isArray(v) ? v.join(", ") : String(v ?? "")}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {soapSections.length > 2 && (
              <button
                onClick={() => setShowFull((v) => !v)}
                className="flex w-full items-center justify-center gap-1 border-t border-zinc-100 py-2.5 text-xs text-zinc-400 hover:text-zinc-600"
              >
                {showFull ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Show full note
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-zinc-400">
            This result is stored securely for evaluation purposes and is not linked to any patient record.
          </p>
        </div>
      )}
    </div>
  );
}
