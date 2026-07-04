[Uploading README.md…]()
# Treasury TTB Label Verification

AI-assisted alcohol beverage label verification prototype for Treasury/TTB compliance review.

## Submission Links

- Source code repository: `https://github.com/mpampell/treasury-ttb-label-verification`
- Deployed application: `https://treasury-ttb-label-verification-day.vercel.app`

Replace the two placeholders above after GitHub upload and Vercel deployment.

## Reviewer Summary

This prototype helps a compliance agent compare an alcohol beverage label image against application data. It extracts visible label text with an AI vision model, structures the required fields, applies deterministic validation rules, and highlights matches, mismatches, missing data, and warning text issues.

The app is intended to assist human review, not replace it.

## Core Capabilities

- Single image upload and batch image upload
- Side-by-side label image and application comparison
- AI-assisted extraction of required alcohol label fields
- Field-level confidence scores and explanations
- Deterministic matching that ignores capitalization, punctuation, and whitespace
- Numeric normalization for ABV, proof, and net contents
- Government Health Warning presence and wording validation
- Pass, review, or fail status for each label
- TXT, JSON, and CSV exports
- Demo extraction mode for UI testing without an API key

## Evaluation Priorities

| Requirement | Prototype response |
| --- | --- |
| Under 5 second processing | Targeted for simple labels; actual latency depends on image size, network, model response time, and batch size |
| Very simple interface | Single-page workflow with large upload, analyze, and export controls |
| High OCR accuracy | Uses OpenAI vision extraction rather than browser-only OCR |
| Side-by-side comparison | Implemented |
| Batch upload | Implemented with queue/status cards |
| Handles imperfect images | Partially supported through vision model interpretation and image-quality notes |
| Explain mismatches | Implemented at field level |
| Government warning validation | Implemented with exact lead-in and required wording checks |

## How The Solution Works

1. The reviewer or agent uploads one or more label images.
2. The frontend sends each image to a server-side API route.
3. The API route calls the OpenAI Responses API with image input.
4. The model returns structured JSON for required label fields.
5. Local validation code compares extracted values with application data.
6. The UI displays match, warning, fail, and missing statuses with explanations.
7. The reviewer can export the results as TXT, JSON, or CSV.

## Required Fields Checked

- Brand name
- Class/type designation
- Alcohol by volume
- Proof, if applicable
- Net contents
- Producer or bottler name
- Producer or bottler address
- Country of origin, for imports
- Government Health Warning statement

## Confidence And Validation Approach

Confidence scores come from the extraction step and are used to communicate uncertainty to the reviewer. Compliance status is not delegated entirely to the AI model. After extraction, deterministic validation rules check field presence, normalized equality, numeric equivalence, and Government Health Warning wording.

This split is intentional: AI handles visual/text interpretation, while application code owns repeatable compliance logic.

## Tech Stack

- Next.js
- React
- TypeScript
- OpenAI Responses API with image input
- Vercel deployment

## Quick Test

Sample labels are included in `public/samples`:

- `old-tom-compliant.svg`
- `old-tom-warning-mismatch.svg`

Expected behavior:

- The compliant sample should produce mostly matching fields when application data matches the default sample data.
- The mismatch sample should flag the brand difference and incomplete Government Warning text.

## Local Run

Requirements:

- Node.js 20 or newer
- pnpm
- OpenAI API key for live AI extraction

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set environment variables:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Run the app:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

The app can also be tested with the **Demo extraction** toggle without an API key.

## OpenAI Key Permissions

Use a restricted API key:

- List models: Read
- Responses API: Write
- Everything else: None

Do not commit `.env.local` or any API key.

## GitHub Upload

If the repository is empty, upload or push this project folder to:

```text
https://github.com/mpampell/treasury-ttb-label-verification
```

Command-line option:

```bash
git init
git add .
git commit -m "Initial Treasury TTB label verification prototype"
git branch -M main
git remote add origin https://github.com/mpampell/treasury-ttb-label-verification.git
git push -u origin main
```

Verify that `.env.local`, `.env`, `node_modules`, and `.next` are not committed.

## Vercel Deployment

1. Sign in to Vercel.
2. Select **Add New Project**.
3. Import the GitHub repository `treasury-ttb-label-verification`.
4. Keep the framework preset as **Next.js**.
5. Add environment variables:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

6. Deploy.
7. Copy the production URL into the **Submission Links** section above.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment guide](docs/deployment.md)
- [Approach, tools, and assumptions](docs/approach.md)

## Assumptions And Trade-offs

- The prototype is a decision-support tool for human reviewers.
- Uploaded images are processed transiently and are not intentionally stored.
- No database, authentication, role permissions, audit logging, or COLA integration is included.
- Batch processing is sequential to keep prototype behavior predictable.
- Full image preprocessing for perspective correction, glare reduction, and automatic crop is not implemented as a dedicated computer-vision pipeline.
- Government warning validation checks text and uppercase lead-in. Visual requirements such as boldness, contrast, and exact type size are treated as future enhancements unless visible extraction notes indicate a concern.
- AI output can vary slightly over time, so the implementation keeps validation logic separate and determin
