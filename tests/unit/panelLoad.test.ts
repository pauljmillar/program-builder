// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { panelLoad } from "@/lib/validate/rules/panelLoad";
import { baseProgram } from "./fixtures";

describe("PANEL_LOAD", () => {
  it("passes a panel workload at or under 60 reviews per panelist", () => {
    expect(panelLoad({ program: baseProgram() })).toEqual([]);
  });

  it("warns when a panelist would read more than 60 applications", () => {
    const program = baseProgram();
    program.basics.expectedApplications = 1000; // 1000 * 3 / 5 = 600 per panelist

    const issues = panelLoad({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("PANEL_LOAD");
    expect(issues[0].severity).toBe("warning");
  });
});
