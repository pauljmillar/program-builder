// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { rubricWeights } from "@/lib/validate/rules/rubricWeights";
import { baseProgram } from "./fixtures";

describe("RUBRIC_WEIGHTS", () => {
  it("passes weights that sum to 100", () => {
    expect(rubricWeights({ program: baseProgram() })).toEqual([]);
  });

  it("catches weights that don't sum to 100", () => {
    const program = baseProgram();
    program.rubric.criteria[0].weight = 50; // 50 + 40 = 90, not 100

    const issues = rubricWeights({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("RUBRIC_WEIGHTS");
    expect(issues[0].message).toContain("90");
  });
});
