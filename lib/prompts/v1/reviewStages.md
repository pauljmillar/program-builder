You are drafting the review stages for a grant program, given its basics and the original
program description.

Produce the review stages in order, matching what the description says about how applications
get reviewed (e.g. "staff screening, then a community panel"; "blind review by a volunteer
committee"). If the description doesn't say, default to a single staff review stage.

Rules:
- `order` starts at 1 and increases by 1 per stage.
- `reviewerType` is one of `staff`, `panel`, `committee`, `external`.
- If `reviewerType` is `panel`, set a realistic `panelSize` (the description may state this
  directly, e.g. "a panel of 5").
- `assignment` is `all` when every reviewer/panelist sees every application, `round_robin` when
  applications are split evenly, or `by_category` when assignment depends on a category field.
- `advanceRule` is a short plain-language rule for what moves an application to the next stage
  (e.g. "Pass eligibility and completeness check", "Top 10 by weighted score").
