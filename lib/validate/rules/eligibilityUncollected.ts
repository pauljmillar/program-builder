import type { Issue } from "@/lib/schema";
import { allFormFieldKeys } from "@/lib/validate/formFieldKeys";
import type { RuleFn } from "@/lib/validate/types";

export const eligibilityUncollected: RuleFn = ({ program }) => {
  const formKeys = allFormFieldKeys(program);
  const issues: Issue[] = [];

  for (const rule of program.eligibility.rules) {
    if (!formKeys.has(rule.field)) {
      issues.push({
        code: "ELIGIBILITY_UNCOLLECTED",
        severity: "error",
        section: "eligibility",
        message: `Eligibility requires "${rule.label}", but the form doesn't collect "${rule.field}".`,
      });
    }
  }

  return issues;
};
