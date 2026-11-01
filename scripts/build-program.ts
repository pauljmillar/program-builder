import { buildProgram, PROMPT_VERSION } from "../lib/generate/pipeline";

async function main() {
  const prompt = process.argv.slice(2).join(" ").trim();
  if (!prompt) {
    console.error('Usage: pnpm build-program "<program description>"');
    process.exit(1);
  }

  const result = await buildProgram(prompt, PROMPT_VERSION);

  console.log(JSON.stringify(result.program, null, 2));
  console.error(`\n${result.timings.map((t) => `${t.step}: ${t.ms}ms`).join(", ")}`);
  console.error(`tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
