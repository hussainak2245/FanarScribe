-- Notes history (soft delete) + pipeline column + landing page submissions table.
-- Rollback:
--   alter table public.sajil_scribe_runs drop column if exists pipeline;
--   alter table public.sajil_encounters drop column if exists deleted_at;
--   drop table if exists public.public_demo_runs;

-- 1. Add pipeline JSONB to scribe runs
alter table public.sajil_scribe_runs
  add column if not exists pipeline jsonb default '{}'::jsonb;

-- 2. Soft delete on encounters (demo history management)
alter table public.sajil_encounters
  add column if not exists deleted_at timestamptz default null;

-- Update existing select policy to hide soft-deleted encounters
drop policy if exists "prototype can read encounters" on public.sajil_encounters;
create policy "prototype can read encounters"
on public.sajil_encounters
for select
to anon, authenticated
using (deleted_at is null);

-- Allow the anon/authenticated role to soft-delete (set deleted_at)
-- The existing update policy already covers this; no change needed.

-- 3. Public landing page submissions
--    Judges / organizers can query this via the service role key.
--    Anonymous visitors can INSERT their own run, but cannot read others.
create table if not exists public.public_demo_runs (
  id          uuid        primary key default gen_random_uuid(),
  session_id  text        not null,          -- client-generated UUID stored in localStorage
  transcript  text,
  dialect     text        default 'gulf',
  soap_note   jsonb,
  uncertain_words jsonb,
  pipeline    jsonb,
  provider    text,
  request_id  text,
  created_at  timestamptz not null default now()
);

alter table public.public_demo_runs enable row level security;

grant insert on table public.public_demo_runs to anon, authenticated;

drop policy if exists "landing demo insert" on public.public_demo_runs;
create policy "landing demo insert"
on public.public_demo_runs
for insert
to anon, authenticated
with check (true);

-- No SELECT policy for anon → cannot read others' submissions.
-- Service role (backend/Supabase Studio) has unrestricted access.
