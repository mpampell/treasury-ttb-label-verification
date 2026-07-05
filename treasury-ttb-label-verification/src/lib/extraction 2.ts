import OpenAI from "openai";
import { z } from "zod";
import type { ExtractedLabel, FieldKey } from "./types";

const fieldKeys: FieldKey[] = [
  "brandName",
  "classType",
  "abv",
  "proof",
  "netContents",
  "producerName",
  "producerAddress",
  "countryOfOrigin",
  "governmentWarning"
];

const fieldSchema = z.object({
  value: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0),
  explanation: z.string().default("")
});

const extractionSchema = z.object({
  fields: z.object(Object.fromEntries(fieldKeys.map((key) => [key, fieldSchema])) as Record<
    FieldKey,
    typeof fieldSchema
  >),
  allVisibleText: z.string().default(""),
  unreadableText: z.array(z.string()).default([]),
  imageQualityNotes: z.array(z.string()).default([]),
  extractionSummary: z.string().default("")
});

export async function extractLabelFromImage(imageDataUrl: string): Promise<ExtractedLabel> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await client.responses.create({
    model,
    temperature: 0,
    max_output_tokens: 1800,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "You are assisting TTB alcohol label compliance agents. Extract visible label data from the image. Return only valid JSON with this exact shape: { fields: { brandName: {value, confidence, explanation}, classType: {value, confidence, explanation}, abv: {value, confidence, explanation}, proof: {value, confidence, explanation}, netContents: {value, confidence, explanation}, producerName: {value, confidence, explanation}, producerAddress: {value, confidence, explanation}, countryOfOrigin: {value, confidence, explanation}, governmentWarning: {value, confidence, explanation} }, allVisibleText: string, unreadableText: string[], imageQualityNotes: string[], extractionSummary: string }. Confidence must be 0 to 1. Preserve government warning capitalization and wording exactly as visible. Use empty strings for fields that are not visible. Note glare, blur, rotation, angle, cropped text, or unreadable areas."
          },
          {
            type: "input_image",
            image_url: imageDataUrl
          }
        ]
      }
    ]
  });

  const raw = response.output_text.trim();
  const jsonText = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = extractionSchema.safeParse(JSON.parse(jsonText));

  if (!parsed.success) {
    throw new Error("The model response did not match the expected extraction format.");
  }

  return parsed.data;
}

export function mockExtractionFromFileName(fileName: string): ExtractedLabel {
  const isMismatch = /mismatch|bad|warning/i.test(fileName);
  const warningText = isMismatch
    ? "Government Warning: Drinking during pregnancy may cause birth defects."
    : "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

  return {
    fields: {
      brandName: {
        value: isMismatch ? "OLD TOMB DISTILLERY" : "OLD TOM DISTILLERY",
        confidence: 0.94,
        explanation: "Demo extraction used because no API key is configured."
      },
      classType: {
        value: "Kentucky Straight Bourbon Whiskey",
        confidence: 0.91,
        explanation: "Detected from prominent class/type text."
      },
      abv: {
        value: "45% Alc./Vol.",
        confidence: 0.9,
        explanation: "Detected from alcohol statement."
      },
      proof: {
        value: "90 Proof",
        confidence: 0.86,
        explanation: "Detected near ABV."
      },
      netContents: {
        value: "750 mL",
        confidence: 0.89,
        explanation: "Detected from lower label text."
      },
      producerName: {
        value: "Old Tom Distillery",
        confidence: 0.82,
        explanation: "Detected from bottler statement."
      },
      producerAddress: {
        value: "Louisville, KY",
        confidence: 0.8,
        explanation: "Detected from bottler address line."
      },
      countryOfOrigin: {
        value: "",
        confidence: 0,
        explanation: "No country of origin visible; may be domestic product."
      },
      governmentWarning: {
        value: warningText,
        confidence: isMismatch ? 0.7 : 0.92,
        explanation: "Government warning text detected in demo mode."
      }
    },
    allVisibleText: "OLD TOM DISTILLERY Kentucky Straight Bourbon Whiskey 45% Alc./Vol. 90 Proof 750 mL",
    unreadableText: [],
    imageQualityNotes: ["Demo extraction mode. Configure OPENAI_API_KEY for live vision analysis."],
    extractionSummary: "Demo result generated locally so the prototype can be tested without an API key."
  };
}
