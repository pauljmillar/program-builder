// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { rubricFieldMissing } from "@/lib/validate/rules/rubricFieldMissing";
import { baseProgram } from "./fixtures";

describe("RUBRIC_FIELD_MISSING", () => {
  it("passes a clean program", () => {
    expect(rubricFieldMissing({ program: baseProgram() })).toEqual([]);
  });

  it("catches a criterion scoring a field the form never asks", () => {
    const program = baseProgram();
    program.rubric.criteria.push({
      key: "community_engagement",
      label: "Community engagement",
      weight: 0,
      description: "How involved the community is.",
      formFieldKeys: ["community_engagement_plan"],
    });

    const issues = rubricFieldMissing({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("RUBRIC_FIELD_MISSING");
    expect(issues[0].severity).toBe("error");
  });
});
