export type ExperimentMetrics = {
  impressions: number;
  clicks: number;
  conversions: number;
};

export type ExperimentVariant = {
  id: "A" | "B" | "C";
  label: string;
  title: string;
  content: string;
  angle: string;
  metrics: ExperimentMetrics;
};

export type VariantEvaluation = {
  id: "A" | "B" | "C";
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  eligible: boolean;
  score: number;
  budgetPercent: number;
};

export function validateMetrics(metrics: ExperimentMetrics): string | null {
  const { impressions, clicks, conversions } = metrics;

  if (![impressions, clicks, conversions].every(Number.isFinite)) {
    return "Metrics must be valid numbers.";
  }
  if (![impressions, clicks, conversions].every(Number.isInteger)) {
    return "Metrics must be whole numbers.";
  }
  if (impressions < 0 || clicks < 0 || conversions < 0) {
    return "Metrics cannot be negative.";
  }
  if (clicks > impressions) {
    return "Clicks cannot exceed impressions.";
  }
  if (conversions > clicks) {
    return "Conversions cannot exceed clicks.";
  }
  return null;
}

/**
 * Evaluates variants with a conservative smoothed conversion-rate score.
 * No winner is declared until every candidate has at least minimumImpressions.
 * Budget recommendations retain a 10% exploration floor per variant.
 */
export function evaluateExperiment(
  variants: ExperimentVariant[],
  minimumImpressions = 100,
): {
  evaluations: VariantEvaluation[];
  winner: "A" | "B" | "C" | null;
  readyToDeclareWinner: boolean;
  minimumImpressions: number;
} {
  if (!Number.isInteger(minimumImpressions) || minimumImpressions < 1) {
    throw new Error("Minimum impressions must be a positive whole number.");
  }

  const normalized = variants.map((variant) => {
    const error = validateMetrics(variant.metrics);
    if (error) throw new Error(`${variant.label}: ${error}`);
    return variant;
  });

  const eligible = normalized.every(
    (variant) => variant.metrics.impressions >= minimumImpressions,
  );

  // Laplace smoothing avoids treating 0 conversions as a mathematically certain 0% rate.
  const rawScores = normalized.map((variant) => {
    const { impressions, conversions } = variant.metrics;
    return (conversions + 1) / (impressions + 2);
  });

  const totalScore = rawScores.reduce((sum, score) => sum + score, 0) || 1;
  const explorationFloor = 0.1;
  const distributable = 1 - explorationFloor * normalized.length;

  const evaluations: VariantEvaluation[] = normalized.map((variant, index) => {
    const { impressions, clicks, conversions } = variant.metrics;
    const rawShare = rawScores[index] / totalScore;
    const budgetShare = explorationFloor + distributable * rawShare;

    return {
      id: variant.id,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      conversionRate: clicks > 0 ? conversions / clicks : 0,
      eligible: impressions >= minimumImpressions,
      score: rawScores[index],
      budgetPercent: Math.round(budgetShare * 1000) / 10,
    };
  });

  // Normalize rounding so the displayed budget split totals exactly 100.0%.
  const roundedTotal = evaluations.reduce((sum, item) => sum + item.budgetPercent, 0);
  if (evaluations.length > 0 && roundedTotal !== 100) {
    evaluations[0].budgetPercent =
      Math.round((evaluations[0].budgetPercent + (100 - roundedTotal)) * 10) / 10;
  }

  const sorted = [...evaluations].sort((a, b) => b.conversionRate - a.conversionRate);
  const winner = eligible && sorted.length ? sorted[0].id : null;

  return {
    evaluations,
    winner,
    readyToDeclareWinner: eligible,
    minimumImpressions,
  };
}
