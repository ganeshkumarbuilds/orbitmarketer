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

export type EmbeddingDuplicatePair = {
  keeper: DedupeAsset;
  duplicate: DedupeAsset;
  similarity: number;
};

/**
 * Calculate cosine similarity between two embedding vectors.
 * Returns a value between -1 and 1 for valid vectors.
 */
export function cosineSimilarity(
  first: number[],
  second: number[],
): number {
  if (
    first.length === 0 ||
    first.length !== second.length ||
    !first.every(Number.isFinite) ||
    !second.every(Number.isFinite)
  ) {
    throw new Error("Embedding vectors must have matching, valid dimensions.");
  }

  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (let index = 0; index < first.length; index++) {
    dotProduct += first[index] * second[index];
    firstMagnitude += first[index] * first[index];
    secondMagnitude += second[index] * second[index];
  }

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    return 0;
  }

  return (
    dotProduct /
    (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude))
  );
}

/**
 * Find semantic near-duplicates using actual embedding vectors.
 *
 * The first sufficiently distinct asset is retained as the keeper.
 * Suspected duplicates are returned for manual review; nothing is deleted.
 */
export function findEmbeddingDuplicates(
  assets: DedupeAsset[],
  embeddings: number[][],
  threshold = 0.88,
): {
  kept: DedupeAsset[];
  duplicates: EmbeddingDuplicatePair[];
  threshold: number;
} {
  if (
    !Number.isFinite(threshold) ||
    threshold < -1 ||
    threshold > 1
  ) {
    throw new Error("Similarity threshold must be between -1 and 1.");
  }

  if (assets.length !== embeddings.length) {
    throw new Error("Every asset must have exactly one embedding.");
  }

  if (assets.length === 0) {
    return { kept: [], duplicates: [], threshold };
  }

  const dimensions = embeddings[0]?.length;

  if (
    !dimensions ||
    embeddings.some(
      (vector) =>
        vector.length !== dimensions ||
        !vector.every(Number.isFinite),
    )
  ) {
    throw new Error("The embedding provider returned invalid vectors.");
  }

  const kept: DedupeAsset[] = [];
  const keptEmbeddings: number[][] = [];
  const duplicates: EmbeddingDuplicatePair[] = [];

  for (let index = 0; index < assets.length; index++) {
    const currentAsset = assets[index];
    const currentEmbedding = embeddings[index];

    let bestKeeper: DedupeAsset | null = null;
    let bestSimilarity = -1;

    for (let keeperIndex = 0; keeperIndex < kept.length; keeperIndex++) {
      const similarity = cosineSimilarity(
        currentEmbedding,
        keptEmbeddings[keeperIndex],
      );

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestKeeper = kept[keeperIndex];
      }
    }

    if (bestKeeper && bestSimilarity >= threshold) {
      duplicates.push({
        keeper: bestKeeper,
        duplicate: currentAsset,
        similarity: bestSimilarity,
      });
    } else {
      kept.push(currentAsset);
      keptEmbeddings.push(currentEmbedding);
    }
  }

  return { kept, duplicates, threshold };
}

/**
 * Legacy lexical deduplication is retained for compatibility.
 * The new campaign workflow should use findEmbeddingDuplicates instead.
 */
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

export function deduplicateAssets(
  assets: DedupeAsset[],
  threshold = 0.82,
): DedupeResult {
  if (threshold < 0 || threshold > 1) {
    throw new Error("Similarity threshold must be between 0 and 1.");
  }

  const kept: DedupeAsset[] = [];
  const removed: DedupeAsset[] = [];

  for (const asset of assets) {
    const vector = createVector(`${asset.title} ${asset.content}`);

    let duplicate = false;

    for (const existing of kept) {
      if (existing.type !== asset.type) continue;

      const other = createVector(
        `${existing.title} ${existing.content}`,
      );

      let dotProduct = 0;
      let firstMagnitude = 0;
      let secondMagnitude = 0;

      for (const value of vector.values()) {
        firstMagnitude += value * value;
      }

      for (const value of other.values()) {
        secondMagnitude += value * value;
      }

      for (const [word, value] of vector.entries()) {
        dotProduct += value * (other.get(word) ?? 0);
      }

      const similarity =
        firstMagnitude && secondMagnitude
          ? dotProduct /
            (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude))
          : 0;

      if (similarity >= threshold) {
        duplicate = true;
        break;
      }
    }

    if (duplicate) {
      removed.push(asset);
    } else {
      kept.push(asset);
    }
  }

  return { kept, removed, threshold };
}