# Architecture

## Overview

This prototype is a single-page Next.js application deployed on Vercel. It lets a compliance agent upload one or more label images, run AI-assisted extraction, optionally compare the extracted label values to application data, and export a report.

## Components

- **Frontend**: `src/app/page.tsx` provides the upload workflow, post-analysis application comparison form, batch queue, side-by-side comparison, and exports.
- **API route**: `src/app/api/analyze/route.ts` receives an image data URL and application data. The OpenAI key stays server-side.
- **AI extraction**: `src/lib/extraction.ts` calls the OpenAI Responses API with a vision-capable model and requests structured JSON.
- **Validation engine**: `src/lib/validation.ts` performs deterministic matching, field presence checks, numeric normalization, and government warning validation.
- **Sample assets**: `public/samples` includes 20 PNG sample labels, organized as 10 match/mismatch pairs for repeatable tests.

## Data Flow

1. Agent uploads image files in the browser.
2. Browser previews images and sends one image at a time to `/api/analyze`.
3. API route calls OpenAI using the server-side `OPENAI_API_KEY`.
4. Validation logic checks required label fields and Government Warning compliance.
5. If application data is present, validation logic compares extracted values to that data.
6. UI shows pass, review, or fail status with field-level explanations.
7. Agent exports TXT, JSON, or CSV results for the browser session.

## Security and Privacy

- No persistent database is used.
- Uploaded images are not intentionally stored by the application.
- The export files are the prototype record of analyzed images and comparison parameters.
- The OpenAI API key is read only from server-side environment variables.
- This prototype is not production-authorized for sensitive government records.

## Performance

The app targets under-five-second results for simple labels. Actual speed depends on image size, network latency, model latency, and batch size. Batch processing is sequential in this version to keep rate-limit behavior predictable.

## Trade-offs

- Image preprocessing is limited to browser display and model-side vision interpretation.
- The app validates warning wording but cannot reliably prove font weight or minimum size from every image.
- No authentication, audit log, database, or COLA integration is included.
- AI extraction may vary slightly, so deterministic validation is separated from AI extraction.
