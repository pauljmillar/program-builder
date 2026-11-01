import type { Issue } from "@/lib/schema";
import type { RuleFn } from "@/lib/validate/types";

export const longTextLimit: RuleFn = ({ program }) => {
  const issues: Issue[] = [];

  for (const section of program.form.sections) {
    for (const field of section.fields) {
      if (field.type === "long_text" && field.required && !field.maxWords) {
        issues.push({
          code: "LONG_TEXT_LIMIT",
          severity: "warning",
          section: "form",
          message: `Add a word limit to "${field.label}".`,
        });
      }
    }
  }

  return issues;
};
