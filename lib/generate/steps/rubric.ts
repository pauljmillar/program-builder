import { Basics, Form, Rubric } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { loadPrompt } from "@/lib/prompts/load";

export async function generateRubric(prompt: string, promptVersion: string, basics: Basics, form: Form) {
  return callStructured({
    toolName: "rubric",
    description: "The scoring rubric reviewers use, keyed to the application form's fields.",
    schema: Rubric,
    system: loadPrompt(promptVersion, "rubric"),
    prompt: `Program description:\n${prompt}\n\nBasics:\n${JSON.stringify(basics, null, 2)}\n\nApplication form:\n${JSON.stringify(form, null, 2)}`,
  });
}
