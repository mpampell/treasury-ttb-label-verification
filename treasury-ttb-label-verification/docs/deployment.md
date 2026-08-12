# Deployment Guide

## Repository Layout

The GitHub repository contains the Next.js application in the nested `treasury-ttb-label-verification` folder. Deployment and local commands must use that folder as the application root.

Do not commit `.env.local`, `.env`, an OpenAI API key, or any other secret.

## Vercel

1. Create or sign in to a Vercel account.
2. Choose **Add New Project** and import the GitHub repository `treasury-ttb-label-verification`.
3. Set **Framework Preset** to `Next.js`.
4. Set **Root Directory** to `treasury-ttb-label-verification`.
5. Verify the Node.js runtime is `22.x`, matching the `engines` declaration in `package.json`.
6. Keep the standard Next.js build command, `pnpm build`.
7. Add these server-side environment variables:
   - `OPENAI_API_KEY`: the restricted OpenAI API key used for live extraction.
   - `OPENAI_MODEL`: `gpt-4o-mini`, or another tested vision-capable model.
8. Apply the variables to **Production**. Apply them to **Preview** only when pull-request previews require live extraction.
9. Deploy and verify the production URL.

Never prefix the API key with `NEXT_PUBLIC_`; that would expose it to browser code. Reviewers do not need an API key because the deployed application reads it server-side.

## Deployment Verification

After deployment:

1. Open the production URL and select **Load sample match and mismatch**.
2. Confirm both files receive their mapped application record.
3. Select **Load robustness set (8)** and confirm all eight images load with test metadata.
4. Run at least one analysis to confirm the server-side API key and model are available.
5. Confirm TXT, JSON, and CSV exports remain available after analysis.

If the key is missing, invalid, or has no quota, the application reports an analysis error instead of returning mock results.

## Local Run

Requirements:

- Node.js 22.x
- pnpm
- An OpenAI API key for live extraction

From the repository root:

```bash
cd treasury-ttb-label-verification
pnpm install --frozen-lockfile
```

Create `.env.local` in that application folder with:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Validate and start the application:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm dev
```

Open `http://localhost:3000`.
