import { DraftProgram, Issue, Program } from "@/lib/schema";
import { runChecks } from "@/lib/validate";
import { generateBasics } from "@/lib/generate/steps/basics";
import { generateEligibility } from "@/lib/generate/steps/eligibility";
import { generateForm } from "@/lib/generate/steps/form";
import { generateRubric } from "@/lib/generate/steps/rubric";
import { generateReviewStages } from "@/lib/generate/steps/reviewStages";
import { generateTimeline } from "@/lib/generate/steps/timeline";
import { generateFaq } from "@/lib/generate/steps/faq";
import { repairProgram } from "@/lib/generate/repair";
import type { TokenUsage } from "@/lib/generate/callStructured";

export const PROMPT_VERSION = "v1";
const MAX_REPAIR_ROUNDS = 2;

export interface StepTiming {
  step: string;
  ms: number;
}

export interface BuildResult {
  program: Program;
  timings: StepTiming[];
  usage: TokenUsage;
}

async function timed<T>(step: string, timings: StepTiming[], fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  timings.push({ step, ms: Date.now() - start });
  return result;
}

export async function buildProgram(prompt: string, promptVersion = PROMPT_VERSION): Promise<BuildResult> {
  const timings: StepTiming[] = [];
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  const track = (u: TokenUsage) => {
    usage.inputTokens += u.inputTokens;
    usage.outputTokens += u.outputTokens;
  };

  const basics = await timed("basics", timings, async () => {
    const r = await generateBasics(prompt, promptVersion);
    track(r.usage);
    return r.data;
  });

  const eligibility = await timed("eligibility", timings, async () => {
    const r = await generateEligibility(prompt, promptVersion, basics);
    track(r.usage);
    return r.data;
  });

  const form = await timed("form", timings, async () => {
    const r = await generateForm(prompt, promptVersion, basics, eligibility);
    track(r.usage);
    return r.data;
  });

  const rubric = await timed("rubric", timings, async () => {
    const r = await generateRubric(prompt, promptVersion, basics, form);
    track(r.usage);
    return r.data;
  });

  const reviewStages = await timed("reviewStages", timings, async () => {
    const r = await generateReviewStages(prompt, promptVersion, basics);
    track(r.usage);
    return r.data;
  });

  const timeline = await timed("timeline", timings, async () => {
    const r = await generateTimeline(prompt, promptVersion, basics, reviewStages);
    track(r.usage);
    return r.data;
  });

  const faq = await timed("faq", timings, async () => {
    const r = await generateFaq(prompt, promptVersion, {
      promptVersion,
      basics,
      eligibility,
      form,
      rubric,
      reviewStages,
      timeline,
    });
    track(r.usage);
    return r.data;
  });

  let draft: DraftProgram = {
    promptVersion,
    basics,
    eligibility,
    form,
    rubric,
    reviewStages,
    timeline,
    faq,
  };

  const rounds: { round: number; issues: Issue[] }[] = [];
  let currentIssues = runChecks(draft, prompt);
  rounds.push({ round: 1, issues: currentIssues });

  let repairRounds = 0;
  while (currentIssues.some((i) => i.severity === "error") && repairRounds < MAX_REPAIR_ROUNDS) {
    const errors = currentIssues.filter((i) => i.severity === "error");

    draft = await timed(`repair-${repairRounds + 1}`, timings, async () => {
      const r = await repairProgram(draft, errors, prompt, promptVersion);
      track(r.usage);
      return r.data;
    });

    repairRounds++;
    currentIssues = runChecks(draft, prompt);
    rounds.push({ round: repairRounds + 1, issues: currentIssues });
  }

  const firstRoundErrors = rounds[0].issues.filter((i) => i.severity === "error");
  const finalIssueKeys = new Set(currentIssues.map((i) => `${i.code}:${i.section}`));
  const fixed: Issue[] = firstRoundErrors
    .filter((i) => !finalIssueKeys.has(`${i.code}:${i.section}`))
    .map((i) => ({ ...i, fixedBy: "repair" as const }));

  const program: Program = {
    ...draft,
    check: { rounds, fixed, remaining: currentIssues },
  };

  return { program, timings, usage };
}
