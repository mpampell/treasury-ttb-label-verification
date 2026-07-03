# Treasury TTB Label Verification

AI-assisted alcohol beverage label verification prototype for Treasury/TTB compliance review.

## What It Does

- Upload one label image or a batch of label images.
- Extract required alcohol label fields with AI vision.
- Compare extracted fields against application data.
- Highlight matches, mismatches, missing fields, and uncertain extractions.
- Validate the Government Health Warning statement.
- Show a side-by-side image and field comparison.
- Export review results as TXT, JSON, or CSV.

## Prototype Priorities

| Requirement | Status |
| --- | --- |
| Under 5 second processing target | Implemented as a design target; actual latency depends on model/network/image size |
| Very simple interface | Implemented |
| High OCR accuracy | Uses OpenAI vision extraction |
| Side-by-side comparison | Implemented |
| Batch upload | Implemented |
| Handles imperfect images | Partially implemented through vision model interpretation; documented limitation |
| Explain mismatches | Implemented |
| Government warning validation | Implemented |

## Tech Stack

- Next.js
- React
- TypeScript
- OpenAI Responses API with image input
- Vercel deployment

## Local Setup

1. Install Node.js 20 or newer.
2. Install pnpm:

```bash
npm install -g pnpm
```

3. Install project dependencies:

```bash
pnpm install
```

4. Create a local environment file:

```bash
cp .env.example .env.local
```

5. Add your OpenAI API key:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

6. Start the app:

```bash
pnpm dev
```

7. Open:

```text
http://localhost:3000
```

The app can also run in **Demo extraction** mode without an API key.

## OpenAI Key Permissions

Use a restricted key:

- List models: Read
- Responses API: Write
- Everything else: None

Do not commit `.env.local` or paste API keys into GitHub.

## GitHub Upload Instructions

1. Create a new GitHub repository named `treasury-ttb-label-verification`.
2. From this project folder, initialize and push:

```bash
git init
git add .
git commit -m "Initial Treasury TTB label verification prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/treasury-ttb-label-verification.git
git push -u origin main
```

3. Confirm the repository includes source code, `README.md`, `docs/`, and `public/samples/`.
4. Confirm `.env.local` is not uploaded.

## Vercel Deployment Instructions

1. Sign in to Vercel.
2. Select **Add New Project**.
3. Import the GitHub repository `treasury-ttb-label-verification`.
4. Keep the default framework setting: **Next.js**.
5. Add environment variables:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

6. Deploy.
7. Copy the production URL and submit it as the deployed application URL.

## Sample Labels

Sample SVG labels are included in `public/samples`:

- `old-tom-compliant.svg`
- `old-tom-warning-mismatch.svg`

Use these to test pass and fail/review flows.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment guide](docs/deployment.md)
- [Approach, tools, and assumptions](docs/approach.md)

## Assumptions and Trade-offs

- The app assists human compliance agents; it does not replace final review.
- Uploaded images are processed transiently and are not stored by the app.
- Batch processing is sequential to keep behavior predictable for the prototype.
- Government warning validation checks text and uppercase lead-in, but visual requirements like boldness and exact font size are only flagged when detectable by AI extraction notes.
- Full image preprocessing, persistent storage, authentication, audit logging, and COLA integration are future enhancements.
