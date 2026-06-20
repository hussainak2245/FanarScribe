# SAJIL

Arabic-first intelligent clinical scribe frontend for physicians.

This prototype uses Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and the SAJIL FastAPI backend.

Deprecated experiments and static prototypes are archived in `/dump`.
Major development changes are tracked in `LOGS.md`.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The frontend calls:

```text
https://fanar-scribe-api.onrender.com/api/v1/scribe/process
```

Set `NEXT_PUBLIC_API_BASE_URL` only if you need to point at a different backend.

## Deploy on Vercel

Use the default Next.js framework preset.

```text
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://fanar-scribe-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://ogvpyrnidolumuvhbola.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_PwGVQ4jEkRZdt5ht9cyA-w_7ZTgLOLM
NEXT_PUBLIC_PHYSICIAN_PROMPT_API_URL=
```

## Supabase

The database schema is in:

```text
supabase/migrations/
migrations/
```

Apply it after installing and authenticating the Supabase CLI:

```bash
supabase login
supabase link --project-ref ogvpyrnidolumuvhbola
supabase db push
```

If you prefer a direct database push, use the project database password with the provided connection string.

The migration creates:

- `sajil_encounters`
- `sajil_scribe_runs`
- `sajil_physician_prompt_jobs`
- `sajil_note_actions`
- `sajil_copilot_messages`

RLS is enabled on every table and explicit grants are included for the publishable-key prototype client. Lock these policies down before real clinical use.

## Main Flow

Patient Context -> Transcript + SOAP Workspace -> Clinical Copilot -> Review actions.

The SOAP note remains visible while physicians interact with Clinical Copilot prompts and placeholder tools.
