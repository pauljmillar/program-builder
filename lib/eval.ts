import fs from "node:fs";
import path from "node:path";
import type { EvalResults } from "@/eval/types";
import { PROMPT_VERSION } from "@/lib/generate/pipeline";

const evalDir = path.join(process.cwd(), "content", "eval");

function listEvalResultFiles(): string[] {
  if (!fs.existsSync(evalDir)) return [];
  return fs.readdirSync(evalDir).filter((f) => f.endsWith(".json"));
}

export function loadAllEvalResults(): EvalResults[] {
  return listEvalResultFiles()
    .map((f) => JSON.parse(fs.readFileSync(path.join(evalDir, f), "utf8")) as EvalResults)
    .sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
}

/** The latest run of the prompt version the pipeline actually defaults to — not just
 * whichever file happens to be newest, since an experimental version (e.g. a reverted
 * v2) can be committed more recently without being the one in production. */
export function latestEvalResult(): EvalResults | null {
  const all = loadAllEvalResults().filter((r) => r.promptVersion === PROMPT_VERSION);
  return all.length ? all[all.length - 1] : null;
}

/** One result per prompt version — whichever run is most recent for that version. */
export function latestPerPromptVersion(): EvalResults[] {
  const all = loadAllEvalResults();
  const map = new Map<string, EvalResults>();
  for (const r of all) map.set(r.promptVersion, r);
  return Array.from(map.values());
}
