import type { Issue } from "@/lib/schema";
import type { RuleFn } from "@/lib/validate/types";

export const awardRange: RuleFn = ({ program }) => {
  const { awardMin, awardMax, fundingTotal } = program.basics;
  const issues: Issue[] = [];

  if (awardMin > awardMax) {
    issues.push({
      code: "AWARD_RANGE",
      severity: "error",
      section: "basics",
      message: "The smallest award is bigger than the largest award.",
    });
  }

  if (awardMax > fundingTotal) {
    issues.push({
      code: "AWARD_RANGE",
      severity: "error",
      section: "basics",
      message: "The largest award is bigger than the whole fund.",
    });
  }

  return issues;
};
