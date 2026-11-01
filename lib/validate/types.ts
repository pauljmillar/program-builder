import type { DraftProgram, Issue } from "@/lib/schema";

export interface RuleContext {
  program: DraftProgram;
  prompt?: string;
}

export type RuleFn = (ctx: RuleContext) => Issue[];
