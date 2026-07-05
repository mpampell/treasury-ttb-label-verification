# Testing Guide

Use these sample labels to exercise the deployed prototype before submission.

## Test Assets

All sample files are in `public/samples`.

The sample label images are SVG files for readability and easy versioning. The app converts SVG uploads to PNG in the browser before analysis.

| File | Purpose | Suggested application data | Expected result |
| --- | --- | --- | --- |
| `old-tom-compliant.svg` | Clean label with complete required fields | Default Old Tom data | Mostly pass |
| `old-tom-warning-mismatch.svg` | Brand typo and incomplete warning | Default Old Tom data | Fail or review |
| `brand-abv-mismatch.svg` | Brand and alcohol content mismatch | Default Old Tom data | Fail |
| `missing-government-warning.svg` | Label omits required warning | River Bend data | Fail |
| `imported-wine-compliant.svg` | Imported product with country of origin | Imported wine data | Mostly pass |
| `glare-angled-label.svg` | Simulated angled/glare photo | Default Old Tom data | Pass or review depending extraction |
| `cropped-warning-label.svg` | Warning appears near image edge | Harbor Light data entered manually | Review or pass depending extraction |

## Application Data

Reusable data is provided in:

```text
public/samples/sample-application-data.json
```

The app starts with a blank application form. Use the preset buttons for common test cases:

- **Old Tom** for Old Tom sample labels
- **River Bend** for the missing-government-warning beer label
- **Imported wine** for the Casa Verde imported wine label
- **Clear** to empty the form before manual entry

## QA Checklist

For each sample:

- Upload succeeds.
- Image preview appears.
- Analysis completes.
- Side-by-side comparison renders.
- Field-level explanations are visible.
- Government Warning status matches expectation.
- TXT, JSON, and CSV exports work after analysis.

## Notes

The app uses AI vision extraction, so wording and confidence values may vary slightly between runs. The compliance comparison logic is deterministic after extraction.
