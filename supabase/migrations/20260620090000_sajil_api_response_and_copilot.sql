-- SAJIL API response expansion and Clinical Copilot conversation state.
-- Rollback notes:
--   drop table if exists public.sajil_copilot_messages;
--   alter table public.sajil_scribe_runs drop column if exists request_id, drop column if exists audio,
--     drop column if exists speaker_context, drop column if exists models_used, drop column if exists inference,
--     drop column if exists uncertainty_spans, drop column if exists physician_prompts,
--     drop column if exists note_actions, drop column if exists prompt_followup, drop column if exists raw_response;

alter table public.sajil_scribe_runs
  add column if not exists request_id text,
  add column if not exists audio jsonb,
  add column if not exists speaker_context jsonb,
  add column if not exists models_used jsonb,
  add column if not exists inference jsonb,
  add column if not exists uncertainty_spans jsonb,
  add column if not exists physician_prompts jsonb,
  add column if not exists note_actions jsonb,
  add column if not exists prompt_followup jsonb,
  add column if not exists raw_response jsonb;

create table if not exists public.sajil_copilot_messages (
  id uuid primary key default gen_random_uuid(),
  encounter_id text not null references public.sajil_encounters(id) on delete cascade,
  scribe_run_id uuid references public.sajil_scribe_runs(id) on delete set null,
  role text not null check (role in ('assistant', 'physician', 'system', 'tool')),
  content text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.sajil_copilot_messages enable row level security;

grant select, insert on table public.sajil_copilot_messages to anon, authenticated;

drop policy if exists "prototype can read copilot messages" on public.sajil_copilot_messages;
create policy "prototype can read copilot messages"
on public.sajil_copilot_messages
for select
to anon, authenticated
using (true);

drop policy if exists "prototype can create copilot messages" on public.sajil_copilot_messages;
create policy "prototype can create copilot messages"
on public.sajil_copilot_messages
for insert
to anon, authenticated
with check (true);
