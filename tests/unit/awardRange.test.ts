// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { awardRange } from "@/lib/validate/rules/awardRange";
import { baseProgram } from "./fixtures";

describe("AWARD_RANGE", () => {
  it("passes when awardMin <= awardMax <= fundingTotal", () => {
    expect(awardRange({ program: baseProgram() })).toEqual([]);
  });

  it("catches an award max bigger than the whole fund", () => {
    const program = baseProgram();
    program.basics.fundingTotal = 10_000;
    program.basics.awardMax = 50_000;

    const issues = awardRange({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("AWARD_RANGE");
  });

  it("catches awardMin bigger than awardMax", () => {
    const program = baseProgram();
    program.basics.awardMin = 30_000;

    const issues = awardRange({ program });
    expect(issues.some((i) => i.message.includes("smallest award"))).toBe(true);
  });
});
