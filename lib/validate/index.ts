import type { DraftProgram, Issue } from "@/lib/schema";
import { applicantBurden } from "@/lib/validate/rules/applicantBurden";
import { awardRange } from "@/lib/validate/rules/awardRange";
import { eligibilityUncollected } from "@/lib/validate/rules/eligibilityUncollected";
import { fundCapacity } from "@/lib/validate/rules/fundCapacity";
import { longTextLimit } from "@/lib/validate/rules/longTextLimit";
import { panelLoad } from "@/lib/validate/rules/panelLoad";
import { promptConflict } from "@/lib/validate/rules/promptConflict";
import { rubricFieldMissing } from "@/lib/validate/rules/rubricFieldMissing";
import { rubricWeights } from "@/lib/validate/rules/rubricWeights";
import { timelineOrder } from "@/lib/validate/rules/timelineOrder";
import type { RuleFn } from "@/lib/validate/types";

export const RULES: RuleFn[] = [
  rubricFieldMissing,
  rubricWeights,
  timelineOrder,
  awardRange,
  eligibilityUncollected,
  fundCapacity,
  panelLoad,
  applicantBurden,
  longTextLimit,
  promptConflict,
];

export function runChecks(program: DraftProgram, prompt?: string): Issue[] {
  return RULES.flatMap((rule) => rule({ program, prompt }));
}

export * from "@/lib/validate/estimateMinutes";
export * from "@/lib/validate/formFieldKeys";
export * from "@/lib/validate/promptMoney";
export type { RuleContext, RuleFn } from "@/lib/validate/types";
