import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractLabelFromImage, mockExtractionFromFileName } from "@/lib/extraction";
import { compareLabel } from "@/lib/validation";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  fileName: z.string(),
  imageDataUrl: z.string().startsWith("data:image/"),
  application: z.object({
    brandName: z.string(),
    classType: z.string(),
    abv: z.string(),
    proof: z.string(),
    netContents: z.string(),
    producerName: z.string(),
    producerAddress: z.string(),
    countryOfOrigin: z.string(),
    governmentWarning: z.string()
  }),
  demoMode: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  const started = Date.now();

  try {
    const body = requestSchema.parse(await request.json());
    const useDemo = body.demoMode || !process.env.OPENAI_API_KEY;
    const extracted = useDemo
      ? mockExtractionFromFileName(body.fileName)
      : await extractLabelFromImage(body.imageDataUrl);
    const comparison = compareLabel(body.application, extracted);

    const result: AnalysisResult = {
      fileName: body.fileName,
      elapsedMs: Date.now() - started,
      extracted,
      ...comparison
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze label.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
