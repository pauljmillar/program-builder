import { Basics, Eligibility } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { loadPrompt } from "@/lib/prompts/load";

export async function generateEligibility(prompt: string, promptVersion: string, basics: Basics) {
  return callStructured({
    toolName: "eligibility",
    description: "The eligibility rules an applicant must meet.",
    schema: Eligibility,
    system: loadPrompt(promptVersion, "eligibility"),
    prompt: `Program description:\n${prompt}\n\nBasics already generated:\n${JSON.stringify(basics, null, 2)}`,
  });
}
