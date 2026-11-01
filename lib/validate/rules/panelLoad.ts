import type { Issue } from "@/lib/schema";
import type { RuleFn } from "@/lib/validate/types";

const MAX_REVIEWS_PER_PANELIST = 60;

export const panelLoad: RuleFn = ({ program }) => {
  const { expectedApplications } = program.basics;
  if (!expectedApplications) return [];

  const issues: Issue[] = [];

  for (const stage of program.reviewStages.stages) {
    const reviewsEveryApplication = stage.assignment === "all";
    if (stage.reviewerType !== "panel" || !reviewsEveryApplication || !stage.panelSize) continue;

    const reviewsPerPanelist = Math.round(
      (expectedApplications * stage.reviewersPerApplication) / stage.panelSize
    );

    if (reviewsPerPanelist > MAX_REVIEWS_PER_PANELIST) {
      issues.push({
        code: "PANEL_LOAD",
        severity: "warning",
        section: "reviewStages",
        message: `Each panelist on "${stage.name}" would read about ${reviewsPerPanelist} applications.`,
      });
    }
  }

  return issues;
};
