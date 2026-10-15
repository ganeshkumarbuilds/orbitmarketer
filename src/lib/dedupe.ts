export type DedupeAsset = {
  id: string;
  type: string;
  title: string;
  content: string;
};

export type DedupeResult = {
  kept: DedupeAsset[];
  removed: DedupeAsset[];
  threshold: number;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function createVector(text: string): Map<string, number> {
  const vector = new Map<string, number>();

  for (const token of tokenize(text)) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }

  return vector;
}

function cosineSimilarity(
  first: Map<string, number>,
  second: Map<string, number>,
): number {
  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (const value of first.values()) {
    firstMagnitude += value * value;
  }

  for (const value of second.values()) {
    secondMagnitude += value * value;
  }

  for (const [word, value] of first.entries()) {
    dotProduct += value * (second.get(word) ?? 0);
  }

  if (firstMagnitude === 0 || secondMagnitude === 0) return 0;

  return dotProduct / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
}

export function deduplicateAssets(
  assets: DedupeAsset[],
  threshold = 0.82,
): DedupeResult {
  if (threshold < 0 || threshold > 1) {
    throw new Error("Similarity threshold must be between 0 and 1.");
  }

  const kept: DedupeAsset[] = [];
  const removed: DedupeAsset[] = [];
  const vectors = new Map<string, Map<string, number>>();

  for (const asset of assets) {
    vectors.set(asset.id, createVector(`${asset.title} ${asset.content}`));
  }

  for (const asset of assets) {
    const currentVector = vectors.get(asset.id)!;
    const duplicate = kept.find((existing) => {
      // Only compare assets of the same type, so a hook isn't removed
      // merely because it shares wording with an email or landing-page section.
      if (existing.type !== asset.type) return false;
      return cosineSimilarity(currentVector, vectors.get(existing.id)!) >= threshold;
    });

    if (duplicate) removed.push(asset);
    else kept.push(asset);
  }

  return { kept, removed, threshold };
}
