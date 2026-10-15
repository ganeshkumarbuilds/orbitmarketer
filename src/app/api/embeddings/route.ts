import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  texts: z.array(z.string().trim().min(1).max(4000)).min(1).max(50),
});

const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL?.trim() ||
  "nvidia/nemotron-3-embed-1b:free";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENROUTER_API_KEY is missing from .env.local.",
        },
        { status: 500 },
      );
    }

    const body: unknown = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide between 1 and 50 valid text items.",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "OrbitMarketer",
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: validation.data.texts,
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenRouter embedding request failed:", {
        status: response.status,
        error: result?.error,
        model: EMBEDDING_MODEL,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            result?.error?.message ??
            "The embedding provider could not process the request.",
          model: EMBEDDING_MODEL,
        },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const returnedItems = result?.data;

    if (
      !Array.isArray(returnedItems) ||
      returnedItems.length !== validation.data.texts.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The embedding provider returned an unexpected number of vectors.",
          model: result?.model ?? EMBEDDING_MODEL,
        },
        { status: 502 },
      );
    }

    const vectors = [...returnedItems]
      .sort(
        (first, second) =>
          Number(first.index) - Number(second.index),
      )
      .map((item) => item.embedding);

    const dimensions = vectors[0]?.length;

    const validVectors =
      Number.isInteger(dimensions) &&
      dimensions > 0 &&
      vectors.every(
        (vector: unknown) =>
          Array.isArray(vector) &&
          vector.length === dimensions &&
          vector.every(
            (value: unknown) =>
              typeof value === "number" &&
              Number.isFinite(value),
          ),
      );

    if (!validVectors) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The embedding provider returned invalid vectors.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      model: result?.model ?? EMBEDDING_MODEL,
      dimensions,
      embeddings: vectors,
    });
  } catch (error) {
    console.error("Embedding generation failed:", error);

    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "The embedding request timed out."
        : "Embedding generation failed. Check the server terminal.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}