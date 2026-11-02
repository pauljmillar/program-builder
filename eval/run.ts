import fs from "node:fs";
import path from "node:path";
import { buildProgram } from "../lib/generate/pipeline";
import { MODEL_ID } from "../lib/generate/client";
import type { EvalCase, EvalCaseResult, EvalResults } from "./types";

const CONCURRENCY = 3;
const TOLERANCE = 0.01;
const PRICE_INPUT_PER_MTOK = Number(process.env.PRICE_INPUT_PER_MTOK ?? 3);
const PRICE_OUTPUT_PER_MTOK = Number(process.env.PRICE_OUTPUT_PER_MTOK ?? 15);

function loadCases(): EvalCase[] {
  const file = path.join(process.cwd(), "eval", "cases.jsonl");
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as EvalCase);
}

function numbersMatch(expected: number, actual: number | undefined): boolean {
  if (actual === undefined) return false;
  if (expected === 0) return actual === 0;
  return Math.abs(actual - expected) / expected <= TOLERANCE;
}

async function runCase(evalCase: EvalCase, promptVersion: string): Promise<EvalCaseResult> {
  const start = Date.now();

  try {
    const result = await buildProgram(evalCase.prompt, promptVersion);
    const latencyMs = Date.now() - start;
    const program = result.program;

    const firstRoundErrors = program.check.rounds[0].issues.filter((i) => i.severity === "error");
    const finalErrors = program.check.remaining.filter((i) => i.severity === "error");

    const allCodesSeen = new Set(program.check.rounds.flatMap((r) => r.issues.map((i) => i.code)));
    const mustFlag = evalCase.mustFlag ?? [];
    const mustFlagCaught = mustFlag.filter((code) => allCodesSeen.has(code)).length;

    const basics: Record<"fundingTotal" | "awardMin" | "awardMax", number> = {
      fundingTotal: program.basics.fundingTotal,
      awardMin: program.basics.awardMin,
      awardMax: program.basics.awardMax,
    };
    let numbersMatched = 0;
    const expectNumbers = evalCase.expectNumbers ?? {};
    const numberKeys = Object.keys(expectNumbers) as (keyof typeof expectNumbers)[];
    for (const key of numberKeys) {
      const expected = expectNumbers[key];
      if (expected !== undefined && numbersMatch(expected, basics[key])) numbersMatched++;
    }

    return {
      id: evalCase.id,
      category: evalCase.category,
      schemaValid: true,
      firstPassed: firstRoundErrors.length === 0,
      finalPassed: finalErrors.length === 0,
      errorsFixed: program.check.fixed.length,
      mustFlagCaught,
      mustFlagTotal: mustFlag.length,
      numbersMatched,
      numbersExpected: numberKeys.length,
      latencyMs,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    };
  } catch (err) {
    return {
      id: evalCase.id,
      category: evalCase.category,
      schemaValid: false,
      firstPassed: false,
      finalPassed: false,
      errorsFixed: 0,
      mustFlagCaught: 0,
      mustFlagTotal: evalCase.mustFlag?.length ?? 0,
      numbersMatched: 0,
      numbersExpected: Object.keys(evalCase.expectNumbers ?? {}).length,
      latencyMs: Date.now() - start,
      inputTokens: 0,
      outputTokens: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  const promptVersion = process.argv[2] ?? "v1";
  const limitArg = process.argv[3];
  const cases = loadCases().slice(0, limitArg ? Number(limitArg) : undefined);

  console.error(`Running ${cases.length} cases against prompt version ${promptVersion}...`);

  let done = 0;
  const results = await runWithConcurrency(cases, CONCURRENCY, async (c) => {
    const r = await runCase(c, promptVersion);
    done++;
    console.error(
      `[${done}/${cases.length}] ${c.id}: ${r.error ? "ERROR " + r.error : r.finalPassed ? "pass" : "fail"}`
    );
    return r;
  });

  const validResults = results.filter((r) => r.schemaValid);
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const mustFlagCases = results.filter((r) => r.mustFlagTotal > 0);
  const numberCases = results.filter((r) => r.numbersExpected > 0);

  const totalCost = results.reduce(
    (sum, r) =>
      sum +
      (r.inputTokens / 1_000_000) * PRICE_INPUT_PER_MTOK +
      (r.outputTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK,
    0
  );

  const evalResults: EvalResults = {
    promptVersion,
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    caseCount: results.length,
    metrics: {
      schemaValidRate: validResults.length / results.length,
      firstPassRate: results.filter((r) => r.firstPassed).length / results.length,
      finalPassRate: results.filter((r) => r.finalPassed).length / results.length,
      problemsFixedAutomatically: results.reduce((s, r) => s + r.errorsFixed, 0),
      expectedFlagsCaughtRate: mustFlagCases.length
        ? mustFlagCases.reduce((s, r) => s + r.mustFlagCaught, 0) /
          mustFlagCases.reduce((s, r) => s + r.mustFlagTotal, 0)
        : 1,
      promptFidelityRate: numberCases.length
        ? numberCases.reduce((s, r) => s + r.numbersMatched, 0) /
          numberCases.reduce((s, r) => s + r.numbersExpected, 0)
        : 1,
      latencyP50Ms: percentile(latencies, 50),
      latencyP90Ms: percentile(latencies, 90),
      costPerProgramUsd: totalCost / results.length,
    },
    cases: results,
  };

  const date = new Date().toISOString().slice(0, 10);
  const outDir = path.join(process.cwd(), "content", "eval");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `results-${promptVersion}-${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(evalResults, null, 2) + "\n");

  console.error(`\nWrote ${outPath}`);
  console.error(JSON.stringify(evalResults.metrics, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
