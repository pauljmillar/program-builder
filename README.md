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
pnpm eval                                                         # runs the 50-case eval set
```

Eval results are committed to `content/eval/results-<promptVersion>-<date>.json`. The home page
and `/how-it-works` read directly from the latest committed file — nothing is hardcoded.

## Costs

Hosting is Vercel Hobby + Upstash free tier ($0). Model spend is tracked in
[`/build-log`](https://program-builder-gamma.vercel.app/build-log), split into ideation, build, eval
runs and live demo usage.

## Stack

Next.js (App Router, TypeScript strict) · Anthropic API · Zod · Tailwind CSS · Vitest ·
Playwright · GitHub Actions · Vercel · Upstash Redis (rate limiting, live mode only)

See `program-builder-spec.md` for the full build spec.
