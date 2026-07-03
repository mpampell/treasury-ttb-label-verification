import type { AnalysisResult, ApplicationData, ExtractedLabel, FieldComparison, FieldKey } from "./types";

export const FIELD_LABELS: Record<FieldKey, string> = {
  brandName: "Brand name",
  classType: "Class/type",
  abv: "Alcohol by volume",
  proof: "Proof",
  netContents: "Net contents",
  producerName: "Producer/bottler name",
  producerAddress: "Producer/bottler address",
  countryOfOrigin: "Country of origin",
  governmentWarning: "Government warning"
};

export const REQUIRED_FIELDS: FieldKey[] = [
  "brandName",
  "classType",
  "abv",
  "netContents",
  "producerName",
  "producerAddress",
  "governmentWarning"
];

export const WARNING_TEXT =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

const OPTIONAL_FIELDS = new Set<FieldKey>(["proof", "countryOfOrigin"]);

export function blankApplicationData(): ApplicationData {
  return {
    brandName: "OLD TOM DISTILLERY",
    classType: "Kentucky Straight Bourbon Whiskey",
    abv: "45% Alc./Vol.",
    proof: "90 Proof",
    netContents: "750 mL",
    producerName: "Old Tom Distillery",
    producerAddress: "Louisville, KY",
    countryOfOrigin: "",
    governmentWarning: WARNING_TEXT
  };
}

export function normalizeValue(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"’‘.,:;()[\]{}\-_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numbersOnly(value: string) {
  return value.match(/\d+(\.\d+)?/g)?.join(" ") ?? "";
}

function equivalentField(key: FieldKey, expected: string, extracted: string) {
  const normalizedExpected = normalizeValue(expected);
  const normalizedExtracted = normalizeValue(extracted);

  if (!normalizedExpected && !normalizedExtracted) return true;
  if (!normalizedExpected || !normalizedExtracted) return false;
  if (normalizedExpected === normalizedExtracted) return true;

  if (["abv", "proof", "netContents"].includes(key)) {
    return numbersOnly(expected) !== "" && numbersOnly(expected) === numbersOnly(extracted);
  }

  return (
    normalizedExpected.includes(normalizedExtracted) ||
    normalizedExtracted.includes(normalizedExpected)
  );
}

function validateWarning(expected: string, extracted: string) {
  if (!extracted.trim()) {
    return {
      status: "missing" as const,
      explanation: "Government warning was not detected on the label."
    };
  }

  const hasUppercaseLead = extracted.includes("GOVERNMENT WARNING:");
  const exactEnough = normalizeValue(expected) === normalizeValue(extracted);
  const containsCore =
    normalizeValue(extracted).includes("surgeon general") &&
    normalizeValue(extracted).includes("pregnancy") &&
    normalizeValue(extracted).includes("drive a car") &&
    normalizeValue(extracted).includes("health problems");

  if (hasUppercaseLead && exactEnough) {
    return {
      status: "match" as const,
      explanation: "Required warning text appears complete with uppercase lead-in."
    };
  }

  if (hasUppercaseLead && containsCore) {
    return {
      status: "warning" as const,
      explanation:
        "Warning appears present, but wording or punctuation may differ from the required statement."
    };
  }

  return {
    status: "fail" as const,
    explanation:
      "Government warning is incomplete, has an incorrect lead-in, or is missing required wording."
  };
}

export function compareLabel(
  application: ApplicationData,
  extracted: ExtractedLabel
): Pick<AnalysisResult, "fields" | "counts" | "overallStatus" | "summary"> {
  const fields = Object.keys(FIELD_LABELS).map((key) => {
    const fieldKey = key as FieldKey;
    const expected = application[fieldKey]?.trim() ?? "";
    const extractedField = extracted.fields[fieldKey];
    const actual = extractedField?.value?.trim() ?? "";

    if (fieldKey === "governmentWarning") {
      const warning = validateWarning(expected || WARNING_TEXT, actual);
      return {
        key: fieldKey,
        label: FIELD_LABELS[fieldKey],
        expected: expected || WARNING_TEXT,
        extracted: actual,
        status: warning.status,
        confidence: extractedField?.confidence ?? 0,
        explanation: warning.explanation
      };
    }

    if (!actual && REQUIRED_FIELDS.includes(fieldKey)) {
      return {
        key: fieldKey,
        label: FIELD_LABELS[fieldKey],
        expected,
        extracted: actual,
        status: "missing" as const,
        confidence: extractedField?.confidence ?? 0,
        explanation: `${FIELD_LABELS[fieldKey]} is required but was not detected.`
      };
    }

    if (!expected && OPTIONAL_FIELDS.has(fieldKey)) {
      return {
        key: fieldKey,
        label: FIELD_LABELS[fieldKey],
        expected,
        extracted: actual,
        status: actual ? "warning" : "match",
        confidence: extractedField?.confidence ?? 0,
        explanation: actual
          ? "Extracted from label, but no application value was provided for comparison."
          : "Optional field was not provided and was not detected."
      };
    }

    if (!expected) {
      return {
        key: fieldKey,
        label: FIELD_LABELS[fieldKey],
        expected,
        extracted: actual,
        status: "warning" as const,
        confidence: extractedField?.confidence ?? 0,
        explanation: "No application value was provided for this field."
      };
    }

    if (equivalentField(fieldKey, expected, actual)) {
      return {
        key: fieldKey,
        label: FIELD_LABELS[fieldKey],
        expected,
        extracted: actual,
        status: "match" as const,
        confidence: extractedField?.confidence ?? 0,
        explanation: "Values match after normalizing capitalization, punctuation, and spacing."
      };
    }

    return {
      key: fieldKey,
      label: FIELD_LABELS[fieldKey],
      expected,
      extracted: actual,
      status: extractedField?.confidence < 0.55 ? "warning" : "fail",
      confidence: extractedField?.confidence ?? 0,
      explanation:
        extractedField?.confidence < 0.55
          ? "Potential mismatch, but extraction confidence is low enough to require human review."
          : "Application value and label value do not match."
    };
  }) satisfies FieldComparison[];

  const counts = {
    matches: fields.filter((field) => field.status === "match").length,
    warnings: fields.filter((field) => field.status === "warning").length,
    failures: fields.filter((field) => field.status === "fail").length,
    missing: fields.filter((field) => field.status === "missing").length
  };

  const overallStatus: AnalysisResult["overallStatus"] =
    counts.failures > 0 || counts.missing > 0 ? "fail" : counts.warnings > 0 ? "review" : "pass";

  const summary =
    overallStatus === "pass"
      ? "No blocking issues detected. Human review is still recommended before approval."
      : overallStatus === "review"
        ? "One or more fields need agent review due to uncertainty or missing application data."
        : "Blocking compliance issues were detected. Review mismatches and missing fields.";

  return { fields, counts, overallStatus, summary };
}
