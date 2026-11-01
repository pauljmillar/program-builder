import type { RuleFn } from "@/lib/validate/types";

export const fundCapacity: RuleFn = ({ program }) => {
  const { fundingTotal, awardMax } = program.basics;
  const possibleAwards = Math.floor(fundingTotal / awardMax);

  if (possibleAwards < 3) {
    return [
      {
        code: "FUND_CAPACITY",
        severity: "warning",
        section: "basics",
        message: `At most ${possibleAwards} award${possibleAwards === 1 ? "" : "s"} ${
          possibleAwards === 1 ? "is" : "are"
        } possible at this size. Is that intended?`,
      },
    ];
  }

  return [];
};
