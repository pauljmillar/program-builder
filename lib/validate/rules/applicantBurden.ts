import type { RuleFn } from "@/lib/validate/types";

const BURDEN_MINUTES_THRESHOLD = 60;
const SMALL_AWARD_THRESHOLD = 10_000;

export const applicantBurden: RuleFn = ({ program }) => {
  const { estimatedMinutes } = program.form;
  const { awardMax } = program.basics;

  if (estimatedMinutes > BURDEN_MINUTES_THRESHOLD && awardMax <= SMALL_AWARD_THRESHOLD) {
    return [
      {
        code: "APPLICANT_BURDEN",
        severity: "warning",
        section: "form",
        message: `Applicants would spend about ${Math.round(estimatedMinutes)} minutes applying for up to $${awardMax.toLocaleString()}.`,
      },
    ];
  }

  return [];
};
