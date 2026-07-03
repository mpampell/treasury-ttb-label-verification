# Deployment Guide

## GitHub

1. Create a new GitHub repository named `treasury-ttb-label-verification`.
2. Upload or push this project folder to that repository.
3. Do not upload `.env.local` or any API key.

## Vercel

1. Create or sign in to a Vercel account.
2. Choose **Add New Project**.
3. Import the GitHub repository `treasury-ttb-label-verification`.
4. Keep the default Next.js settings.
5. Add these environment variables:
   - `OPENAI_API_KEY`: your OpenAI API key
   - `OPENAI_MODEL`: `gpt-4o-mini`
6. Deploy.
7. Copy the production URL from Vercel and submit it as the deployed application URL.

## Local Run

1. Copy `.env.example` to `.env.local`.
2. Add your OpenAI API key to `.env.local`.
3. Run `pnpm install`.
4. Run `pnpm dev`.
5. Open `http://localhost:3000`.

The app also works in demo extraction mode without an API key, which is useful for checking the interface and report exports.
