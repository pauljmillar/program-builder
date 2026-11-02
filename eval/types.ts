export type IssueCode =
  | "RUBRIC_FIELD_MISSING"
  | "RUBRIC_WEIGHTS"
  | "TIMELINE_ORDER"
  | "AWARD_RANGE"
  | "ELIGIBILITY_UNCOLLECTED"
  | "FUND_CAPACITY"
  | "PANEL_LOAD"
  | "APPLICANT_BURDEN"
  | "LONG_TEXT_LIMIT"
  | "PROMPT_CONFLICT";

export interface EvalCase {
  id: string;
  category: string;
  prompt: string;
  mustFlag?: IssueCode[];
  expectNumbers?: {
    fundingTotal?: number;
    awardMin?: number;
    awardMax?: number;
  };
}

export interface EvalCaseResult {
  id: string;
  category: string;
  schemaValid: boolean;
  firstPassed: boolean;
  finalPassed: boolean;
  errorsFixed: number;
  mustFlagCaught: number;
  mustFlagTotal: number;
  numbersMatched: number;
  numbersExpected: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}

/**
 * A case with mustFlag entries is a deliberately-contradictory or deliberately-broken
 * prompt — "finalPassed: false" is the CORRECT outcome there (the checker should leave
 * an unresolvable conflict for a human, not silently resolve it). So "did this case
 * behave correctly" means "finalPassed" for ordinary cases, but "every mustFlag code
 * was actually caught" for cases that are supposed to trip the checker. Using this
 * instead of raw finalPassed is what the eval-gate needs to compare a subset fairly
 * against a full run with a different mix of ordinary vs. contradictory cases.
 */
export function caseSucceeded(r: Pick<EvalCaseResult, "finalPassed" | "mustFlagCaught" | "mustFlagTotal">): boolean {
  if (r.mustFlagTotal > 0) return r.mustFlagCaught === r.mustFlagTotal;
  return r.finalPassed;
}

export interface EvalResults {
  promptVersion: string;
  generatedAt: string;
  model: string;
  caseCount: number;
  metrics: {
    schemaValidRate: number;
    firstPassRate: number;
    finalPassRate: number;
    problemsFixedAutomatically: number;
    expectedFlagsCaughtRate: number;
    promptFidelityRate: number;
    latencyP50Ms: number;
    latencyP90Ms: number;
    costPerProgramUsd: number;
  };
  cases: EvalCaseResult[];
}
