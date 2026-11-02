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
