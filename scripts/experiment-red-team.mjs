import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const source = await readFile(
  new URL("../src/lib/experiments.ts", import.meta.url),
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

const experiments = await import(moduleUrl);

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

function makeVariants(metrics) {
  const values = metrics ?? [
    { impressions: 0, clicks: 0, conversions: 0 },
    { impressions: 0, clicks: 0, conversions: 0 },
    { impressions: 0, clicks: 0, conversions: 0 },
  ];

  return ["A", "B", "C"].map((id, index) => ({
    id,
    label: `Variant ${id}`,
    title: `Test variant ${id}`,
    content: `Campaign content for variant ${id}.`,
    angle: ["curiosity", "authority", "proof"][index],
    metrics: values[index],
  }));
}

test("New experiment has no winner", () => {
  const result = experiments.evaluateExperiment(
    makeVariants(),
    100,
  );

  assert.equal(result.winner, null);
  assert.equal(result.readyToDeclareWinner, false);
});

test("Under-sampled variant prevents winner declaration", () => {
  const result = experiments.evaluateExperiment(
    makeVariants([
      { impressions: 100, clicks: 20, conversions: 5 },
      { impressions: 100, clicks: 25, conversions: 8 },
      { impressions: 99, clicks: 15, conversions: 3 },
    ]),
    100,
  );

  assert.equal(result.winner, null);
  assert.equal(result.readyToDeclareWinner, false);
});

test("Leading variant is selected after all reach threshold", () => {
  const result = experiments.evaluateExperiment(
    makeVariants([
      { impressions: 100, clicks: 20, conversions: 4 },
      { impressions: 120, clicks: 30, conversions: 15 },
      { impressions: 110, clicks: 20, conversions: 5 },
    ]),
    100,
  );

  assert.equal(result.readyToDeclareWinner, true);
  assert.equal(result.winner, "B");
});

test("Clicks cannot exceed impressions", () => {
  assert.throws(
    () =>
      experiments.evaluateExperiment(
        makeVariants([
          { impressions: 10, clicks: 11, conversions: 1 },
          { impressions: 10, clicks: 5, conversions: 1 },
          { impressions: 10, clicks: 4, conversions: 1 },
        ]),
        10,
      ),
    /Clicks cannot exceed impressions/,
  );
});

test("Conversions cannot exceed clicks", () => {
  assert.throws(
    () =>
      experiments.evaluateExperiment(
        makeVariants([
          { impressions: 10, clicks: 5, conversions: 6 },
          { impressions: 10, clicks: 5, conversions: 1 },
          { impressions: 10, clicks: 4, conversions: 1 },
        ]),
        10,
      ),
    /Conversions cannot exceed clicks/,
  );
});

test("Negative metrics are rejected", () => {
  assert.notEqual(
    experiments.validateMetrics({
      impressions: -1,
      clicks: 0,
      conversions: 0,
    }),
    null,
  );
});

test("Budget allocation totals 100 percent", () => {
  const result = experiments.evaluateExperiment(
    makeVariants([
      { impressions: 200, clicks: 30, conversions: 5 },
      { impressions: 200, clicks: 40, conversions: 12 },
      { impressions: 200, clicks: 25, conversions: 4 },
    ]),
    100,
  );

  const total = result.evaluations.reduce(
    (sum, item) => sum + item.budgetPercent,
    0,
  );

  assert.equal(Number(total.toFixed(1)), 100);
});

test("Better conversion performance gets more budget", () => {
  const result = experiments.evaluateExperiment(
    makeVariants([
      { impressions: 200, clicks: 30, conversions: 3 },
      { impressions: 200, clicks: 40, conversions: 20 },
      { impressions: 200, clicks: 25, conversions: 4 },
    ]),
    100,
  );

  const budgetA = result.evaluations.find(
    (item) => item.id === "A",
  );
  const budgetB = result.evaluations.find(
    (item) => item.id === "B",
  );

  assert(budgetA);
  assert(budgetB);
  assert(budgetB.budgetPercent > budgetA.budgetPercent);
});

test("Minimum impressions must be a positive integer", () => {
  assert.throws(
    () => experiments.evaluateExperiment(makeVariants(), 0),
    /positive whole number/,
  );
});

console.log("");
console.log(`Experiment red-team tests passed: ${passed}/9.`);