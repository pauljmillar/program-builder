import { DraftProgram, Issue } from "@/lib/schema";
import { callStructured } from "@/lib/generate/callStructured";
import { loadPrompt } from "@/lib/prompts/load";

const RepairPatch = DraftProgram.partial();

export async function repairProgram(
  program: DraftProgram,
  issues: Issue[],
  prompt: string,
  promptVersion: string
) {
  const result = await callStructured({
    toolName: "repair",
    description: "Corrected sections for the flagged problems only. Omit sections that didn't need to change.",
    schema: RepairPatch,
    system: loadPrompt(promptVersion, "repair"),
    prompt: `Original program description:\n${prompt}\n\nCurrent program:\n${JSON.stringify(
      program,
      null,
      2
    )}\n\nProblems found:\n${JSON.stringify(issues, null, 2)}`,
  });

  const merged: DraftProgram = { ...program, ...result.data };

  return { data: merged, usage: result.usage };
}
