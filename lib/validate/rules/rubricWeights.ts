import type { RuleFn } from "@/lib/validate/types";

export const rubricWeights: RuleFn = ({ program }) => {
  const total = program.rubric.criteria.reduce((sum, c) => sum + c.weight, 0);
  const rounded = Math.round(total * 100) / 100;

  if (rounded !== 100) {
    return [
      {
        code: "RUBRIC_WEIGHTS",
        severity: "error",
        section: "rubric",
        message: `Rubric weights add up to ${rounded}, not 100.`,
      },
    ];
  }

  return [];
};
