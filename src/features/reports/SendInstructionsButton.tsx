"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendPatientInstructions } from "@/lib/api/patient-instructions-api";

export function SendInstructionsButton({ encounterId }: { encounterId: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setSending(true);
    setError("");
    try {
      await sendPatientInstructions(encounterId);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <Button type="button" size="lg" disabled>
        <Send className="h-4 w-4" aria-hidden="true" />
        Sent
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="lg" onClick={handleSend} disabled={sending}>
        {sending
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          : <Send className="h-4 w-4" aria-hidden="true" />}
        Send to patient
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
