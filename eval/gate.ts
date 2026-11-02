import fs from "node:fs";
import path from "node:path";
import { buildProgram } from "../lib/generate/pipeline";
import gateSubsetIds from "./gate-subset.json";
import type { EvalCase, EvalResults } from "./types";

const DROP_THRESHOLD = 0.1;

function loadCases(): EvalCase[] {
  const file = path.join(process.cwd(), "eval", "cases.jsonl");
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as EvalCase);
}

function latestFullResult(promptVersion: string): EvalResults | null {
  const dir = path.join(process.cwd(), "content", "eval");
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((f) => f.startsWith(`results-${promptVersion}-`));
  if (files.length === 0) return null;

  files.sort();
  return JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), "utf8"));
}

/**
 * Runs the fixed 10-case subset for real and fails CI if the pass rate has dropped more
 * than 10 points against the last committed full eval run for this prompt version (spec §12.3).
 */
async function main() {
  const promptVersion = process.argv[2] ?? "v1";
  const subsetIds = new Set(gateSubsetIds as string[]);
  const cases = loadCases().filter((c) => subsetIds.has(c.id));

  const baseline = latestFullResult(promptVersion);
  if (!baseline) {
    console.error(`No committed full eval run found for ${promptVersion} — nothing to compare against, skipping.`);
    return;
  }

  let passed = 0;
  for (const c of cases) {
    const result = await buildProgram(c.prompt, promptVersion);
    const hasErrors = result.program.check.remaining.some((i) => i.severity === "error");
    if (!hasErrors) passed++;
    console.error(`${c.id}: ${hasErrors ? "FAIL" : "pass"}`);
  }

  const subsetRate = passed / cases.length;
  const baselineRate = baseline.metrics.finalPassRate;
  const dropPoints = (baselineRate - subsetRate) * 100;

  console.error(
    `Subset pass rate: ${(subsetRate * 100).toFixed(0)}% vs baseline ${(baselineRate * 100).toFixed(0)}% (drop ${dropPoints.toFixed(0)} pts)`
  );

  if (dropPoints > DROP_THRESHOLD * 100) {
    console.error("FAIL: pass rate dropped more than 10 points against the last committed full run.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
