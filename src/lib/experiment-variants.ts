import type { ExperimentVariant } from "@/lib/experiments";

export type SourceAsset = {
  id: string;
  type: string;
  title: string;
  content: string;
  angle?: string;
};

function firstSentence(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^.{1,140}?(?:[.!?](?:\s|$)|$)/);
  return (match?.[0] ?? cleaned).trim();
}

/**
 * Creates clearly labeled starting variants from an existing saved asset.
 * These are rule-based variants, not LLM-generated claims.
 */
export function createVariants(asset: SourceAsset): ExperimentVariant[] {
  const source = asset.content.trim();
  const lead = firstSentence(source);
  const rest = source.slice(lead.length).trim();

  const variantA = source;
  const variantB = `${lead}\n\nMake your next step clear. ${rest}`.trim();
  const variantC = `A simpler way to approach your priorities: ${source}`.trim();

  const angle = asset.angle || "curiosity";

  return [
    {
      id: "A",
      label: "Control",
      title: `${asset.title} — Control`,
      content: variantA,
      angle,
      metrics: { impressions: 0, clicks: 0, conversions: 0 },
    },
    {
      id: "B",
      label: "Clarity-led",
      title: `${asset.title} — Clarity`,
      content: variantB,
      angle: "authority",
      metrics: { impressions: 0, clicks: 0, conversions: 0 },
    },
    {
      id: "C",
      label: "Alternative hook",
      title: `${asset.title} — Alternative`,
      content: variantC,
      angle: "curiosity",
      metrics: { impressions: 0, clicks: 0, conversions: 0 },
    },
  ];
}
