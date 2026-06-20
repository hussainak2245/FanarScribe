-- SAJIL clinical workspace baseline schema.
-- Creates encounter/run persistence, ghost physician prompt jobs, and note action tracking.
-- Rollback notes:
--   drop table if exists public.sajil_note_actions;
--   drop table if exists public.sajil_physician_prompt_jobs;
--   drop table if exists public.sajil_scribe_runs;
--   drop table if exists public.sajil_encounters;
--   drop function if exists public.sajil_touch_updated_at();

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sajil_encounters (
  id text primary key,
  patient_record_number text not null,
  dialect_hint text not null default 'gulf',
  status text not null default 'draft' check (status in ('draft', 'processing', 'review', 'saved', 'finalized')),
  summary text,
  consultation_time timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sajil_scribe_runs (
  id uuid primary key default gen_random_uuid(),
  encounter_id text not null references public.sajil_encounters(id) on delete cascade,
  source_mode text not null check (source_mode in ('manual_transcript', 'audio')),
  manual_transcript text,
  transcription jsonb,
  translation jsonb,
  soap_note jsonb,
  claims jsonb,
  uncertainty jsonb,
  uncertain_words jsonb,
  physician_questions jsonb,
  providers_used jsonb,
  frontend_hints jsonb,
  status text not null default 'completed' check (status in ('queued', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.sajil_physician_prompt_jobs (
  id uuid primary key default gen_random_uuid(),
  encounter_id text not null references public.sajil_encounters(id) on delete cascade,
  scribe_run_id uuid references public.sajil_scribe_runs(id) on delete set null,
  endpoint_url text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'ghost_pending' check (status in ('ghost_pending', 'queued', 'sent', 'failed')),
  response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sajil_note_actions (
  id uuid primary key default gen_random_uuid(),
  encounter_id text not null references public.sajil_encounters(id) on delete cascade,
  scribe_run_id uuid references public.sajil_scribe_runs(id) on delete set null,
  action_key text not null,
  label text not null,
  status text not null default 'under_development' check (status in ('under_development', 'queued', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.sajil_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sajil_encounters_touch_updated_at on public.sajil_encounters;
create trigger sajil_encounters_touch_updated_at
before update on public.sajil_encounters
for each row
execute function public.sajil_touch_updated_at();

alter table public.sajil_encounters enable row level security;
alter table public.sajil_scribe_runs enable row level security;
alter table public.sajil_physician_prompt_jobs enable row level security;
alter table public.sajil_note_actions enable row level security;

grant select, insert, update on table public.sajil_encounters to anon, authenticated;
grant select, insert on table public.sajil_scribe_runs to anon, authenticated;
grant select, insert, update on table public.sajil_physician_prompt_jobs to anon, authenticated;
grant select, insert, update on table public.sajil_note_actions to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

drop policy if exists "prototype can read encounters" on public.sajil_encounters;
create policy "prototype can read encounters"
on public.sajil_encounters
for select
to anon, authenticated
using (true);

drop policy if exists "prototype can create encounters" on public.sajil_encounters;
create policy "prototype can create encounters"
on public.sajil_encounters
for insert
to anon, authenticated
with check (true);

drop policy if exists "prototype can update encounters" on public.sajil_encounters;
create policy "prototype can update encounters"
on public.sajil_encounters
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "prototype can read scribe runs" on public.sajil_scribe_runs;
create policy "prototype can read scribe runs"
on public.sajil_scribe_runs
for select
to anon, authenticated
using (true);

drop policy if exists "prototype can create scribe runs" on public.sajil_scribe_runs;
create policy "prototype can create scribe runs"
on public.sajil_scribe_runs
for insert
to anon, authenticated
with check (true);

drop policy if exists "prototype can read prompt jobs" on public.sajil_physician_prompt_jobs;
create policy "prototype can read prompt jobs"
on public.sajil_physician_prompt_jobs
for select
to anon, authenticated
using (true);

drop policy if exists "prototype can create prompt jobs" on public.sajil_physician_prompt_jobs;
create policy "prototype can create prompt jobs"
on public.sajil_physician_prompt_jobs
for insert
to anon, authenticated
with check (true);

drop policy if exists "prototype can update prompt jobs" on public.sajil_physician_prompt_jobs;
create policy "prototype can update prompt jobs"
on public.sajil_physician_prompt_jobs
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "prototype can read note actions" on public.sajil_note_actions;
create policy "prototype can read note actions"
on public.sajil_note_actions
for select
to anon, authenticated
using (true);

drop policy if exists "prototype can create note actions" on public.sajil_note_actions;
create policy "prototype can create note actions"
on public.sajil_note_actions
for insert
to anon, authenticated
with check (true);

drop policy if exists "prototype can update note actions" on public.sajil_note_actions;
create policy "prototype can update note actions"
on public.sajil_note_actions
for update
to anon, authenticated
using (true)
with check (true);
