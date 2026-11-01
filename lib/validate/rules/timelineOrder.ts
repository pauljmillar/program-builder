import type { Issue } from "@/lib/schema";
import type { RuleFn } from "@/lib/validate/types";

interface Step {
  key: "opensAt" | "closesAt" | "reviewStartsAt" | "decisionAt" | "notifyAt";
  violationMessage: string;
}

// Each entry describes what's wrong if this step isn't after the previous one.
const STEPS: Step[] = [
  { key: "opensAt", violationMessage: "" },
  { key: "closesAt", violationMessage: "Applications close before they open." },
  { key: "reviewStartsAt", violationMessage: "Review starts before applications close." },
  { key: "decisionAt", violationMessage: "The decision date is before review starts." },
  { key: "notifyAt", violationMessage: "Applicants are notified before the decision is made." },
];

export const timelineOrder: RuleFn = ({ program }) => {
  const { timeline } = program;
  const issues: Issue[] = [];

  for (let i = 1; i < STEPS.length; i++) {
    const prev = STEPS[i - 1];
    const curr = STEPS[i];
    const prevTime = new Date(timeline[prev.key]).getTime();
    const currTime = new Date(timeline[curr.key]).getTime();

    // decision -> notify may be simultaneous ("decision ≤ notify"); everything else is strict.
    const allowEqual = prev.key === "decisionAt" && curr.key === "notifyAt";
    const ok = allowEqual ? prevTime <= currTime : prevTime < currTime;

    if (!ok) {
      issues.push({
        code: "TIMELINE_ORDER",
        severity: "error",
        section: "timeline",
        message: curr.violationMessage,
      });
    }
  }

  return issues;
};
