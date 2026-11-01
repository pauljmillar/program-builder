// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { fundCapacity } from "@/lib/validate/rules/fundCapacity";
import { baseProgram } from "./fixtures";

describe("FUND_CAPACITY", () => {
  it("passes when more than 3 awards are possible", () => {
    expect(fundCapacity({ program: baseProgram() })).toEqual([]);
  });

  it("warns when fewer than 3 awards are possible", () => {
    const program = baseProgram();
    program.basics.fundingTotal = 40_000; // 40,000 / 25,000 = 1 award

    const issues = fundCapacity({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("FUND_CAPACITY");
    expect(issues[0].severity).toBe("warning");
  });
});
