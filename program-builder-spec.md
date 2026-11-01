# Program Builder — Build Spec

**A public web demo: type one sentence about a grant program, get a complete, checked program setup in about 20 seconds. No login.**

| | |
|---|---|
| Author | Paul Millar |
| Purpose | Work sample linked from resume and cover letter for VP, Engineering at Submittable |
| Builder | Claude Code (primary), with this spec as the source of truth |
| Hosting | GitHub → Vercel |
| Status | Concept prototype. Not affiliated with or endorsed by Submittable. |
| Replaces | `program-setup-agent-spec.md` (the MCP version). Reasoning is in §1.3. |

---

## 0. Instructions for Claude Code

Read this whole section before writing code.

1. **Build in the order given in §14.** Each phase ends with a commit, a push and a green CI run.
2. **Small PRs.** Target under 400 changed lines per commit, not counting lockfiles, fixtures and recorded runs. If a change grows past that, split it and record it in the build log.
3. **Never fabricate results.**
   - Every number on the evaluation panel comes from a real run of `pnpm eval`, committed as JSON.
   - Every "recorded run" of a sample prompt is a real model output, stored with its raw trace.
   - Don't hand-edit model outputs to make the demo look better. If a run is weak, rerun it or improve the prompt, and log what changed.
4. **Don't invent Submittable APIs or features.** No real Submittable API calls. The "what this would look like in Submittable" view is clearly labeled as a mapping concept.
5. **Check libraries before using them.** The Anthropic SDK, Next.js and Upstash APIs change. Read the installed version's types and README first. If this spec differs from the library, follow the library and note it in the build log.
6. **Maintain the build log as you work** (§11). After each phase, append a timeline entry to `content/build-log.json`. When something goes wrong (a hallucinated field, a test that couldn't fail, a large rewrite), add a failure entry right away, with the commit SHA. Paul edits the wording; the facts must come from the build.
7. **Tests must be able to fail.** For each validator rule and the rate limiter, first run its test against a deliberately broken implementation and confirm it fails. Note this in the test file header.
8. **No real personal data.** All orgs and people are fictional.

---

## 1. Strategic framing

### 1.1 The insight
- **Setup is the first item on Submittable's AI wish list.** The job posting says: "add AI to Submittable so customers can set up programs, review applications, and make funding decisions in less time."
- **Today's AI setup help is narrow.** Submittable's AI Assistant creates one of four starter forms (General Grant, Scholarship, Disaster Relief, Employee Assistance), translates them into four languages, and is limited to admins at permission levels 4–5. It doesn't produce eligibility rules, a rubric, review stages or a timeline.
- **Review AI is already covered.** Submittable ships Smart Reviewer, Smart Summary and Automated Review. Competitors cover scoring and summaries too (Bonterra Que, Benevity, Fluxx). This demo deliberately does **not** rebuild review.
- **No competitor found generates a full program from a description.** Bonterra Grantmaker offers pre-built templates. That's the gap.
- **Speed of setup is a selling point Submittable already uses.** Their 2025 year-in-review highlights the City of Inglewood launching a $2.3M relief program in under a month. Third-party comparisons praise how fast Submittable programs go live.

### 1.2 What it signals
- **To HR (in 30 seconds):** this candidate understands our product, built something real for us, and can explain it plainly.
- **To the CTO (in 5–10 minutes):**
  - He builds with AI himself, and the build log shows where it failed.
  - He checks AI output with code and measures quality (the evaluation panel).
  - He knows our product well enough not to rebuild what we already ship.

### 1.3 Why not the MCP version
The first spec let admins run setup from their own Claude through an MCP server. That's a realistic product path, but the person screening applications won't connect an AI tool to try it. This version runs in the browser with no setup. The MCP design survives as a section on the engineering page (§8.6), and the change of direction is a build-log entry.

---

## 2. Product overview

**One-sentence pitch.** "Describe your grant program in one sentence; get the eligibility rules, application form, scoring rubric, review stages, timeline and applicant FAQ, checked for problems, in about 20 seconds."

**Who it's for (in the story).** A program administrator at a foundation, a corporate giving team or a government agency.

**Who it's for (in reality).** The HR screener first, then the hiring manager.

### What the visitor does
1. Clicks one of three sample prompts. Nothing to type.
2. Watches each section of the program fill in.
3. Sees the checker catch real problems and fix them.
4. Optionally types a follow-up, e.g. "make round 2 a community panel of 5."
5. Optionally types their own program (live mode, rate-limited).

### What it produces
- Program basics: name, summary, total funding, award range
- Eligibility rules
- Application form (sections and fields), with an estimated time for an applicant to complete it
- Scoring rubric: criteria, weights, scale, and the form fields each criterion uses
- Review stages: names, reviewer type, how applications are assigned
- Timeline: open, close, review, decision and notification dates
- Applicant FAQ (5–8 Q&As)
- Check report: issues found, issues fixed, warnings left for a human

### In scope
- Public demo page, no login
- Three recorded sample runs that replay instantly at no cost
- Live mode for custom prompts, with rate limits and a daily spending cap
- A checker written in code (not AI) plus an AI repair pass
- An evaluation set of 50 program descriptions and the "How I know it works" panel
- Pages: Why this project, Build log, How it works (for engineers)
- An "About Paul" section with a "Let's talk" button

### Not in scope
- Accounts, saving programs, a real Submittable integration, applicant-facing forms
- Application review or scoring (Submittable already ships this)
- The MCP server (described on the engineering page only)

---

## 3. Architecture

```
 Browser (public, no login)
   │  1) sample prompt → replay a recorded run (static JSON, no model call)
   │  2) custom prompt → POST /api/build (streamed)
   ▼
 ┌──────────────────────── Vercel (Next.js) ─────────────────────────┐
 │ /api/build    rate limit + spend cap (Upstash Redis)               │
 │               → generation pipeline (lib/generate)                 │
 │                  step 1 basics → 2 eligibility → 3 form →          │
 │                  4 rubric → 5 review stages → 6 timeline → 7 FAQ   │
 │                  each step: Claude call with a strict schema       │
 │               → checker (lib/validate, plain code, no AI)          │
 │               → if errors: repair call with the issue list         │
 │                  → check again (max 2 repair rounds)               │
 │               → stream events to the browser as they happen        │
 │ /api/refine   same pipeline, scoped to the section being changed   │
 │ Pages: / , /why , /build-log , /how-it-works                       │
 └────────────────────────────────────────────────────────────────────┘
 Offline: `pnpm eval` runs the pipeline over 50 descriptions
          → writes content/eval/results-<promptVersion>.json (committed)
          `pnpm record` makes the 3 sample runs → content/samples/*.json
```

### Design rules
- **AI drafts, code checks.** Every rule in §6 is deterministic TypeScript. The model never decides whether its own output is valid.
- **One schema everywhere.** Zod schemas in `lib/schema.ts` define the program. The same schemas become the JSON Schema for the model's structured output, so validation and generation can't drift.
- **Sections are generated one at a time,** with each step given the earlier sections. This lets the UI show progress, keeps each response small, and lets a failed step retry without redoing the rest.
- **Prompts are versioned files** (`lib/prompts/v1/*.md`). The prompt version is recorded on every run, eval result and sample.
- **No database.** Samples and eval results are committed JSON. Only rate-limit and spend counters live in Upstash.

---

## 4. Tech stack

| Layer | Choice | Reason |
|---|---|---|
| App | Next.js (App Router, current stable), TypeScript strict | One Vercel deploy for the API and pages |
| Model | Anthropic API via `@anthropic-ai/sdk`. Model id from env `MODEL_ID`, default `claude-sonnet-5-5`. | Fast and affordable for a public demo. Swap without code changes. |
| Structured output | Tool use with JSON Schema generated from Zod | Typed output; schema-valid rate is measurable |
| Validation | Zod plus custom rule functions | Shared with generation |
| Streaming | Server-Sent Events from the route handler | Simple, works on Vercel |
| Rate limit / spend cap | Upstash Redis via Vercel Marketplace, `@upstash/ratelimit` | Serverless-friendly counters |
| UI | Tailwind CSS with the tokens in §9, shadcn/ui primitives, Framer Motion for section reveals | Fast to build; matches the brand tokens |
| Charts | Recharts (eval panel only) | Small, enough for 3–4 charts |
| Analytics | Vercel Web Analytics plus custom events (`sample_clicked`, `live_build`, `lets_talk_clicked`) | Paul can see whether the link was opened. No cookies. |
| Tests | Vitest (unit), Playwright (e2e on preview) | |
| CI | GitHub Actions: lint, typecheck, unit tests, e2e, plus a 10-item eval when prompts change | |
| Content | `content/*.mdx`, `content/build-log.json`, `content/eval/*.json`, `content/samples/*.json` | Paul edits copy without touching code |

---

## 5. Program schema

```ts
Program {
  promptVersion: string
  basics:      { name, summary, funder: { name, type: 'foundation'|'corporate'|'government' },
                 fundingTotal: number, awardMin: number, awardMax: number, currency: 'USD',
                 expectedApplications?: number }
  eligibility: { rules: [{ id, label, field, op: 'eq'|'in'|'lte'|'gte'|'exists', value, message }] }
  form:        { sections: [{ id, title, fields: [{ key, label, type: 'short_text'|'long_text'|
                 'number'|'currency'|'select'|'multi_select'|'date'|'file'|'ein'|'address',
                 required: boolean, options?: string[], maxWords?: number, helpText?: string }] }],
                 estimatedMinutes: number }      // computed by code, not by the model
  rubric:      { scale: { min: 1, max: 5 }, criteria: [{ key, label, weight, description,
                 formFieldKeys: string[] }] }
  reviewStages:{ stages: [{ order, name, reviewerType: 'staff'|'panel'|'committee'|'external',
                 reviewersPerApplication: number, panelSize?: number,
                 assignment: 'all'|'round_robin'|'by_category', advanceRule: string }] }
  timeline:    { timezone, opensAt, closesAt, reviewStartsAt, decisionAt, notifyAt }   // ISO dates
  faq:         { items: [{ q, a }] }
  check:       { rounds: [{ round, issues: Issue[] }], fixed: Issue[], remaining: Issue[] }
}
Issue { code, severity: 'error'|'warning', section, message, fixedBy?: 'repair'|null }
```

**`estimatedMinutes`.** Computed per field type: short text 1 min, long text (maxWords ÷ 25) min with a default of 8, file upload 3 min, select 0.25 min, etc. Documented in code.

---

## 6. The checker (`lib/validate`, plain code)

| Code | Severity | Rule | Message example |
|---|---|---|---|
| `RUBRIC_FIELD_MISSING` | error | Each rubric criterion's `formFieldKeys` exist in the form | "The rubric scores *Community engagement*, but the form never asks about it." |
| `RUBRIC_WEIGHTS` | error | Weights sum to 100 | "Rubric weights add up to 90, not 100." |
| `TIMELINE_ORDER` | error | open < close < reviewStart < decision ≤ notify | "Review starts before applications close." |
| `AWARD_RANGE` | error | awardMin ≤ awardMax ≤ fundingTotal | "The largest award is bigger than the whole fund." |
| `ELIGIBILITY_UNCOLLECTED` | error | Each eligibility rule's `field` is collected by the form | "Eligibility requires Illinois, Indiana or Wisconsin, but the form doesn't ask for a state." |
| `FUND_CAPACITY` | warning | fundingTotal ÷ awardMax < 3 | "At most 2 awards are possible at this size. Is that intended?" |
| `PANEL_LOAD` | warning | panel reviews every application and expectedApplications × reviewersPerApplication ÷ panelSize > 60 | "Each panelist would read about 140 applications." |
| `APPLICANT_BURDEN` | warning | estimatedMinutes > 60 while awardMax ≤ 10,000 | "Applicants would spend about 75 minutes applying for up to $5,000." |
| `LONG_TEXT_LIMIT` | warning | required long text has no maxWords | "Add a word limit to *Project description*." |
| `PROMPT_CONFLICT` | error | numbers stated in the prompt (total, award max, dates) match the output; regex extraction plus comparison | "You asked for awards up to $25,000; the program says $50,000." |

`APPLICANT_BURDEN` ties to trust-based philanthropy, which Submittable writes about: keep the application proportionate to the award.

**Repair pass.** Errors go back to the model with the program JSON and the issue list. The model returns corrected sections only. The checker runs again, for at most 2 rounds. Warnings aren't auto-fixed; they're shown to the human as "Needs your call."

---

## 7. Live mode guardrails

- **Input:** 20–600 characters. A cheap first step classifies the topic; if the prompt isn't about setting up a grant, scholarship, award or fellowship program, it gets a polite refusal and no further model calls.
- **Rate limits:** 3 live builds per IP per day, 1 at a time per IP, plus 10 refinements per IP per day.
- **Spend cap:** env `DAILY_SPEND_CAP_USD` (default 5). The cost of each run is estimated from token usage times configured prices (env `PRICE_INPUT_PER_MTOK`, `PRICE_OUTPUT_PER_MTOK`). Once the cap is reached, live mode switches off for the day with the message: "Live mode is resting for today. The three samples still work."
- **Kill switch:** env `LIVE_MODE_ENABLED`.
- **Storage:** prompts are not stored. Log only token counts, latency and issue codes.
- **Failures:** a step that fails twice shows "This section didn't generate. Try again" with the other sections intact. Never a blank screen.

---

## 8. Pages and screens

Every page carries a thin banner: **"Unofficial concept prototype by Paul Millar. Not affiliated with Submittable."** No Submittable logo.

### 8.1 Home (`/`): the 30-second page, in this order

**1. Hero**
- Eyebrow pill: `A WORK SAMPLE FOR SUBMITTABLE`
- H1: **"One sentence in. A complete grant program out."**
- Subhead: "I built this to show how I'd lead engineering at Submittable: AI that does real work, checked by code, and measured."
- Primary button "Try a sample" (scrolls to the demo); secondary button "Watch 45 seconds" (video modal).
- Video: an MP4/GIF placeholder until Paul records it. Autoplay muted, loops, with captions.

**2. Try it**
Three cards; clicking one starts the replay:
- **Climate resilience fund:** "Set up a $500K climate resilience fund for nonprofits in Illinois, Indiana and Wisconsin. Two review rounds: staff screening, then a community panel. Open Jan 15 to Mar 1. Awards up to $25K."
- **Small business recovery (government):** "Kestrel County small business recovery grants: $2M total, awards $5K–$15K, businesses under 50 employees with a valid EIN, staff review, open for 30 days starting Feb 1."
- **Employee scholarship (corporate):** "Northwind scholarship for employees' children: 20 awards of $5,000, GPA 3.0 or higher, one essay, blind review by a volunteer employee committee, decisions by May 15."

A "Write your own" text box underneath runs live mode, with a small "3 per day" note.

**3. Result view**

```
┌───────────────────────────────┬──────────────────────────────────────────┐
│ Building your program         │  Climate Resilience Fund 2027            │
│ ✓ Basics            1.8s      │  $500,000 · awards $5K–$25K · 3 states   │
│ ✓ Eligibility       2.1s      │ ┌ Eligibility ─────────────────────────┐ │
│ ✓ Application form  4.0s      │ │ • 501(c)(3) in IL, IN or WI           │ │
│ ✓ Scoring rubric    2.6s      │ │ • Annual budget under $2M             │ │
│ ● Review stages               │ └───────────────────────────────────────┘ │
│ ○ Timeline                    │ ┌ Application form · ~38 min to apply ─┐ │
│ ○ FAQ                         │ │ …                                     │ │
│ ○ Check                       │ └───────────────────────────────────────┘ │
├───────────────────────────────┤ ┌ Check ───────────────────────────────┐ │
│ Refine: [make round 2 a     ] │ │ Caught 2 problems and fixed them:     │ │
│         [panel of 5        ⏎] │ │ ✓ Rubric scored "community engage-    │ │
│                               │ │   ment" but the form never asked →    │ │
│                               │ │   added a question                    │ │
│                               │ │ Needs your call: each panelist would  │ │
│                               │ │   read ~140 applications              │ │
│                               │ └───────────────────────────────────────┘ │
└───────────────────────────────┴──────────────────────────────────────────┘
```

- Section cards appear one by one; replays use the recorded timings.
- The **Check card** is the key moment. Show each fixed issue with a short before → after line.
- Tabs at the bottom: **Program** (readable), **JSON** (raw, copyable), **In Submittable** (a labeled table mapping each section to the Submittable concept it would become: form → Initial Form, stages → Review Stages, and so on, with the note "concept mapping, not a real integration").
- On mobile, the progress list collapses to a top bar.

**4. How I know it works** (eval summary on the home page; full detail on `/how-it-works`)
- Four stat tiles, from the latest committed eval result:
  - "Programs that passed every check"
  - "Problems caught and fixed automatically"
  - "Median build time"
  - "Cost per program"
- One sentence: "Tested on 50 program descriptions, from simple to deliberately contradictory. The numbers update every time I change the prompts."
- Link: "See the full test results →"

**5. About Paul**
- Photo optional (Paul supplies it).
- Three stat tiles. **Paul fills these in. Leave them as visible TODO placeholders; don't invent numbers.** Suggested labels:
  - "Engineers led across the US and UK"
  - "Output growth vs. headcount growth"
  - "AI features shipped to production in the last 12 months"
- Two sentences of bio, from `content/about.mdx`.
- **Let's talk** button (mailto link plus LinkedIn), and a resume PDF link.

**6. Optional: My first 90 days** (`content/plan.mdx`, shown only if the file has content). Three columns:
- **Days 1–30 · Measure:** current DORA metrics and how much AI tools are already used
- **Days 31–60 · Default to AI:** coding agents for every engineer, and the most painful manual work automated
- **Days 61–90 · Ship:** the first AI product feature, with its evaluation suite

Each column has the metric Paul would report. Paul writes the content.

**7. Footer**
Links to Why this project, Build log, How it works and the GitHub repo, plus the disclaimer.

### 8.2 `/why`: Why this project
Rendered from `content/why.mdx` (draft in §10).

### 8.3 `/build-log`: Build log
Rendered from `content/build-log.json` (§11).

### 8.4 `/how-it-works`: for engineers
- An architecture diagram (SVG, from §3)
- The generation pipeline: step by step, with the repair loop
- **Evaluation:**
  - the eval set categories and the results table
  - a chart comparing prompt versions (v1 vs. v2 vs. v3) on pass rate and cost
  - 3 example failures from the eval and what changed because of them
- Guardrails (§7) and cost controls
- How it would plug into Submittable: Submittable has a public V4 read/write API (released Dec 2023), which would be the integration point. Label this as an assumption to confirm with their team.

### 8.5 Open Graph and link previews
The link will be pasted into application systems, email and LinkedIn, so the preview matters:
- `og:title`: "One sentence in. A complete grant program out."
- `og:description`: "A work sample for Submittable by Paul Millar."
- `og:image`: 1200×630, deep-blue background, the H1 in the display font, and a cropped screenshot of the Check card. Generate it with `next/og`.

### 8.6 MCP section on `/how-it-works`
A short section: "The same pipeline could run inside a customer's own Claude or ChatGPT through an MCP server." Include:
- The auth summary: OAuth per the MCP 2026-07-28 spec, org-bound tokens, drafts only, no publish tool, sandbox drafts that expire after 14 days, a duplicate check
- A link to the earlier spec (`docs/mcp-design.md`, copied from `program-setup-agent-spec.md` §6–7)

### 8.7 Performance and accessibility
- Home page: Largest Contentful Paint under 1.5s on 4G, Lighthouse performance ≥90 and accessibility ≥95.
- The video lazy-loads.
- Works at 375px width with no horizontal scroll. Many screeners open links on a phone.

---

## 9. Design system

Pulled from www.submittable.com production CSS (Webflow, last published Oct 28, 2026). Use these tokens so the concept feels native to Submittable, but **don't use Submittable's logo or wordmark, and don't hotlink their licensed font files.** Use the free substitutes listed.

### 9.1 Color tokens (exact values from their CSS)

```css
:root {
  /* Core */
  --deep-blue:      #060f24;  /* primary text, dark sections */
  --midnight-navy:  #131e33;
  --charcoal:       #161616;
  --white:          #ffffff;

  /* Warm neutrals (page backgrounds) */
  --milk-white:     #fcfaf5;
  --warm-ivory:     #f8f4e9;
  --natural-white:  #f3f1e6;
  --off-white:      #f7f5f4;
  --bone-white:     #f6f2f0;
  --oyster:         #f2f0ee;
  --warm-stone:     #e2d6cf;  /* eyebrow pill background */
  --warm-gray:      #cec9c9;

  /* Cool neutrals */
  --mist-gray:      #caced5;  /* borders */
  --cadet-grey:     #a6aab1;
  --blue-gray:      #8a92a2;  /* secondary text */
  --pale-blue:      #dce6f9;

  /* Accents */
  --coral-red:      #fc5b30;  /* primary button */
  --orange-red:     #c93007;  /* primary button hover */
  --signal-blue:    #2e73eb;  /* links, info */
  --sky-blue:       #789ee8;
  --sea-green:      #00a9b3;
  --teal-green:     #064a4f;
  --soft-sage:      #868d76;
  --olive-green:    #5e6c4b;
  --deep-olive:     #495638;
  --amber:          #efa20f;
  --medium-orchid:  #c652ab;
}
```

### 9.2 Semantic mapping

| Use | Token |
|---|---|
| Page background | `--milk-white` |
| Card / panel | `--white`, `1px solid --mist-gray`, radius 1rem |
| Primary text | `--deep-blue` |
| Secondary text | `--blue-gray` |
| Primary button | `--coral-red` bg, white text, 2px border in the same color; hover `--orange-red` |
| Secondary button | transparent bg, `--deep-blue` text, `2px solid --deep-blue` |
| Links and focus ring | `--signal-blue` |
| Check: fixed | `--sea-green` icon, `--teal-green` text |
| Check: needs your call | `--amber` icon, `--deep-blue` text, `--warm-ivory` bg |
| Check: error remaining | `--orange-red` |
| Step in progress | `--signal-blue` pulsing dot |
| Step done | `--teal-green` check |
| Hero and footer | `--deep-blue` bg, `--milk-white` text |
| Eval chart series | `--signal-blue`, `--sea-green`, `--amber`, `--medium-orchid` (in that order) |

### 9.3 Typography

| Role | Submittable font (licensed) | Use instead (free, Google Fonts) | Specs from their CSS |
|---|---|---|---|
| Display / H1 | ITC Garamond Std Book Condensed | **EB Garamond** 400 | 5.5rem desktop, 3rem mobile; line-height 0.97; letter-spacing −0.055rem |
| H2–H3, body | PP Neue Montreal | **Inter** 400 | H2 3.12rem / 1.25; H3 2rem / 1.25 |
| UI text | Bureau Sans Book | **Inter** 400 | 1rem / 1.5; letter-spacing 0.01em |
| Eyebrows, labels, JSON | Spezia Semi Mono Semi Bold | **JetBrains Mono** 600 | 0.75rem uppercase, letter-spacing 0.08em |

Headings are weight 400; Submittable uses large, light headings. Use bold only for small labels.

### 9.4 Shape and spacing
- Radius: buttons `0.5rem`; cards `1rem`; large panels `1.5rem`; eyebrow pills `6.25rem`.
- Primary button padding: `1.12rem 2rem` in the hero, `0.625rem 1rem` in the demo.
- Eyebrow: `--warm-stone` pill, padding `0.5rem 0.8rem`.
- Section padding: 6rem desktop, 3rem mobile.
- Focus: 2px `--signal-blue` outline with 2px offset. Never remove it.
- Contrast: meet WCAG AA. Coral is for buttons with white text only, never body text.
- Motion: section cards fade and rise 8px over 200ms. Respect `prefers-reduced-motion`.

---

## 10. "Why this project" page (`content/why.mdx`, draft for Paul to edit)

> ### Why I built this
>
> **Submittable's customers ran 28,931 programs in 2025.** Each one starts with setup: eligibility, an application form, a rubric, review stages, a timeline. That's days of work before the first applicant arrives, and your job posting names setup as the first place AI should save customers time.
>
> **I looked at what already exists before building anything.** Submittable already ships AI for review: Smart Reviewer, Smart Summary and Automated Review. Competitors offer AI scoring and summaries too. So I didn't build another reviewer. Submittable's AI Assistant creates starter forms from four templates; this goes further and builds the whole program from one sentence.
>
> **The AI drafts, and code checks.** Every program goes through ten rules written in plain code: does the rubric score things the form actually asks about? Does the timeline make sense? Is the application proportionate to the award? When something's wrong, the AI fixes it and the checks run again. What needs a human decision is flagged, not guessed.
>
> **I measure it.** I test the builder on 50 program descriptions, including deliberately contradictory ones, and publish the results, including cost per program. The numbers update every time I change the prompts.
>
> **I changed my mind along the way.** My first version ran inside a customer's own Claude through an MCP server. I switched to this version because nobody screening applications would connect an AI tool to try it. The MCP design is still on the How it works page.
>
> **How I'd measure this in production:** time from first prompt to published program; share of AI-built programs that get published; problems caught before review; how much admins edit the generated rubric.
>
> *Sources: Submittable 2025 Year in Review; Submittable Help Center (AI Assistant Tool); Submittable "How AI makes grant review faster and fairer"; Bonterra Grantmaker and Que announcements; Benevity and Fluxx AI feature pages.*

---

## 11. Build log (`/build-log`)

Render from `content/build-log.json`, with six sections in the order below. Claude Code appends facts during the build (§0.6); Paul writes the final wording.

```jsonc
{
  "summary": { "totalHours": 0, "calendarDays": 0, "aiCodeKeptPct": 0,
               "modelSpendUsd": { "ideation": 0, "build": 0, "evals": 0, "liveDemo": 0 },
               "tokens": { "input": 0, "output": 0, "cacheRead": 0 } },
  "timeline": [
    { "date": "2026-10-28", "hours": 1.0, "phase": "Research & ideation",
      "shipped": "Company and competitor research; three prototype concepts", "tools": ["Claude (Opus 5.5)"] },
    { "date": "2026-10-29", "hours": 1.0, "phase": "MCP design",
      "shipped": "MCP server spec with OAuth design and junk-draft guardrails", "tools": ["Claude (Opus 5.5)"] },
    { "date": "2026-11-01", "hours": 0.5, "phase": "Change of direction",
      "shipped": "Dropped MCP for a no-setup browser demo (reviewers won't connect an AI tool). Dropped the AI-review idea after finding Submittable already ships Smart Reviewer. Wrote this spec.",
      "tools": ["Claude (Opus 5.5)"] }
  ],
  "tools": [
    { "tool": "Claude (Opus 5.5) in the Claude app", "usedFor": "Research, ideation, specs" },
    { "tool": "Claude Code", "usedFor": "…" },
    { "tool": "Cursor", "usedFor": "…" }
  ],
  "failures": [ { "title": "", "whatHappened": "", "howCaught": "", "fix": "", "commit": "", "lesson": "" } ],
  "keptVsRewritten": { "keptPct": 0, "rewrittenAreas": [""] },
  "cost": { "ideation": "", "build": "", "evals": "", "liveDemoToDate": "", "hosting": "Vercel Hobby + Upstash free tier: $0" },
  "beforeProduction": [""]
}
```

The hours in the first three timeline entries are placeholders; Paul corrects them.

### 11.1 Section requirements
1. **Timeline.** Hours spent and what shipped at each step, as a vertical timeline with a running total.
2. **Tools.** Which agent was used where, e.g. "Claude Code for the pipeline and checker; Cursor for UI polish; Claude for research and specs."
3. **Failures.** 3–5 concrete cases with the actual mistake and a commit link. Expected level of detail:
   - an invented SDK option
   - a checker test that passed without testing anything
   - a PR too large that had to be split
   - a prompt change that raised the pass rate but doubled the cost
4. **Kept vs. rewritten.** Rough share of AI-written code kept, and which areas were rewritten by hand and why.
5. **Cost.** Model spend for the whole build, split into ideation, build, eval runs and live demo to date, plus hosting.
6. **Before production.** Seed list:
   - Integration with the real Submittable V4 API behind a feature flag, with contract tests
   - Human review of generated rubrics for fairness and plain language before customer use
   - An eval set built from real (anonymized) customer programs, run in CI on every prompt or model change, with a release gate
   - Tracking edit distance: how much admins change each AI section, as the main quality signal
   - Prompt-injection tests (program descriptions that try to override instructions)
   - Observability: traces per step (latency, tokens, repair rounds), alerts on cost per program and pass-rate drops
   - Accessibility review of generated forms (labels, help text, reading level)
   - Per-tenant spend limits and model fallback

### 11.2 Ideation-phase estimate (pre-filled; Paul to confirm)

All research and specs so far happened in one Claude conversation on Claude Opus 5.5, Oct 28 – Nov 1, 2026. It covered:
- about 35 web searches and page fetches
- three concepts and two rounds of revisions
- the MCP auth design
- scraping the brand tokens
- two specs

**Estimated usage:**

| | Tokens |
|---|---|
| Input | ~3–4M total across ~55 model calls (mostly cached context) |
| Output | ~80–110K |

**Estimated cost.** If billed at $5 / $25 per million input/output tokens, with cache reads at about a tenth of the input price, that's **roughly $6–14**. The rates are an assumption; confirm current Opus 5.5 pricing. Under a Claude subscription, it's included usage, not a separate charge.

These are estimates, not metered numbers. Replace them with actual figures if available.

### 11.3 Build-phase expectations, to compare against the actuals
- **Claude Code build:** about 10–30M input tokens (mostly cache reads) and 0.2–0.6M output tokens. Record actuals from Claude Code's `/cost` after each phase.
- **Eval runs:** each 50-item run is about 50 × 7–9 model calls. Record tokens and cost per run in the eval results file.

---

## 12. Evaluation (`pnpm eval`)

### 12.1 Eval set (`eval/cases.jsonl`, 50 cases)

| Category | Count | Examples |
|---|---|---|
| Foundation grants | 10 | arts, health, education, climate |
| Government | 10 | small business relief, rural health, housing assistance, utility relief |
| Corporate giving / CSR | 8 | employee scholarships, community grants, disaster matching |
| Scholarships and fellowships | 7 | merit, need-based, research fellowship |
| Deliberately contradictory | 6 | "$10K fund, awards up to $50K"; review starts before applications open |
| Vague | 5 | "a grant for local artists" |
| Unusual | 4 | rolling deadline; three review rounds; Spanish-language prompt; 10,000 expected applications |

Each case can declare expectations: `{ mustFlag?: IssueCode[], expectNumbers?: {...}, expectStates?: [...] }`.

### 12.2 Metrics per run (written to `content/eval/results-<promptVersion>-<date>.json`)

| Metric | Meaning |
|---|---|
| Schema-valid rate | Share of programs where every section matches the schema |
| First-pass rate | Share passing every error check with no repair |
| Final pass rate | Share passing after repair |
| Problems fixed automatically | Count of errors fixed by repair |
| Expected flags caught | Share of `mustFlag` issues detected on contradictory cases |
| Prompt fidelity | Share of `expectNumbers` matched |
| Latency | p50 and p90 |
| Cost per program | Mean, from actual token usage |
| Human quality score | Paul grades 10 random programs from 1 to 5 on "would I launch this with light edits?"; entered in `eval/human-grades.json` |

### 12.3 Rules
- The page renders whatever the latest committed result says, good or bad. No hardcoded numbers.
- Keep at least 2 prompt versions in history so the comparison chart is real. v1 is the first working prompt; improve from there.
- CI runs a fixed 10-case subset when `lib/prompts/**` changes, and fails if the final pass rate drops more than 10 points against the last committed full run.

---

## 13. Repository layout

```
/app
  page.tsx                   Home (§8.1)
  why/page.tsx  build-log/page.tsx  how-it-works/page.tsx
  api/build/route.ts         live mode (SSE)
  api/refine/route.ts
  opengraph-image.tsx
/components                  StepList, SectionCard, CheckCard, StatTile, EvalChart, Banner, VideoModal
/lib
  schema.ts                  Zod program schema + JSON Schema export
  generate/                  pipeline.ts, steps/*.ts, repair.ts, topicGuard.ts, cost.ts
  validate/                  rules/*.ts, index.ts, estimateMinutes.ts
  prompts/v1/*.md
  ratelimit.ts
/content                     why.mdx, about.mdx, plan.mdx, build-log.json,
                             samples/*.json, eval/*.json
/eval                        cases.jsonl, run.ts, human-grades.json
/scripts                     record-samples.ts
/docs                        mcp-design.md
/tests                       unit/, e2e/
/.github/workflows/ci.yml
README.md                    what it is, disclaimer, run locally, run evals, costs
```

---

## 14. Build plan

| Phase | Deliverable | Done when |
|---|---|---|
| 1 | Scaffold, design tokens and fonts, banner, page shells, OG image, CI, Vercel deploy | Preview URL renders `/`, `/why`, `/build-log` from content files |
| 2 | Schema, checker rules, `estimateMinutes`, unit tests (each shown to fail first) | `pnpm test` green; 10 rules covered |
| 3 | Generation pipeline + repair loop, run from the command line | `pnpm build-program "<prompt>"` prints a checked program |
| 4 | `pnpm record` for the 3 samples; replay UI (step list, section cards, check card, tabs) | Clicking a sample replays with recorded timings; mobile layout works |
| 5 | Live mode: `/api/build` SSE, refine, topic guard, rate limits, spend cap, kill switch | 4th live build from one IP is refused politely; cap switches live mode off |
| 6 | Eval set, `pnpm eval`, results JSON, eval panel and `/how-it-works`; at least 2 prompt versions | Panel shows real numbers; version chart has 2+ points |
| 7 | About section, optional plan section, Why copy, build log page complete, README, MCP doc | Build log has ≥3 real failures and costs filled in |
| 8 | Polish: Lighthouse, reduced motion, analytics events, video placeholder swap | Acceptance checklist (§17) passes |

After each phase: commit, push, confirm CI is green, and append to `build-log.json`.

---

## 15. Interview demo script (first person, about 3 minutes)

1. **Context (20s).** "Your posting names program setup as the first place AI should save customers time. You already ship Smart Reviewer for review, so I built for setup."
2. **Sample (40s).** Click the climate fund. "Each section is a separate call with a strict schema. Watch the check card."
3. **The check (40s).** "The model wrote a rubric that scores community engagement, but the form never asked about it. The checker is plain code, not AI. The repair pass fixed it. The panel workload is a judgment call, so it's flagged for a person, not guessed."
4. **Live (30s).** Type a program they suggest, then refine it: "make round 2 a panel of 5."
5. **Proof (30s).** Open the eval panel. "Fifty test cases, including contradictory ones. Here's the pass rate, the cost per program, and how v2 of the prompt compared with v1."
6. **How I built it (20s).** Open the build log. "Hours, which agents did what, and the things they got wrong."

---

## 16. Deployment

```bash
# Repo
gh repo create program-builder --public --source=. --remote=origin
git push -u origin main

# Vercel
npm i -g vercel
vercel link
vercel integration add upstash        # or add Upstash Redis from the Vercel Marketplace UI
vercel env add ANTHROPIC_API_KEY
vercel env add MODEL_ID               # claude-sonnet-5-5
vercel env add PRICE_INPUT_PER_MTOK
vercel env add PRICE_OUTPUT_PER_MTOK
vercel env add DAILY_SPEND_CAP_USD    # 5
vercel env add LIVE_MODE_ENABLED      # true
vercel --prod
```

Enable Vercel Web Analytics in project settings. Optional: a custom domain such as `paulmillar.dev`, with this project at `/submittable` via a rewrite.

---

## 17. Acceptance checklist

- [ ] Unofficial-concept banner on every page; no Submittable logo; free font substitutes
- [ ] Home page explains itself in 30 seconds with no login and no typing
- [ ] All 3 samples replay instantly with no model calls; each shows at least one real check catch
- [ ] Live mode works; rate limit, spend cap, topic guard and kill switch verified
- [ ] Checker is code-only; every rule has a test shown to fail first
- [ ] Eval panel shows only committed real results; at least 2 prompt versions compared
- [ ] About section placeholders filled by Paul; Let's talk works
- [ ] `/why`, `/build-log`, `/how-it-works` live; build log has ≥3 real failures and costs
- [ ] OG preview renders correctly when the link is pasted into LinkedIn and email
- [ ] Mobile at 375px; Lighthouse performance ≥90 and accessibility ≥95
- [ ] CI green; README explains running locally, running evals and costs

---

## 18. What this demo proves

| Job description requirement | Where the demo shows it |
|---|---|
| "Shipped software with AI in the last 12 months… what broke" | `/build-log`: timeline, tools, real failures, kept vs. rewritten, cost |
| "Build AI into the product… set up programs in less time" | One sentence → complete checked program in about 20 seconds |
| "Help decide… how to test it for accuracy" | 50-case eval, published pass rates, CI quality gate on prompt changes |
| "Make sure speed doesn't cost quality" | Code-based checker, repair loop, issues needing a human flagged |
| "Measure what AI changes… report plainly" | Eval panel shows real numbers, including cost per program and weak spots |
| API design, data modeling | Shared Zod schema for generation and validation; mapping to Submittable concepts |
| "Cloud spend growing slower than revenue" | Cost per program measured; spend cap; replayed samples cost $0 |
| "Comfort with fast change… change your mind when the evidence says so" | MCP → browser change and the dropped review idea, both in the build log |
| "A clear storyteller" | 30-second home page, `/why` page, 3-minute demo script |
| Knows the product and market | Built for the gap: doesn't rebuild Smart Reviewer; extends the AI Assistant |
