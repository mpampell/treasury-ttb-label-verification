# Approach, Tools, and Assumptions

## Approach

The prototype separates AI extraction from compliance validation. OpenAI vision extracts structured fields and visible text from a label image. Local validation code checks required label content and Government Warning compliance, then compares those fields to application data when application data is provided.

This structure makes the behavior easier to test and explain: AI handles OCR-like interpretation, while the application owns the compliance decision support.

## Confidence Strategy

The model returns a confidence score for each extracted field. The UI presents those scores to help reviewers decide which fields need closer inspection. Low-confidence fields are treated conservatively: possible mismatches can be elevated to review instead of being treated as definitive failures.

The confidence values are not used as the only basis for compliance status. Required field checks, normalized field comparison, numeric comparison, and Government Warning validation are implemented in local code so those rules are repeatable.

## Validation Strategy

- Required fields must be present unless explicitly optional.
- Label analysis does not require application data.
- Text comparison ignores capitalization, punctuation, and extra whitespace.
- ABV, proof, and net contents compare normalized numeric values where appropriate.
- Government Warning validation checks for `GOVERNMENT WARNING:` in uppercase and required statement content.
- The app returns `pass`, `review`, or `fail` to avoid overstating certainty.

## Tools Used

- Next.js and React for the web application.
- Vercel for deployment.
- OpenAI Responses API for vision-based extraction.
- TypeScript for maintainability.
- Local deterministic validation for matching and government warning checks.

## Assumptions

- Agents will upload non-sensitive prototype labels for testing.
- The app should assist human review, not automatically approve labels.
- Brand/class/type comparisons should tolerate capitalization, punctuation, and spacing differences.
- ABV, proof, and net contents comparisons should normalize numeric formatting.
- The standard government warning must be present and should preserve uppercase `GOVERNMENT WARNING:`.
- No database is needed for the prototype submission; exported TXT, JSON, and CSV files serve as the review record.

## Trade-offs

- A full image preprocessing pipeline was not implemented. The prototype relies on the vision model to interpret many imperfect images and to report quality concerns.
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
