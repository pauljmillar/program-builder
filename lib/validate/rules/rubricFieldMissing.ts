import type { Issue } from "@/lib/schema";
import { allFormFieldKeys } from "@/lib/validate/formFieldKeys";
import type { RuleFn } from "@/lib/validate/types";

export const rubricFieldMissing: RuleFn = ({ program }) => {
  const formKeys = allFormFieldKeys(program);
  const issues: Issue[] = [];

  for (const criterion of program.rubric.criteria) {
    const missing = criterion.formFieldKeys.filter((key) => !formKeys.has(key));
    if (missing.length > 0) {
      issues.push({
        code: "RUBRIC_FIELD_MISSING",
        severity: "error",
        section: "rubric",
        message: `The rubric scores "${criterion.label}", but the form never asks about ${missing.join(", ")}.`,
      });
    }
  }

  return issues;
};
