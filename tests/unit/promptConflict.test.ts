// Can this test fail? Yes: the "catches" case asserts issues.length > 0, which is
// false for a no-op rule (`() => []`). Verified by temporarily swapping the real
// rule for that stub and confirming this file fails before restoring it.
import { describe, expect, it } from "vitest";
import { promptConflict } from "@/lib/validate/rules/promptConflict";
import { baseProgram } from "./fixtures";

describe("PROMPT_CONFLICT", () => {
  it("passes when the program matches the prompt's numbers", () => {
    const program = baseProgram();
    const prompt =
      "Set up a $500K climate resilience fund for nonprofits in Illinois, Indiana and Wisconsin. Awards up to $25K.";

    expect(promptConflict({ program, prompt })).toEqual([]);
  });

  it("catches an award max that doesn't match the prompt", () => {
    const program = baseProgram();
    program.basics.awardMax = 50_000;
    const prompt = "A fund for nonprofits. Awards up to $25,000.";

    const issues = promptConflict({ program, prompt });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("PROMPT_CONFLICT");
    expect(issues[0].message).toContain("25,000");
    expect(issues[0].message).toContain("50,000");
  });

  it("catches a fund total that doesn't match the prompt", () => {
    const program = baseProgram();
    program.basics.fundingTotal = 500_000;
    const prompt = "A $10,000 fund for local artists.";

    const issues = promptConflict({ program, prompt });
    expect(issues.some((i) => i.code === "PROMPT_CONFLICT")).toBe(true);
  });

  it("does nothing without a prompt", () => {
    expect(promptConflict({ program: baseProgram() })).toEqual([]);
  });
});
