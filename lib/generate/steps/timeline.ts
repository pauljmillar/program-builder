import { Basics, ReviewStages, Timeline } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { loadPrompt } from "@/lib/prompts/load";

export async function generateTimeline(
  prompt: string,
  promptVersion: string,
  basics: Basics,
  reviewStages: ReviewStages
) {
  const asOf = new Date().toISOString();

  return callStructured({
    toolName: "timeline",
    description: "The program's key dates, in order.",
    schema: Timeline,
    system: loadPrompt(promptVersion, "timeline"),
    prompt: `As of: ${asOf}\n\nProgram description:\n${prompt}\n\nBasics:\n${JSON.stringify(basics, null, 2)}\n\nReview stages:\n${JSON.stringify(reviewStages, null, 2)}`,
  });
}
