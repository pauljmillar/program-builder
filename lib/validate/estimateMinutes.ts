import type { Form, FormField } from "@/lib/schema";

/**
 * Minutes an applicant spends on one field, by type. From spec §5: short text 1 min,
 * long text (maxWords ÷ 25) min with a default of 8, file upload 3 min, select 0.25 min.
 * The remaining types are estimated on the same scale (quick-entry fields near 0.5,
 * address as a small multi-part form).
 */
const MINUTES_BY_TYPE: Record<FormField["type"], number> = {
  short_text: 1,
  long_text: 8, // default; overridden by maxWords below
  number: 0.5,
  currency: 0.5,
  select: 0.25,
  multi_select: 0.5,
  date: 0.5,
  file: 3,
  ein: 0.5,
  address: 1.5,
};

const LONG_TEXT_WORDS_PER_MINUTE = 25;

export function estimateFieldMinutes(field: FormField): number {
  if (field.type === "long_text") {
    return field.maxWords ? field.maxWords / LONG_TEXT_WORDS_PER_MINUTE : MINUTES_BY_TYPE.long_text;
  }
  return MINUTES_BY_TYPE[field.type];
}

export function estimateFormMinutes(form: Pick<Form, "sections">): number {
  const total = form.sections.reduce(
    (sectionSum, section) =>
      sectionSum + section.fields.reduce((fieldSum, field) => fieldSum + estimateFieldMinutes(field), 0),
    0
  );
  return Math.round(total * 10) / 10;
}
