# Testing Guide

Use these sample labels to exercise the deployed prototype before submission.

## Test Assets

All sample files are in `public/samples`.

The primary sample set is PNG, because PNG is accepted by the OpenAI image API and avoids the SVG upload failure mode. Each product has two files:

- `*-match.png` should generally pass when paired with the matching application data.
- `*-mismatch.png` intentionally changes or removes label information and should produce warnings or failures.

## PNG Sample Matrix

| Product | Match file | Mismatch file | Intentional mismatch |
| --- | --- | --- | --- |
| Old Tom Bourbon | `01-old-tom-bourbon-match.png` | `01-old-tom-bourbon-mismatch.png` | Brand typo and warning wording change |
| River Bend IPA | `02-river-bend-ipa-match.png` | `02-river-bend-ipa-mismatch.png` | Missing Government Warning |
| Casa Verde Wine | `03-casa-verde-wine-match.png` | `03-casa-verde-wine-mismatch.png` | Missing country of origin and wrong address |
| Harbor Light Rum | `04-harbor-light-rum-match.png` | `04-harbor-light-rum-mismatch.png` | ABV and proof mismatch |
| North Star Vodka | `05-north-star-vodka-match.png` | `05-north-star-vodka-mismatch.png` | Net contents mismatch |
| Summit Cider | `06-summit-cider-match.png` | `06-summit-cider-mismatch.png` | Producer name mismatch |
| Blue Canyon Tequila | `07-blue-canyon-tequila-match.png` | `07-blue-canyon-tequila-mismatch.png` | Class/type mismatch |
| Prairie Gin | `08-prairie-gin-match.png` | `08-prairie-gin-mismatch.png` | Address mismatch |
| Redwood Lager | `09-redwood-lager-match.png` | `09-redwood-lager-mismatch.png` | ABV mismatch |
| Silver Maple Whiskey | `10-silver-maple-whiskey-match.png` | `10-silver-maple-whiskey-mismatch.png` | Brand and net contents mismatch |

## Application Data

Reusable application data is provided in:

```text
public/samples/sample-applications.csv
public/samples/sample-application-data.json
```

Recommended workflow:

1. Upload one or more label images.
2. Run analysis.
3. Confirm extracted label values render without requiring application data.
4. Import `sample-applications.csv` in the Expected application data panel.
5. Select an analyzed label and click **Load matching row**.
6. Confirm the comparison updates and flags the intended match or mismatch.

The CSV represents structured application records. In a production workflow, these rows would come from COLA/application-system data or an internal case database rather than manual entry.

## QA Checklist

For each sample:

- Upload succeeds.
- Image preview appears.
- Analysis completes.
- Analysis does not require application data.
- Side-by-side comparison renders.
- CSV application data imports successfully.
- Matching application row loads for the selected label file.
- Field-level explanations are visible.
- Field-level confidence appears as a readable percentage and a meter.
- Government Warning status matches expectation.
- TXT, JSON, and CSV exports work after analysis.

## Notes

The app uses AI vision extraction, so wording and confidence values may vary slightly between runs. The compliance comparison logic is deterministic after extraction.
