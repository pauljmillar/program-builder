import { Basics, Eligibility, Form } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { estimateFormMinutes } from "@/lib/validate/estimateMinutes";
import { loadPrompt } from "@/lib/prompts/load";

export async function generateForm(
  prompt: string,
  promptVersion: string,
  basics: Basics,
  eligibility: Eligibility
) {
  const result = await callStructured({
    toolName: "form",
    description: "The application form: sections of fields an applicant fills out.",
    schema: Form,
    system: loadPrompt(promptVersion, "form"),
    prompt: `Program description:\n${prompt}\n\nBasics:\n${JSON.stringify(basics, null, 2)}\n\nEligibility rules:\n${JSON.stringify(eligibility, null, 2)}`,
  });

  // estimatedMinutes is computed by code, not trusted from the model (spec §5).
  const estimatedMinutes = estimateFormMinutes(result.data);

  return {
    ...result,
    data: { ...result.data, estimatedMinutes },
  };
}
