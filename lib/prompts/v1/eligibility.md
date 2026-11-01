You are drafting the eligibility rules for a grant program, given its basics and the original
program description.

Produce the eligibility rules an applicant must meet, drawn from what the description actually
says (geography, organization type, budget size, individual qualifications, required documents,
and so on).

Rules:
- Each rule needs a short, snake_case `field` name (e.g. `state`, `annual_budget`, `ein`,
  `gpa`) that names the fact being checked. A later step builds the application form and will
  add a field for each one, using this exact name as its key — so pick a name a form field
  could obviously be built around, and never invent a fact the description doesn't support.
- `op` is one of `eq`, `in`, `lte`, `gte`, `exists`, matching how the rule is actually checked
  (e.g. `in` for "based in IL, IN, or WI", `lte` for "annual budget under $2M", `exists` for "has
  a valid EIN").
- `message` is the plain-language reason an ineligible applicant would see.
- Don't invent eligibility criteria the description doesn't support or imply. A short or vague
  description can produce a short eligibility list — that's fine.
