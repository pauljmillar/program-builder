import fs from "node:fs";
import path from "node:path";
import { buildProgram, PROMPT_VERSION } from "../lib/generate/pipeline";
import samplesMeta from "../content/samples-meta.json";

const outDir = path.join(process.cwd(), "content", "samples");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const meta of samplesMeta) {
    console.error(`Recording ${meta.id}...`);
    const result = await buildProgram(meta.prompt, PROMPT_VERSION);

    const sample = {
      id: meta.id,
      title: meta.title,
      prompt: meta.prompt,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
      timings: result.timings,
      usage: result.usage,
      program: result.program,
    };

    const outPath = path.join(outDir, `${meta.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(sample, null, 2) + "\n");
    console.error(
      `  wrote ${outPath} (${result.timings.reduce((s, t) => s + t.ms, 0)}ms, ${result.usage.inputTokens} in / ${result.usage.outputTokens} out tokens, ${result.program.check.remaining.length} remaining issues)`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
