// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { applicantBurden } from "@/lib/validate/rules/applicantBurden";
import { baseProgram } from "./fixtures";

describe("APPLICANT_BURDEN", () => {
  it("passes a short form for a small award", () => {
    const program = baseProgram();
    program.basics.awardMax = 5_000;
    program.form.estimatedMinutes = 10;
    expect(applicantBurden({ program })).toEqual([]);
  });

  it("warns on a long form for a small award", () => {
    const program = baseProgram();
    program.basics.awardMax = 5_000;
    program.form.estimatedMinutes = 75;

    const issues = applicantBurden({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("APPLICANT_BURDEN");
    expect(issues[0].severity).toBe("warning");
  });

  it("does not warn on a long form for a large award", () => {
    const program = baseProgram();
    program.basics.awardMax = 50_000;
    program.form.estimatedMinutes = 75;

    expect(applicantBurden({ program })).toEqual([]);
  });
});
