import { Basics } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { loadPrompt } from "@/lib/prompts/load";

export async function generateBasics(prompt: string, promptVersion: string) {
  return callStructured({
    toolName: "basics",
    description: "The program's basics: name, summary, funder, funding total, and award range.",
    schema: Basics,
    system: loadPrompt(promptVersion, "basics"),
    prompt: `Program description:\n${prompt}`,
  });
}
