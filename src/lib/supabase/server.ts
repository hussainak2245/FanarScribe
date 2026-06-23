import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

export type ScribeRunRow = {
  soap_note: unknown;
  uncertain_words: unknown;
  physician_prompts: unknown;
  physician_questions: unknown;
  created_at: string;
};

export async function getLatestScribeRun(encounterId: string): Promise<ScribeRunRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sajil_scribe_runs")
    .select("soap_note, uncertain_words, physician_prompts, physician_questions, created_at")
    .eq("encounter_id", encounterId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as ScribeRunRow;
}
