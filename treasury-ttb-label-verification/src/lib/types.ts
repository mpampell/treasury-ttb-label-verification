export type FieldKey =
  | "brandName"
  | "classType"
  | "abv"
  | "proof"
  | "netContents"
  | "producerName"
  | "producerAddress"
  | "countryOfOrigin"
  | "governmentWarning";

export type ApplicationData = Record<FieldKey, string>;

export type ExtractedField = {
  value: string;
  confidence: number;
  explanation: string;
};

export type ExtractedLabel = {
  fields: Record<FieldKey, ExtractedField>;
  allVisibleText: string;
  unreadableText: string[];
  imageQualityNotes: string[];
  extractionSummary: string;
};

export type FieldStatus = "match" | "warning" | "fail" | "missing";

export type FieldComparison = {
  key: FieldKey;
  label: string;
  expected: string;
  extracted: string;
  status: FieldStatus;
  confidence: number;
  explanation: string;
};

export type AnalysisResult = {
  fileName: string;
  elapsedMs: number;
  overallStatus: "pass" | "review" | "fail";
  summary: string;
  fields: FieldComparison[];
  extracted: ExtractedLabel;
  counts: {
    matches: number;
    warnings: number;
    failures: number;
    missing: number;
  };
};
