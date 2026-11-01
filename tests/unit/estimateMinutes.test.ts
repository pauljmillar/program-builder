// Can this test fail? Yes: each assertion checks a specific numeric output per
// field type; a broken formula (e.g. a stub returning 0) fails every assertion here.
import { describe, expect, it } from "vitest";
import { estimateFieldMinutes, estimateFormMinutes } from "@/lib/validate/estimateMinutes";
import type { FormField } from "@/lib/schema";

function field(partial: Partial<FormField>): FormField {
  return { key: "k", label: "L", type: "short_text", required: true, ...partial };
}

describe("estimateFieldMinutes", () => {
  it("short text is 1 minute", () => {
    expect(estimateFieldMinutes(field({ type: "short_text" }))).toBe(1);
  });

  it("long text defaults to 8 minutes with no maxWords", () => {
    expect(estimateFieldMinutes(field({ type: "long_text" }))).toBe(8);
  });

  it("long text scales with maxWords / 25", () => {
    expect(estimateFieldMinutes(field({ type: "long_text", maxWords: 250 }))).toBe(10);
  });

  it("select is 0.25 minutes", () => {
    expect(estimateFieldMinutes(field({ type: "select" }))).toBe(0.25);
  });

  it("file upload is 3 minutes", () => {
    expect(estimateFieldMinutes(field({ type: "file" }))).toBe(3);
  });
});

describe("estimateFormMinutes", () => {
  it("sums every field across every section", () => {
    const minutes = estimateFormMinutes({
      sections: [
        { id: "s1", title: "A", fields: [field({ type: "short_text" }), field({ type: "select" })] },
        { id: "s2", title: "B", fields: [field({ type: "long_text", maxWords: 250 })] },
      ],
    });

    // estimateFormMinutes rounds to 1 decimal; 11.25 rounds up to 11.3.
    expect(minutes).toBe(11.3);
  });
});
