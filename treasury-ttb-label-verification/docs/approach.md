# Approach, Tools, and Assumptions

## Approach

The prototype separates AI extraction from compliance validation. OpenAI vision extracts structured fields and visible text from a label image. Local validation code then compares those fields to application data using predictable rules.

This structure makes the behavior easier to test and explain: AI handles OCR-like interpretation, while the application owns the compliance decision support.

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
- No database is needed for the prototype submission.

## Future Improvements

- Add real image preprocessing for rotation, perspective correction, glare reduction, and cropping.
- Add authentication and audit logs.
- Add Azure deployment option for government-aligned infrastructure.
- Add reviewer correction capture for evaluation and continuous improvement.
- Add PDF export with official report formatting.
