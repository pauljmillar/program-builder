import { Basics, ReviewStages } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { loadPrompt } from "@/lib/prompts/load";

export async function generateReviewStages(prompt: string, promptVersion: string, basics: Basics) {
  return callStructured({
    toolName: "review_stages",
    description: "The review stages applications go through, in order.",
    schema: ReviewStages,
    system: loadPrompt(promptVersion, "reviewStages"),
    prompt: `Program description:\n${prompt}\n\nBasics:\n${JSON.stringify(basics, null, 2)}`,
  });
}
