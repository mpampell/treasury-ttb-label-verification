# Testing Guide

Use these sample labels to exercise the deployed prototype before submission.

## Test Assets

All sample files are in `public/samples`.

The primary sample set is PNG, because PNG is accepted by the OpenAI image API and avoids the SVG upload failure mode. Each product has two files:

- `*-match.png` should generally pass when paired with the matching application data.
- `*-mismatch.png` intentionally changes or removes label information and should produce warnings or failures.

An additional eight-file robustness set uses the same approved application values while changing capture conditions. This separates extraction robustness from known data mismatches.

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

## Robustness Sample Matrix

| File | Condition | Expected outcome |
| --- | --- | --- |
| `11-old-tom-perspective-glare-robust.png` | Perspective and mild glare | Pass or review; values still match |
| `12-river-bend-curved-can-robust.png` | Curved can surface | Pass or review; values still match |
| `13-casa-verde-low-light-robust.png` | Low light and image noise | Pass or review; values still match |
| `14-harbor-light-warning-cropped-robust.png` | Government Warning cropped out | Fail on `governmentWarning` |
| `15-north-star-low-resolution-robust.png` | Low resolution and blur | Pass or review; values still match |
| `16-blue-canyon-rotated-robust.png` | Strong rotation | Pass or review; values still match |
| `17-prairie-gin-address-occluded-robust.png` | Producer address occluded | Fail on `producerAddress` |
| `18-redwood-lager-split-panels-robust.png` | Product and warning shown as separate panels | Pass or review; values still match |

## Application Data

Reusable application data is provided in:

```text
public/samples/sample-applications.csv
public/samples/sample-application-data.json
```

The CSV is the complete filename-mapping dataset for all 28 PNG labels. It also includes `testCaseType`, `expectedOverallStatus`, `expectedMismatchFields`, and `testCondition` QA metadata. The approved application fields remain the source of truth; robustness transforms do not change those values. The JSON file contains additional illustrative structured-record examples.

Recommended workflow:

1. Select **Load sample match and mismatch** in the deployed app. This loads two sample labels and the corresponding mock TTB application records without requiring local repository access.
2. Confirm both labels show application ID `TTB-COLA-TEST-001` in the Expected TTB application record panel.
3. Run analysis.
4. Confirm the match label and intentional mismatch produce distinct field-level results.
5. For broader batch testing, upload any of the 28 PNG files and select **Load built-in test records**, or import `sample-applications.csv`. Matching application rows are applied automatically by exact file name.
6. Select several analyzed labels and confirm each retains its own application ID and expected values.
7. Select **Load robustness set (8)** to queue the imperfect-capture cases with their matching records and visible expected-test metadata.

The CSV represents structured application records. In a production workflow, these rows would come from COLA/application-system data or an internal case database rather than manual entry.

## QA Checklist

For each sample:

- Upload succeeds.
- Image preview appears.
- Analysis completes.
- Analysis does not require application data.
- Side-by-side comparison renders.
- CSV application data imports successfully.
- Matching application row is applied automatically and remains isolated to its label file.
- Field-level explanations are visible.
- Field-level confidence appears as a readable percentage and a meter.
- Government Warning status matches expectation.
- TXT, JSON, and CSV exports work after analysis.

## Notes

The app uses AI vision extraction, so wording and confidence values may vary slightly between runs. The compliance comparison logic is deterministic after extraction.

`pass_or_review` is intentionally tolerant of extraction uncertainty under degraded image conditions. A result is a test failure when a clearly legible value is reported as a conflicting application value, or when a deliberately cropped/occluded required field is not surfaced for action.
