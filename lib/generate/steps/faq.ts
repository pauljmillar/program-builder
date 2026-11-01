import { DraftProgram, Faq } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { loadPrompt } from "@/lib/prompts/load";

export async function generateFaq(
  prompt: string,
  promptVersion: string,
  draftSoFar: Omit<DraftProgram, "faq">
) {
  return callStructured({
    toolName: "faq",
    description: "5-8 applicant-facing FAQ items, consistent with everything generated so far.",
    schema: Faq,
    system: loadPrompt(promptVersion, "faq"),
    prompt: `Program description:\n${prompt}\n\nProgram generated so far:\n${JSON.stringify(draftSoFar, null, 2)}`,
  });
}
