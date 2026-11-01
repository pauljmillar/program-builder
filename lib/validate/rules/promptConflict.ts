import type { Issue } from "@/lib/schema";
import { extractPromptExpectations } from "@/lib/validate/promptMoney";
import type { RuleFn } from "@/lib/validate/types";

const TOLERANCE = 0.01;

function mismatches(expected: number | undefined, actual: number): boolean {
  if (expected === undefined) return false;
  if (expected === 0) return actual !== 0;
  return Math.abs(actual - expected) / expected > TOLERANCE;
}

export const promptConflict: RuleFn = ({ program, prompt }) => {
  if (!prompt) return [];

  const expected = extractPromptExpectations(prompt);
  const issues: Issue[] = [];

  if (mismatches(expected.fundingTotal, program.basics.fundingTotal)) {
    issues.push({
      code: "PROMPT_CONFLICT",
      severity: "error",
      section: "basics",
      message: `You asked for a $${expected.fundingTotal!.toLocaleString()} fund; the program says $${program.basics.fundingTotal.toLocaleString()}.`,
    });
  }

  if (mismatches(expected.awardMax, program.basics.awardMax)) {
    issues.push({
      code: "PROMPT_CONFLICT",
      severity: "error",
      section: "basics",
      message: `You asked for awards up to $${expected.awardMax!.toLocaleString()}; the program says $${program.basics.awardMax.toLocaleString()}.`,
    });
  }

  if (mismatches(expected.awardMin, program.basics.awardMin)) {
    issues.push({
      code: "PROMPT_CONFLICT",
      severity: "error",
      section: "basics",
      message: `You asked for awards starting at $${expected.awardMin!.toLocaleString()}; the program says $${program.basics.awardMin.toLocaleString()}.`,
    });
  }

  return issues;
};
