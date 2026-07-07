
# Treasury TTB Label Verification

AI-assisted alcohol beverage label verification prototype for Treasury/TTB compliance review.

## Submission Links

- Source code repository: [https://github.com/mpampell/treasury-ttb-label-verification](https://github.com/mpampell/treasury-ttb-label-verification)
- Deployed application: [https://treasury-ttb-label-verification-e8zyhwz5d-mpampells-projects.vercel.app](https://treasury-ttb-label-verification-e8zyhwz5d-mpampells-projects.vercel.app)

The deployed application is already configured with the required server-side environment variables. Reviewers can test the deployed app without creating their own OpenAI API key.

## Reviewer Summary

This prototype helps a compliance agent compare an alcohol beverage label image against application data. It extracts visible label text with an AI vision model, structures the required fields, applies deterministic validation rules, and highlights matches, mismatches, missing data, and Government Health Warning issues.

The app is intended to assist human review, not replace it.

## Core Capabilities

- Single image upload and batch image upload
- Side-by-side label image and application comparison
- Label analysis can run before application data is entered
- Optional application comparison form appears after analysis
- CSV import for expected application records, matched to uploaded label file names
- AI-assisted extraction of required alcohol label fields
- Field-level confidence scores and explanations
- Deterministic matching that ignores capitalization, punctuation, and whitespace for ordinary label fields
- Strict Government Warning validation requiring exact wording and uppercase `GOVERNMENT WARNING:` lead-in
- Numeric normalization for ABV, proof, and net contents
- Government Health Warning presence and wording validation
- Pass, review, or fail status for each label
- TXT, JSON, and CSV exports
- PNG sample set for repeatable match and mismatch testing
- SVG upload support through browser rasterization and JPEG optimization before AI analysis

## Evaluation Priorities

| Requirement | Prototype response |
| --- | --- |
| Under 5 second processing | Optimized by resizing/compressing images before analysis and using faster vision detail; actual latency still depends on network and model response time |
| Very simple interface | Single-page workflow with large upload, analyze, and export controls |
| High OCR accuracy | Uses OpenAI vision extraction rather than browser-only OCR |
| Side-by-side comparison | Implemented |
| Batch upload | Implemented with queue/status cards |
| Handles imperfect images | Partially supported through vision model interpretation and image-quality notes |
| Explain mismatches | Implemented at field level |
| Government warning validation | Implemented as a strict check for exact required wording and uppercase `GOVERNMENT WARNING:` lead-in |

## How The Solution Works

1. The reviewer or agent uploads one or more label images.
2. The frontend sends each image to a server-side API route.
3. The API route calls the OpenAI Responses API with image input.
4. The model returns structured JSON for required label fields.
5. Local validation code checks required label fields and Government Warning compliance.
6. If application data is provided manually or imported from CSV, the app compares extracted values against that data.
7. The UI displays extracted, match, warning, fail, and missing statuses with explanations.
8. The reviewer can export the session results as TXT, JSON, or CSV.

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

Confidence scores come from the extraction step and are used to communicate uncertainty to the reviewer. In the UI, each field detail shows a `Confidence: NN%` label with a meter so the score is readable without relying on color alone. Compliance status is not delegated entirely to the AI model. After extraction, deterministic validation rules check field presence, normalized equality, numeric equivalence, and Government Health Warning wording.

This split is intentional: AI handles visual/text interpretation, while application code owns repeatable compliance logic.

## Tech Stack

- Next.js
- React
- TypeScript
- OpenAI Responses API with image input
- Vercel deployment

## Repository Layout

The application code is in:

```text
treasury-ttb-label-verification/
```

Key files and folders:

```text
treasury-ttb-label-verification/package.json
treasury-ttb-label-verification/src/
treasury-ttb-label-verification/public/samples/
treasury-ttb-label-verification/docs/
```

Because the app is in a nested folder, Vercel should use this Root Directory:

```text
treasury-ttb-label-verification
```

## Quick Test

Sample labels are included in:

```text
treasury-ttb-label-verification/public/samples/
```

The primary sample set contains 20 PNG files:

- 10 `*-match.png` labels intended to pass when paired with the matching application data.
- 10 `*-mismatch.png` labels with deliberate label issues such as missing warning text, wrong ABV, brand typo, missing origin, or address mismatch.
- `sample-applications.csv` with expected application rows keyed by label file name.
- `sample-application-data.json` with the same expected values in structured JSON form.

Expected behavior:

- A `*-match.png` file should produce mostly matching fields when application data matches the corresponding JSON entry.
- A `*-mismatch.png` file should flag the intentional mismatch for that label pair.
- If no application data is entered, analysis should still complete and show extracted label values rather than application-data warnings.

See the [Testing guide](treasury-ttb-label-verification/docs/testing-guide.md) for a fuller QA checklist and expected outcomes.

## Application Data Mechanism

The assignment expects label data to be compared against application data. In a production TTB workflow, that application data would usually come from an existing structured source such as COLA/application-system records or an internal case database. This prototype does not attempt to OCR or parse full company application documents.

For reviewer testing, the prototype supports CSV import. The CSV uses one row per label image and includes a `fileName` column so the app can load the expected application row for the selected uploaded label.

## Local Run

Requirements:

- Node.js 22.x recommended
- pnpm
- OpenAI API key for live AI extraction

From the app folder:

```bash
cd treasury-ttb-label-verification
pnpm install
cp .env.example .env.local
```

Set environment variables in `.env.local`:

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

SVG sample files are supported by the web app. All uploaded images are rasterized when needed, resized to a 1200px maximum edge, and sent as compressed JPEG data before analysis to reduce upload and model latency.

## Record Preservation

The prototype does not use a database. During a browser session, analyzed labels remain in the batch list. Reviewers can download the current session record as:

- TXT report for human review
- JSON for full structured results, extracted fields, confidence values, image notes, and application data
- CSV for spreadsheet review across all analyzed images and field-level comparisons

## API Key Requirement

The deployed Vercel app already has `OPENAI_API_KEY` configured server-side. Reviewers using the deployed URL do not need their own key.

Anyone cloning the repository to run locally or redeploying their own copy must provide their own OpenAI API key.

Use a restricted API key:

- List models: Read
- Responses API: Write
- Everything else: None

Do not commit `.env.local`, `.env`, or any API key.

## Vercel Deployment

1. Import this GitHub repository into Vercel.
2. Set **Framework Preset** to `Next.js`.
3. Set **Root Directory** to:

```text
treasury-ttb-label-verification
```

4. Add environment variables:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

5. Deploy.

## Documentation

- [Architecture](treasury-ttb-label-verification/docs/architecture.md)
- [Deployment guide](treasury-ttb-label-verification/docs/deployment.md)
- [Approach, tools, and assumptions](treasury-ttb-label-verification/docs/approach.md)
- [Testing guide](treasury-ttb-label-verification/docs/testing-guide.md)

## Assumptions And Trade-offs

- The prototype is a decision-support tool for human reviewers.
- Uploaded images are processed transiently and are not intentionally stored.
- For best speed, users should upload cropped label images under about 1-2 MB when possible rather than full-resolution phone photos.
- The app uses a fast first-pass extraction setting. A future production version could add an optional high-accuracy recheck for low-confidence or failed labels.
- No database, authentication, role permissions, audit logging, or COLA integration is included.
- Batch processing is sequential to keep prototype behavior predictable.
- Full image preprocessing for perspective correction, glare reduction, and automatic crop is not implemented as a dedicated computer-vision pipeline.
- Government warning validation is strict:
