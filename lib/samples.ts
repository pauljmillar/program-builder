import type { Program } from "@/lib/schema";

export interface StepTiming {
  step: string;
  ms: number;
}

export interface Sample {
  id: string;
  title: string;
  prompt: string;
  promptVersion: string;
  generatedAt: string;
  timings: StepTiming[];
  usage: { inputTokens: number; outputTokens: number };
  program: Program;
}

interface StepLabel {
  key: string;
  label: string;
}

const STEP_LABELS: StepLabel[] = [
  { key: "basics", label: "Basics" },
  { key: "eligibility", label: "Eligibility" },
  { key: "form", label: "Application form" },
  { key: "rubric", label: "Scoring rubric" },
  { key: "reviewStages", label: "Review stages" },
  { key: "timeline", label: "Timeline" },
  { key: "faq", label: "FAQ" },
  { key: "check", label: "Check" },
];

const MIN_CHECK_MS = 400;

/**
 * Collapses a sample's recorded per-call timings into the 8 rows the UI shows,
 * folding any repair-round time into the final "Check" row.
 */
export function buildStepTimeline(timings: StepTiming[]): { label: string; ms: number }[] {
  const byStep = new Map(timings.map((t) => [t.step, t.ms]));
  const repairMs = timings
    .filter((t) => t.step.startsWith("repair-"))
    .reduce((sum, t) => sum + t.ms, 0);

  return STEP_LABELS.map(({ key, label }) => ({
    label,
    ms: key === "check" ? repairMs + MIN_CHECK_MS : byStep.get(key) ?? 0,
  }));
}
