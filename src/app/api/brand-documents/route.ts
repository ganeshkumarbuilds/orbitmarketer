import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?safety\s+rules/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /bypass\s+(all\s+)?restrictions/i,
];

const BRAND_RULE_KEYWORDS = [
  "tone",
  "voice",
  "brand",
  "audience",
  "customer",
  "language",
  "style",
  "messaging",
  "mission",
  "value",
  "values",
  "positioning",
  "avoid",
  "never",
  "always",
  "preferred",
  "prohibited",
  "guideline",
  "guidelines",
  "formal",
  "informal",
  "friendly",
  "professional",
  "terminology",
];

type BrandRule = {
  id: string;
  text: string;
  category: string;
};

function categorizeRule(text: string): string {
  const value = text.toLowerCase();

  if (/avoid|never|prohibited|forbidden|must not|do not/.test(value)) {
    return "Restrictions";
  }

  if (/audience|customer|customer persona|demographic/.test(value)) {
    return "Audience";
  }

  if (/tone|voice|friendly|formal|informal|professional/.test(value)) {
    return "Tone of voice";
  }

  if (/positioning|mission|value proposition|differentiat/.test(value)) {
    return "Positioning";
  }

  if (/terminology|preferred words|language|vocabulary/.test(value)) {
    return "Language";
  }

  return "Brand messaging";
}

function extractBrandRules(text: string): BrandRule[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 12 && line.length <= 500);

  const rules: BrandRule[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const normalized = line.toLowerCase();

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);

    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(line))) {
      continue;
    }

    const containsKeyword = BRAND_RULE_KEYWORDS.some((keyword) =>
      normalized.includes(keyword),
    );

    const looksLikeInstruction =
      /^(always|never|avoid|do not|don't|use|write|keep|prefer|ensure|maintain)\b/i.test(
        line,
      );

    if (!containsKeyword && !looksLikeInstruction) {
      continue;
    }

    rules.push({
      id: `rule-${rules.length + 1}`,
      text: line,
      category: categorizeRule(line),
    });

    if (rules.length >= 100) {
      break;
    }
  }

  return rules;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a PDF file." },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The PDF must be smaller than 10 MB." },
        { status: 413 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json(
        { error: "The uploaded file is not a valid PDF." },
        { status: 400 },
      );
    }

    const parsed = await pdfParse(bytes);

    const extractedText = parsed.text
      .replace(/\u0000/g, "")
      .trim();

    if (extractedText.length < 30) {
      return NextResponse.json(
        {
          error:
            "We couldn't extract enough text. The PDF may be scanned or image-based.",
        },
        { status: 422 },
      );
    }

    const rules = extractBrandRules(extractedText);

    return NextResponse.json({
      success: true,
      filename: file.name,
      pageCount: parsed.numpages,
      characterCount: extractedText.length,
      extractedText,
      rules,
      ruleCount: rules.length,
      processingMethod: "keyword-based-extraction",
    });
  } catch (error) {
    console.error("Brand document processing failed:", error);

    return NextResponse.json(
      {
        error:
          "Unable to process this PDF. Please try another text-based PDF.",
      },
      { status: 500 },
    );
  }
}