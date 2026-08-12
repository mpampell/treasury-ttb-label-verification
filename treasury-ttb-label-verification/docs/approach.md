# Approach, Tools, and Assumptions

## Approach

The prototype separates AI extraction from compliance validation. OpenAI vision extracts structured fields and visible text from a label image. Local validation code checks required label content and Government Warning compliance, then compares those fields to application data when application data is provided.

Application data is treated as a structured source of truth. In production, it would come from COLA/application-system records or an internal case database. For this prototype, reviewers can load the built-in records or import a CSV of expected application rows keyed by uploaded label file name.

This structure makes the behavior easier to test and explain: AI handles OCR-like interpretation, while the application owns the compliance decision support.

## Confidence Strategy

The model returns a confidence score for each extracted field. The UI presents those scores to help reviewers decide which fields need closer inspection. Low-confidence fields are treated conservatively: possible mismatches can be elevated to review instead of being treated as definitive failures.

The confidence values are not used as the only basis for compliance status. Required field checks, normalized field comparison, numeric comparison, and Government Warning validation are implemented in local code so those rules are repeatable.

## Validation Strategy

- Required fields must be present unless explicitly optional.
- Label analysis does not require application data.
- Application comparison can use manual entry, built-in records, or imported CSV rows.
- Text comparison ignores capitalization, punctuation, and extra whitespace.
- ABV, proof, and net contents compare normalized numeric values where appropriate.
- Government Warning validation is strict: `GOVERNMENT WARNING:` must be uppercase and the required statement must match exactly.
- The app returns `pass`, `review`, or `fail` to avoid overstating certainty.

## Test Data and Robustness Strategy

The repository includes 28 controlled PNG fixtures: 10 clean reference labels, 10 intentional mismatch labels, and eight robustness cases derived from the clean labels. The robustness cases vary perspective, glare, curvature, lighting, resolution, rotation, cropping, occlusion, and panel layout without changing the approved application values.

`sample-applications.csv` maps every fixture to an application record and includes QA-only metadata for the test case type, expected overall result, expected mismatch fields, and capture condition. This metadata is shown to the reviewer but is not sent to the extraction model, so it does not disclose the expected answer during AI extraction.

The robustness images are deterministic test fixtures generated outside the running application. They evaluate how the existing extraction workflow handles imperfect inputs; they are not evidence of a production image-correction pipeline.

## Tools Used

- Next.js and React for the web application.
- Vercel for deployment.
- OpenAI Responses API for vision-based extraction.
- TypeScript for maintainability.
- Local deterministic validation for matching and government warning checks.
- ImageMagick for reproducible generation of robustness test fixtures.

## Assumptions

- Agents will upload non-sensitive prototype labels for testing.
- The app should assist human review, not automatically approve labels.
- Brand/class/type comparisons should tolerate capitalization, punctuation, and spacing differences.
- ABV, proof, and net contents comparisons should normalize numeric formatting.
- The standard government warning must be present, preserve uppercase `GOVERNMENT WARNING:`, and match the required wording exactly.
- No database is needed for the prototype submission; exported TXT, JSON, and CSV files serve as the review record.

## Trade-offs

- For speed, the browser compresses label images before analysis and the API uses faster vision detail. This improves latency but may reduce OCR accuracy on very small, blurry, or low-contrast warning text.
- Users should upload cropped label images under about 1-2 MB when possible. Full-resolution phone photos increase upload and model latency without always improving extraction quality.
- A production version could use a two-pass workflow: fast first-pass extraction for all labels, then optional high-accuracy review for low-confidence or failed labels.
- A runtime image preprocessing pipeline was not implemented. The prototype relies on the vision model to interpret many imperfect images and to report quality concerns.
- Batch processing is sequential rather than parallel to reduce rate-limit and timeout risk in a prototype deployment.
- The app does not persist uploaded images or review history beyond the current browser session, which keeps the prototype simpler and more privacy-conscious.
- PDF export is not included; TXT, JSON, and CSV exports are implemented for reviewer portability.
- Visual compliance details such as exact font size, contrast, and label placement are not guaranteed from arbitrary photographs.

## Future Improvements

- Add real image preprocessing for rotation, perspective correction, glare reduction, and cropping.
- Add authentication and audit logs.
- Add Azure deployment option for government-aligned infrastructure.
- Add reviewer correction capture for evaluation and continuous improvement.
- Add PDF export with official report formatting.
