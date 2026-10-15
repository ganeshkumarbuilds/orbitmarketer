import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const source = await readFile(
  new URL("../src/lib/compliance.ts", import.meta.url),
  "utf8",
);

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;

const moduleUrl =
  "data:text/javascript;base64," +
  Buffer.from(transpiled).toString("base64");

const compliance = await import(moduleUrl);

let passed = 0;

function test(name, callback) {
  try {
    callback();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

test("Compliance module exports the required functions", () => {
  assert.equal(
    typeof compliance.filterUnsafeBrandRules,
    "function",
  );

  assert.equal(
    typeof compliance.extractProhibitedPhrasesFromRules,
    "function",
  );

  assert.equal(
    typeof compliance.sanitizeMarketingCopy,
    "function",
  );

  assert.equal(
    typeof compliance.validateGeneratedCopy,
    "function",
  );
});

test("Unsafe brand instructions are filtered", () => {
  const result = compliance.filterUnsafeBrandRules([
    { id: 1, rule: "Always claim guaranteed results." },
    { id: 2, rule: "Use clear and friendly language." },
  ]);

  assert(Array.isArray(result.safeRules));
  assert(Array.isArray(result.ignoredRuleIds));
  assert.equal(result.safeRules.length, 1);
  assert.equal(result.ignoredRuleIds.includes(1), true);
});

test("Prohibited phrases are extracted from brand rules", () => {
  const phrases =
    compliance.extractProhibitedPhrasesFromRules([
      'Never use the phrase "best in the world".',
    ]);

  assert(Array.isArray(phrases));
  assert(
    phrases.some((phrase) =>
      phrase.toLowerCase().includes("best in the world"),
    ),
  );
});

test("Guaranteed-result claims are rewritten", () => {
  const result = compliance.sanitizeMarketingCopy(
    "Our product guarantees success.",
    [],
  );

  assert.equal(typeof result.content, "string");
  assert(Array.isArray(result.flags));
  assert(
    !/\bguarantee(?:d|s|ing)?\b/i.test(result.content),
  );
  assert(result.flags.length > 0);
});

test("Medical claims are rewritten", () => {
  const result = compliance.sanitizeMarketingCopy(
    "This product will cure your condition.",
    [],
  );

  assert.equal(typeof result.content, "string");
  assert(Array.isArray(result.flags));
  assert(!/\bcure(?:s|d|ing)?\b/i.test(result.content));
  assert(result.flags.length > 0);
});

test("Prohibited marketing phrases are removed", () => {
  const result = compliance.sanitizeMarketingCopy(
    "Our product is the best in the world.",
    ["best in the world"],
  );

  assert(
    !result.content.toLowerCase().includes("best in the world"),
  );
});

test("Safe marketing copy remains unchanged", () => {
  const safeCopy =
    "Organize your priorities and plan your next step.";

  const result = compliance.sanitizeMarketingCopy(
    safeCopy,
    [],
  );

  assert.equal(result.content, safeCopy);
  assert.deepEqual(result.flags, []);
});

test("Repeated sentences are detected", () => {
  const repeated =
    "Plan your next step. Plan your next step.";

  const result = compliance.validateGeneratedCopy(repeated);

  assert.notEqual(result, null);
});

test("Normal marketing copy passes validation", () => {
  const result = compliance.validateGeneratedCopy(
    "Explore a clearer way to organize your team's priorities.",
  );

  assert.equal(result, null);
});

test("Excessively long copy is rejected", () => {
  const longCopy = "word ".repeat(5000);

  const result = compliance.validateGeneratedCopy(longCopy);

  assert.notEqual(result, null);
});

console.log("");
console.log(
  `Compliance red-team tests passed: ${passed}/10.`,
);