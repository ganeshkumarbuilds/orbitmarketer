export type ComplianceFlag =
  | "guaranteed_results"
  | "medical_claim"
  | "prohibited_phrase"
  | "unsafe_brand_instruction";

export type ComplianceResult = {
  content: string;
  flags: ComplianceFlag[];
  changed: boolean;
};

export type NumberedBrandRule = {
  id: number;
  rule: string;
};

const guaranteePattern =
  /\b(?:guarantee(?:d|s|ing)?|promise(?:d|s|ing)?)\b|\b100\s*%\s*(?:success|results|effective|safe)\b|\b(?:always|definitely|certainly)\s+(?:works|succeeds|delivers results)\b|\brisk[- ]free\b/i;

const medicalPattern =
  /\b(?:cure|cures|curing|diagnos(?:e|es|ed|ing)|treat(?:s|ed|ing)?|heal(?:s|ed|ing)?|prevent(?:s|ed|ing)?|reverse(?:s|d|ing)?)\b.{0,80}\b(?:disease|disorder|illness|condition|infection|symptom|pain|diabetes|cancer|anxiety|depression|medical|patient|health|migraine|arthritis|blood pressure)\b/i;

const unsafeInstructionPatterns = [
  /\bignore\s+(?:all\s+)?(?:previous|prior|system|developer|safety)\s+instructions?\b/i,
  /\b(?:reveal|print|disclose|expose)\s+(?:the\s+)?(?:system prompt|developer prompt|api key|secret|credentials?)\b/i,
  /\b(?:bypass|disable|override)\s+(?:all\s+)?(?:safety|security|policy|restrictions?|guardrails?)\b/i,
  /\b(?:fabricate|invent|make up|fake)\s+(?:testimonials|reviews|statistics|research|evidence|certifications?)\b/i,
  /\b(?:always|must|make sure to|you should)\b.{0,100}\b(?:guaranteed results|guaranteed success|100\s*%\s*(?:success|results)|fake testimonials|invent statistics)\b/i,
];

const unsafeOverridePatterns = [
  /\bnever\b.{0,50}\b(?:guarantee|guaranteed results|medical claims)\b/i,
  /\bavoid\b.{0,50}\b(?:guarantee|guaranteed results|medical claims)\b/i,
  /\bdo not\b.{0,50}\b(?:guarantee|guaranteed results|medical claims)\b/i,
  /\bprohibit(?:ed)?\b.{0,50}\b(?:guarantee|guaranteed results|medical claims)\b/i,
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matches(text: string, pattern: RegExp): boolean {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

export function extractProhibitedPhrasesFromRules(
  rules: string[],
): string[] {
  const found = new Set<string>();
  const policyWords =
    /\b(?:avoid|never use|do not use|don't use|prohibited phrase|prohibited phrases|forbidden phrase|forbidden phrases)\b/i;

  for (const rule of rules) {
    if (!policyWords.test(rule)) continue;

    const doubleQuoted =
      rule.match(/["“]([^"”]{2,100})["”]/g) ?? [];

    const singleQuoted =
      rule.match(/(?<=\s)'([^'\n]{2,100})'/g) ?? [];

    for (const quotedPart of [...doubleQuoted, ...singleQuoted]) {
      const phrase = quotedPart.slice(1, -1).trim();

      if (
        phrase.length >= 2 &&
        !/^(?:t use|t say|t claim)\b/i.test(phrase)
      ) {
        found.add(phrase);
      }
    }
  }

  return [...found];
}

export function isUnsafeBrandInstruction(rule: string): boolean {
  // Explicit prohibitions about risky wording are valid brand guidance.
  if (unsafeOverridePatterns.some((pattern) => pattern.test(rule))) {
    return false;
  }

  return unsafeInstructionPatterns.some((pattern) => pattern.test(rule));
}

export function filterUnsafeBrandRules(
  rules: NumberedBrandRule[],
): {
  safeRules: NumberedBrandRule[];
  ignoredRuleIds: number[];
} {
  const safeRules: NumberedBrandRule[] = [];
  const ignoredRuleIds: number[] = [];

  for (const rule of rules) {
    if (isUnsafeBrandInstruction(rule.rule)) {
      ignoredRuleIds.push(rule.id);
    } else {
      safeRules.push(rule);
    }
  }

  return { safeRules, ignoredRuleIds };
}

function rewriteSentence(
  sentence: string,
  flags: Set<ComplianceFlag>,
  prohibitedPhrases: string[],
): string {
  let hasProhibitedPhrase = false;

  for (const phrase of prohibitedPhrases) {
    if (!phrase.trim()) continue;

    const pattern = new RegExp(escapeRegExp(phrase.trim()), "i");

    if (pattern.test(sentence)) {
      hasProhibitedPhrase = true;
      break;
    }
  }

  // Replace the entire sentence rather than making a misleading claim
  // appear safe by substituting individual words.
  if (hasProhibitedPhrase) {
    flags.add("prohibited_phrase");
    return "Review the brand guidelines and choose wording that complies with the requested restrictions.";
  }

  if (matches(sentence, guaranteePattern)) {
    flags.add("guaranteed_results");
    return "Explore the available features and decide whether they fit your needs.";
  }

  if (matches(sentence, medicalPattern)) {
    flags.add("medical_claim");
    return "Review the product information and consult a qualified healthcare professional about medical concerns.";
  }

  return sentence;
}

export function sanitizeMarketingCopy(
  content: string,
  prohibitedPhrases: string[] = [],
): ComplianceResult {
  const flags = new Set<ComplianceFlag>();
  const original = content;

  const paragraphs = content.split(/(\n+)/);

  const sanitized = paragraphs
    .map((paragraph) => {
      if (!paragraph || /^\n+$/.test(paragraph)) {
        return paragraph;
      }

      const sentences =
        paragraph.match(/[^.!?]+[.!?]?(?:\s+|$)/g) ?? [paragraph];

      return sentences
        .map((sentence) =>
          rewriteSentence(sentence, flags, prohibitedPhrases),
        )
        .join("")
        .trimEnd();
    })
    .join("");

  const finalContent =
    sanitized.trim() ||
    "Explore the available features and decide whether they fit your needs.";

  // Fail closed if a risky claim survives the first pass.
  if (matches(finalContent, guaranteePattern)) {
    flags.add("guaranteed_results");

    return {
      content:
        "Explore the available features and decide whether they fit your needs.",
      flags: [...flags],
      changed: true,
    };
  }

  if (matches(finalContent, medicalPattern)) {
    flags.add("medical_claim");

    return {
      content:
        "Review the product information and consult a qualified healthcare professional about medical concerns.",
      flags: [...flags],
      changed: true,
    };
  }

  for (const phrase of prohibitedPhrases) {
    if (
      phrase &&
      new RegExp(escapeRegExp(phrase), "i").test(finalContent)
    ) {
      flags.add("prohibited_phrase");
      break;
    }
  }

  return {
    content: finalContent,
    flags: [...flags],
    changed: finalContent !== original,
  };
}

export function validateGeneratedCopy(
  content: string,
): string | null {
  const value = content.trim();

  if (value.length < 5) {
    return "Generated copy is too short.";
  }

  if (value.length > 4000) {
    return "Generated copy exceeds the 4000-character limit.";
  }

  const words =
    value.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? [];

  if (words.length >= 30) {
    const unique = new Set(words);

    if (unique.size / words.length < 0.28) {
      return "Generated copy is excessively repetitive.";
    }
  }

  const normalizedSentences = value
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim().toLowerCase())
    .filter((sentence) => sentence.length >= 12);

  if (
    new Set(normalizedSentences).size <
    normalizedSentences.length
  ) {
    return "Generated copy repeats one or more sentences.";
  }

  return null;
}