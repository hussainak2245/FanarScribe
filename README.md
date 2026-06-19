# SAJIL

Arabic-first intelligent clinical scribe frontend for physicians.

This prototype uses Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and the SAJIL FastAPI backend.

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
```

## Main Flow

Patients -> Consultation -> Review -> Reports -> Settings.

Patient-side intake and report pages are included as lightweight supporting flows.
