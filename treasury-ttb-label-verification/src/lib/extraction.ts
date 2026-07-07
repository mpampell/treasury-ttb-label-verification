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
  fields: z.object(
    Object.fromEntries(fieldKeys.map((key) => [key, fieldSchema])) as Record<
      FieldKey,
      typeof fieldSchema
    >
  ),
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
    max_output_tokens: 1100,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "You are assisting TTB alcohol label compliance agents. Extract visible label data from the image. Return only valid JSON with this exact shape: { fields: { brandName: {value, confidence, explanation}, classType: {value, confidence, explanation}, abv: {value, confidence, explanation}, proof: {value, confidence, explanation}, netContents: {value, confidence, explanation}, producerName: {value, confidence, explanation}, producerAddress: {value, confidence, explanation}, countryOfOrigin: {value, confidence, explanation}, governmentWarning: {value, confidence, explanation} }, allVisibleText: string, unreadableText: string[], imageQualityNotes: string[], extractionSummary: string }. Confidence must be 0 to 1. Preserve government warning capitalization, punctuation, and wording exactly as visible. The required lead-in is GOVERNMENT WARNING: in all caps and should appear bold; note if it appears title case, mixed case, not bold, unusually small, buried, cropped, or hard to read. Use empty strings for fields that are not visible. Note glare, blur, rotation, angle, cropped text, or unreadable areas."
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
            detail: "low"
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
