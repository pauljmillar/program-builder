// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { longTextLimit } from "@/lib/validate/rules/longTextLimit";
import { baseProgram } from "./fixtures";

describe("LONG_TEXT_LIMIT", () => {
  it("passes a required long text field that has a word limit", () => {
    expect(longTextLimit({ program: baseProgram() })).toEqual([]);
  });

  it("warns on a required long text field with no word limit", () => {
    const program = baseProgram();
    program.form.sections[0].fields[1].maxWords = undefined;

    const issues = longTextLimit({ program });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("LONG_TEXT_LIMIT");
    expect(issues[0].severity).toBe("warning");
  });

  it("does not warn on an optional long text field with no word limit", () => {
    const program = baseProgram();
    program.form.sections[0].fields[1].maxWords = undefined;
    program.form.sections[0].fields[1].required = false;

    expect(longTextLimit({ program })).toEqual([]);
  });
});
