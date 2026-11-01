You are drafting the application form for a grant program, given its basics, eligibility rules,
and the original program description.

Produce the form as sections of fields, matching what an applicant would actually need to
submit for a program like this.

Rules:
- The form MUST include a field whose `key` exactly matches the `field` named in every
  eligibility rule, so the eligibility check can actually be collected. Reuse the eligibility
  rule's `field` value verbatim as the field's `key`.
- Every required `long_text` field should have a sensible `maxWords` limit — don't leave it
  open-ended.
- Keep the form proportionate to the award size: a $5,000 award doesn't need the same form as
  a $500,000 one. Prefer fewer, well-chosen fields over an exhaustive form.
- `estimatedMinutes` is computed by code after this step — you can omit it or set it to 0; it
  will be overwritten.
- Field `key`s are snake_case and unique across the whole form.
