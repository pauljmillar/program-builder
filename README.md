# Program Builder

Describe a grant program in one sentence; get the eligibility rules, application form, scoring
rubric, review stages, timeline and applicant FAQ, checked for problems, in about 20 seconds.

A work sample built by Paul Millar, linked from his resume and cover letter for the VP,
Engineering role at Submittable. Concept prototype — not affiliated with or endorsed by
Submittable. No real Submittable API calls are made; the "In Submittable" view is a labeled
concept mapping, not an integration.

See [`/why`](https://program-builder-gamma.vercel.app/why) for the reasoning,
[`/build-log`](https://program-builder-gamma.vercel.app/build-log) for how it was actually built, and
[`/how-it-works`](https://program-builder-gamma.vercel.app/how-it-works) for the architecture and
evaluation results.

## Running locally

```bash
pnpm install
cp .env.example .env.local   # add your own ANTHROPIC_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running evals

```bash
pnpm build-program "Set up a $500K climate resilience fund..."   # one program, prints JSON
pnpm record                                                       # regenerates the 3 recorded samples
pnpm eval v1                                                      # runs the 50-case eval set against prompt v1
pnpm eval:gate v1                                                 # the 10-case CI subset, compared to the last full run
```

Eval results are committed to `content/eval/results-<promptVersion>-<date>.json`. The home page
and `/how-it-works` read directly from the latest committed file for the prompt version actually
in use — nothing is hardcoded. `eval:gate` runs automatically in CI whenever `lib/prompts/**`
changes, and fails the build if the pass rate drops more than 10 points.

## Costs

Hosting is Vercel Hobby + Upstash free tier ($0). Model spend is tracked in
[`/build-log`](https://program-builder-gamma.vercel.app/build-log), split into ideation, build, eval
runs and live demo usage.

## Stack

Next.js (App Router, TypeScript strict) · Anthropic API · Zod · Tailwind CSS · Vitest ·
GitHub Actions · Vercel. Upstash Redis is designed in for live-mode rate limiting but not
deployed yet — see `/build-log`.

See `program-builder-spec.md` for the full build spec.
