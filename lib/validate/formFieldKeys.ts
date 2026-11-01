import type { DraftProgram } from "@/lib/schema";

export function allFormFieldKeys(program: DraftProgram): Set<string> {
  const keys = new Set<string>();
  for (const section of program.form.sections) {
    for (const field of section.fields) {
      keys.add(field.key);
    }
  }
  return keys;
}
