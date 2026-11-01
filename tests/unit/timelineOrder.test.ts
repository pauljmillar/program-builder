// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { timelineOrder } from "@/lib/validate/rules/timelineOrder";
import { baseProgram } from "./fixtures";

describe("TIMELINE_ORDER", () => {
  it("passes a program with dates in order", () => {
    expect(timelineOrder({ program: baseProgram() })).toEqual([]);
  });

  it("catches review starting before applications close", () => {
    const program = baseProgram();
    program.timeline.reviewStartsAt = "2027-02-15T00:00:00Z"; // before closesAt

    const issues = timelineOrder({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("TIMELINE_ORDER");
  });

  it("allows decision and notification on the same date", () => {
    const program = baseProgram();
    program.timeline.notifyAt = program.timeline.decisionAt;

    expect(timelineOrder({ program })).toEqual([]);
  });
});
