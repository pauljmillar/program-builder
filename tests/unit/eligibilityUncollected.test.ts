// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { eligibilityUncollected } from "@/lib/validate/rules/eligibilityUncollected";
import { baseProgram } from "./fixtures";

describe("ELIGIBILITY_UNCOLLECTED", () => {
  it("passes when every eligibility field is a form field", () => {
    expect(eligibilityUncollected({ program: baseProgram() })).toEqual([]);
  });

  it("catches an eligibility rule whose field the form never asks for", () => {
    const program = baseProgram();
    program.eligibility.rules.push({
      id: "r2",
      label: "Annual budget under $2M",
      field: "annual_budget",
      op: "lte",
      value: 2_000_000,
      message: "Annual budget must be under $2M.",
    });

    const issues = eligibilityUncollected({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("ELIGIBILITY_UNCOLLECTED");
  });
});
