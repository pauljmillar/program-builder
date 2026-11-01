# Program Setup Agent — Build Spec

**An MCP server that lets a Submittable admin set up a complete grant program from their own AI tool (Claude, ChatGPT, Copilot).**

| | |
|---|---|
| Author | Paul Millar |
| Purpose | Work sample submitted with application for VP, Engineering at Submittable |
| Builder | Claude Code (primary), with this spec as the source of truth |
| Hosting | GitHub → Vercel |
| Status | Concept prototype. Not affiliated with or endorsed by Submittable. |

---

## 0. Instructions for Claude Code

Read this whole section before writing code.

1. **Build in the order given in §14 (Build Plan).** Each phase ends with a commit and a passing CI run.
2. **Keep PRs small.** Target under 400 changed lines per commit or PR, not counting lockfiles and seed data. If a change grows past that, split it and record it in the build log.
3. **Do not invent Submittable APIs.** Submittable's real API is not used. The whole backend is a mock that lives in this repo, and the UI and README must say so.
4. **Verify libraries before using them.** MCP SDKs, `mcp-handler` and identity-provider SDKs change often. Check the installed version's README and types before writing calls. If an API in this spec doesn't match the installed version, follow the library and note the difference in the build log.
5. **Maintain the build log as you work** (§11). After each phase, append a timeline entry to `content/build-log.json`. When something goes wrong (a hallucinated field, a test that didn't test anything, a fix that needed a rewrite), add a failure entry right away, with the commit SHA. Don't wait until the end. Paul will edit the wording, but the facts must come from the actual build.
6. **Tests must be able to fail.** For every auth and authorization test, first run it against a deliberately broken implementation and confirm it fails, then restore. Record that you did this in the test file's header comment.
7. **No real personal data.** All orgs, people and programs are fictional.

---

## 1. Strategic framing

**The insight.** Submittable's AI today is mostly *inside* the app, and narrow:
- The AI Assistant generates one of four starter forms ("General Grant", "Scholarship", "Disaster Relief", "Employee Assistance"), only for admins at permission levels 4–5.
- Automated Review is a premium, sales-led add-on.
- The 2025 year-in-review listed no new AI features.

Meanwhile, competitors are opening their data to customers' own AI tools:
- **Fluxx** ships an MCP server alongside its "Finn" assistant. It answers questions about data but doesn't *do* setup work.
- **Bonterra** launched "Que" agentic skills (Oct 2025).
- **Benevity** shipped AI grant summaries (Mar 2026).

**The bet.** Program setup is the slowest, most configuration-heavy step for an admin, and it touches *configuration, not applicant personal data*. That makes it a safe first workload to expose through MCP. One set of tools serves both the customer's own AI tool and, later, an in-app assistant. When the customer works from their own AI subscription, Submittable doesn't pay for those model calls.

**What it signals to the hiring team.**
- Hands-on: Paul built it himself with AI coding agents, and the build log shows what broke.
- API and auth design that follows the current MCP authorization spec (2026-07-28).
- Submittable's own Responsible AI Principles turned into product behavior: human control, traceable and reversible actions, opt-in.
- Second-order thinking: it anticipates the junk-draft problem that a frictionless tool creates and designs around it.

---

## 2. Product overview

**One-sentence pitch.** "Describe your grant program in plain English in Claude; get a complete, validated draft in Submittable in about 60 seconds, and nothing goes live until a human clicks Publish."

**Target user.** Program administrator at a foundation, a corporate CSR team, or a government agency (permission level 3–5).

**Example prompt the demo must handle:**
> "Set up a $500K climate resilience fund for nonprofits in Illinois, Indiana and Wisconsin. Two review rounds: staff screening, then a community panel. Applications open January 15, close March 1. Awards up to $25K."

**What the agent produces** (as a sandbox draft):
- Eligibility rules (geography, org type, budget cap)
- Application form (sections and fields)
- Scoring rubric (criteria, weights, scale)
- Review stages (names, reviewer roles, assignment rule)
- Timeline (open, close, review, decision, notification)
- Draft applicant FAQ (5–8 Q&As)
- Validation report (problems found and fixed, or flagged)

**In scope**
- Remote MCP server (Streamable HTTP) with OAuth that follows the MCP 2026-07-28 authorization spec
- Mock multi-tenant backend: orgs, users, roles, programs
- Web console: programs list, program preview, activity log with undo, connected AI apps, settings
- Public pages: landing, "Why this project", build log
- Junk-draft guardrails: sandbox status, 14-day expiry, duplicate check, per-user draft cap

**Not in scope**
- The real Submittable API, real SSO federation, applicant-facing forms, payments, email delivery
- A publish tool for the AI. Publishing happens only in the web console, by a human. This is intentional.
- In-app chat assistant (stretch goal only, §13)

---

## 3. Architecture

```
 Claude / ChatGPT / Copilot (customer's AI tool)
          │  MCP over Streamable HTTP + Bearer token
          ▼
 ┌─────────────────────── Vercel (Next.js app) ───────────────────────┐
 │  /api/mcp            MCP server (tools, §6)  ← validates token      │
 │  /.well-known/oauth-protected-resource       (RFC 9728 metadata)    │
 │  /app/*              Admin console (human publish, undo, revoke)    │
 │  /, /why, /build-log Public pages                                   │
 │                │                                                    │
 │                ▼                                                    │
 │  Domain service layer (lib/domain) ← single place for authz checks  │
 │                │                                                    │
 └────────────────┼────────────────────────────────────────────────────┘
                  ▼
           Postgres (Neon via Vercel Marketplace) + Drizzle ORM

 Authorization server: hosted IdP with MCP OAuth support (see §7.1)
```

**Rules**
- MCP tools and console pages both call the **same domain service layer**. No tool talks to the database directly. Authorization (org membership, role level, scope) is checked in the domain layer, so the MCP route and the UI can't drift apart.
- The MCP server never forwards the client's token anywhere. It validates the token, resolves `{userId, orgId, scopes, clientId}`, and calls the domain layer with that context.

---

## 4. Tech stack

| Layer | Choice | Reason |
|---|---|---|
| App | Next.js (App Router, current stable), TypeScript strict | One deploy target on Vercel for the MCP route, console and public pages |
| MCP | `@modelcontextprotocol/sdk` + `mcp-handler` (Vercel) | Streamable HTTP on serverless; has auth helpers. Verify current API. |
| Validation | Zod | Tool input schemas and domain validation share one definition |
| DB | Postgres on Neon (Vercel Marketplace), Drizzle ORM + migrations | Serverless-friendly; SQLite doesn't persist on Vercel |
| Auth | Hosted IdP with MCP OAuth support (§7.1) | Realistic; avoids hand-rolling an authorization server |
| UI | Tailwind CSS with design tokens from §9, shadcn/ui primitives | Fast, consistent, easy to theme to the token set |
| Tests | Vitest (unit and integration), Playwright (e2e), MCP Inspector (manual) | |
| CI | GitHub Actions: lint, typecheck, unit/integration, e2e on preview | |
| Content | `content/why.mdx`, `content/build-log.json` | Paul edits copy without touching code |

---

## 5. Data model

```ts
orgs            { id, name, slug, type: 'foundation'|'corporate'|'government',
                  mcpEnabled: boolean, draftCapPerUser: int = 5, sandboxTtlDays: int = 14 }
users           { id, email, name, idpSubject }
memberships     { userId, orgId, permissionLevel: 1..5 }   // mirrors Submittable levels
programs        { id, orgId, name, slug, summary, fundingTotal, awardMax, currency,
                  status: 'sandbox'|'ready_for_review'|'published'|'archived',
                  createdBy, createdVia: 'mcp'|'console', clientId?,   // e.g. "Claude"
                  expiresAt?,                                            // sandbox only
                  createdAt, updatedAt }
eligibility     { programId, rules: Rule[] }      // { field, op, value, message }
forms           { programId, sections: Section[] } // section → fields[{key,label,type,required,options?,maxWords?}]
rubrics         { programId, scale: {min,max}, criteria: [{key,label,weight,description,formFieldKeys[]}] }
reviewStages    { programId, stages: [{order,name,reviewerRole,assignment:'all'|'round_robin'|'panel',
                  advanceRule}] }
timelines       { programId, opensAt, closesAt, reviewStartsAt, decisionAt, notifyAt, timezone }
faqs            { programId, items: [{q,a}] }
auditEvents     { id, orgId, programId?, actorUserId, via: 'mcp'|'console', clientId?,
                  action, before: jsonb, after: jsonb, createdAt, revertedAt?, revertedBy? }
connectedClients{ id, orgId, userId, clientId, clientName, scopes[], firstSeenAt, lastUsedAt,
                  revokedAt? }
```

**Seed data (fictional)**
- Orgs:
  - **Lakeshore Community Foundation** (foundation)
  - **Kestrel State Office of Rural Health** (government)
  - **Northwind Corp Giving** (corporate)
- Users, one per role, each with a demo login:
  - `ana@lakeshore.example`, level 5
  - `ben@lakeshore.example`, level 4
  - `cam@lakeshore.example`, level 3
  - `dee@kestrel.example`, level 5. She is also a level-3 member of Lakeshore, to demo the org picker.
- 6 existing programs in Lakeshore, including **"Climate Resilience Fund 2027 (draft by Ben)"** so the duplicate check fires during the demo.
- 2 expired sandbox drafts, so the cleanup view has content.

---

## 6. MCP server

**Endpoint:** `POST/GET /api/mcp` (Streamable HTTP). Server name `program-setup-agent`.

**Server instructions** (sent to the client): explain that every program starts as a sandbox draft. Call `find_similar_programs` before `create_program_draft`. Run `validate_program` before `request_review`. The agent can't publish; it returns a link for a human.

### 6.1 Tools

All inputs are Zod schemas. Every write emits an `auditEvent` and returns `{ programId, status, consoleUrl, warnings[] }`. Add MCP tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) as listed.

| Tool | Scope | Min level | Annotations | Behavior |
|---|---|---|---|---|
| `list_programs` | `programs:read` | 1 | readOnly | Filter by status and `createdByMe`. Returns name, status, owner, `expiresAt`. |
| `get_program` | `programs:read` | 1 | readOnly | Full config of one program. |
| `find_similar_programs` | `programs:read` | 1 | readOnly | Fuzzy match on name and summary (trigram or token overlap; no embeddings needed). Returns top 3 with owner and status. |
| `create_program_draft` | `programs:draft` | 3 | — | Creates `status: sandbox`, `expiresAt = now + org.sandboxTtlDays`. Enforces the draft cap (see 6.3). |
| `update_program_basics` | `programs:draft` | 3 | idempotent | Name, summary, funding, award max. |
| `set_eligibility` | `programs:draft` | 3 | idempotent | Replaces rules. |
| `set_form` | `programs:draft` | 3 | idempotent | Replaces sections and fields. |
| `set_rubric` | `programs:draft` | 3 | idempotent | Weights must sum to 100. |
| `set_review_stages` | `programs:draft` | 3 | idempotent | |
| `set_timeline` | `programs:draft` | 3 | idempotent | |
| `set_faq` | `programs:draft` | 3 | idempotent | |
| `validate_program` | `programs:read` | 1 | readOnly | Returns structured issues (6.2). |
| `request_review` | `programs:review` | 4 | — | `sandbox → ready_for_review`. Fails if validation has errors. Clears `expiresAt`. **Triggers step-up** if the token lacks `programs:review`. |
| `get_publish_link` | `programs:read` | 1 | readOnly | Returns `/app/programs/{id}/publish`. **No publish tool exists.** |
| `archive_program` | `programs:draft` | 3 | destructive | Only the owner's sandbox drafts, or level ≥4. |
| `undo_action` | `programs:draft` | 3 | destructive | Reverts one audit event by id (restores `before`). Only the actor or level ≥4. |

Only the owner's sandbox drafts are editable at level 3. Levels 4–5 can edit any non-published program in their org. Published programs are read-only to MCP.

### 6.2 `validate_program` checks
- Error: every rubric criterion's `formFieldKeys` exist in the form ("Rubric scores *Community engagement*, but the form never asks about it").
- Error: rubric weights sum to 100.
- Error: timeline order is open < close < reviewStart < decision ≤ notify.
- Error: `awardMax ≤ fundingTotal`, and warn if `fundingTotal / awardMax < 3`.
- Warning: every eligibility rule references a field the form collects (e.g., state, org type).
- Warning: a two-stage review where the stage-2 assignment rule is `all` and more than 200 applications are expected ("each panelist reads every application").
- Warning: a required long-text field with no `maxWords`.

### 6.3 Junk-draft guardrails (must be visible in the demo)
1. **Sandbox by default.** MCP-created programs are `sandbox`. They are hidden from the default console list ("Show sandbox" toggle) and never visible to applicants.
2. **Expiry.** Sandbox drafts expire after 14 days and show a badge: "Expires in 9 days". A Vercel Cron job (daily) archives expired drafts and writes audit events.
3. **Duplicate check.** `create_program_draft` runs the similarity check itself. If a match scores above a threshold, it returns `warnings: [{code:'SIMILAR_EXISTS', programs:[…]}]` and doesn't create the draft unless `confirmNew: true`. The server instructions tell the agent to offer to edit the existing draft instead.
4. **Draft cap.** At `org.draftCapPerUser` open sandbox drafts, creation returns a friendly error listing the user's oldest drafts and suggesting `archive_program`.
5. **Origin tag.** Programs record `createdVia` and `clientId`. The console filter is "Created via AI tool".

---

## 7. Authorization (follows MCP spec 2026-07-28)

### 7.1 Identity provider choice
Use a hosted IdP that documents MCP OAuth support. Candidates: WorkOS AuthKit, Auth0, Stytch, Descope, Clerk.

**Decision rule.** Prefer one that supports **Client ID Metadata Documents (CIMD)**, which the 2026-07-28 spec recommends. If none supports it on a free tier, use one that supports Dynamic Client Registration (deprecated but allowed for backwards compatibility). Record the choice and the reason in the build log.

Requirements for the IdP:
- OAuth 2.1 with PKCE (S256)
- Honors the `resource` parameter (RFC 8707) and sets `aud` to the MCP server's canonical URI
- Metadata at `/.well-known/oauth-authorization-server` or OIDC discovery
- `iss` in authorization responses (RFC 9207), if supported
- Custom consent screen, or a hook that lets us show org and scopes

### 7.2 Flow
1. A client calls `/api/mcp` without a token. The server returns `401` with:
   `WWW-Authenticate: Bearer resource_metadata="https://<host>/.well-known/oauth-protected-resource", scope="programs:read programs:draft"`
2. `/.well-known/oauth-protected-resource` returns:
   `{ resource: "https://<host>/api/mcp", authorization_servers: [<idp issuer>], scopes_supported: ["programs:read","programs:draft"], bearer_methods_supported: ["header"] }`
   - `programs:review` is deliberately *not* in `scopes_supported`; it is requested through step-up.
3. The client registers (CIMD or DCR), runs PKCE with `resource=https://<host>/api/mcp`, and the user logs in.
4. **Consent screen** (`/oauth/consent`, ours if the IdP allows, otherwise IdP-hosted with our copy):
   - "**Claude** wants to **read programs** and **create draft programs** in **Lakeshore Community Foundation**."
   - An org picker if the user belongs to more than one org.
   - The selected `orgId` is bound to the grant, and is carried as a custom claim or looked up by grant id.
5. On every request the server:
   - validates signature, expiry, `iss` and `aud == canonical URI`, and rejects anything else with 401
   - resolves the membership for `(sub, orgId)` and rejects it if the membership was removed or `org.mcpEnabled == false`
   - checks the tool's scope. If it's missing, it returns `403` with `WWW-Authenticate: Bearer error="insufficient_scope", scope="programs:review", resource_metadata="…"`, so the client steps up.
   - checks the tool's minimum permission level in the domain layer. A level-3 user who steps up still can't `request_review`. The tool returns a plain-English error.
6. `connectedClients` is upserted with `lastUsedAt`.

### 7.3 Admin controls (console)
- **Settings → AI connections:** an org-level on/off toggle for `mcpEnabled`. Off means every MCP call for that org gets 403 with a clear message.
- **Settings → Connected AI apps:** a table of user, client, scopes, last used, and a Revoke button. Revoke sets `revokedAt`, and the server rejects tokens for that grant. Also call the IdP's revoke endpoint for refresh tokens if one is available.

### 7.4 Explicitly prohibited
- Token passthrough to any upstream API
- Accepting tokens whose `aud` isn't this server
- Tokens in query strings
- Any MCP tool that publishes

---

## 8. Web app screens

### 8.1 Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ ▢ Program Setup Agent  · concept for Submittable   Why │ Build log │ Console │
├────────────────────────────────────────────────────────────────────┤
│ Unofficial concept prototype. Not affiliated with Submittable.     │  ← thin banner, always
├──────────────┬─────────────────────────────────────────────────────┤
│ Console nav  │  Programs                        [Show sandbox ☐]   │
│  Programs    │  ┌──────────────────────────────────────────────┐   │
│  Activity    │  │ Climate Resilience Fund 2027  SANDBOX        │   │
│  Settings    │  │ via Claude · Ben · Expires in 9 days   [Open]│   │
│              │  └──────────────────────────────────────────────┘   │
└──────────────┴─────────────────────────────────────────────────────┘
```

### 8.2 Public pages
1. **`/` Landing**
   - Hero: "Set up a grant program from Claude in 60 seconds."
   - Subhead: "Nothing goes live until a person clicks Publish."
   - A 45-second screen recording (GIF/MP4 placeholder until Paul records it).
   - Three cards: *Works in your AI tool* · *Drafts, never auto-publishes* · *Every action can be undone*.
   - "Try it": copy-able connector URL, demo logins table, steps to add a custom connector in Claude.
2. **`/why` — Why this project** (content in `content/why.mdx`, §10)
3. **`/build-log` — Build log** (content in `content/build-log.json`, §11)

### 8.3 Console (`/app`, requires login with a demo user)
1. **Programs:** list with status badges (sandbox, ready for review, published, archived), filters (status, "Created via AI tool", mine), sandbox toggle, expiry badges.
2. **Program detail:** read-only preview with tabs (Overview, Eligibility, Form, Rubric, Review stages, Timeline, FAQ, Validation). A banner shows status and origin ("Created via Claude by Ben, Oct 29, 3:14 PM"). Buttons by role and state:
   - level ≥4 and `ready_for_review` → **Review & publish**
   - draft → **Archive**
3. **Publish page** (`/app/programs/{id}/publish`): validation summary, checklist ("I've reviewed the form", "I've reviewed the rubric"), then the Publish button (level ≥4). This is the only path to `published`.
4. **Activity:** an audit log table (time, actor, via, action, program) with **Undo** on reversible rows, plus a diff drawer showing before and after JSON as readable fields.
5. **Settings:** AI connections toggle, draft cap, sandbox expiry days, Connected AI apps (revoke).

### 8.4 Stretch: in-app assistant
A side panel in the console that calls the same domain tools through the Anthropic API. Build it only if phases 1–6 are done. It shows that one tool layer serves both front ends.

---

## 9. Design system

Pulled from www.submittable.com production CSS (Webflow, last published Oct 28, 2026). Use these tokens to make the concept feel native to Submittable. **Don't use Submittable's logo or wordmark, and don't hotlink their licensed font files.** Use the free substitutes listed. Every page carries the "Unofficial concept" banner.

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

**Semantic mapping for this app**

| Use | Token |
|---|---|
| Page background | `--milk-white` |
| Card / panel | `--white` with `1px solid --mist-gray` |
| Primary text | `--deep-blue` |
| Secondary text | `--blue-gray` |
| Primary button | `--coral-red` bg, white text, hover `--orange-red` |
| Secondary button | transparent, `--deep-blue` text, `2px solid --deep-blue` |
| Link / focus ring | `--signal-blue` |
| Status: sandbox | `--warm-stone` bg, `--deep-blue` text |
| Status: ready for review | `--pale-blue` bg, `--signal-blue` text |
| Status: published | `--sea-green` bg at 15% opacity, `--teal-green` text |
| Status: archived | `--oyster` bg, `--blue-gray` text |
| Warning | `--amber` |
| Error | `--orange-red` |
| Dark hero / footer | `--deep-blue` bg, `--milk-white` text |

**Dark mode** (console only, optional): bg `--deep-blue`, surface `--midnight-navy`, text `--milk-white`, borders `#ffffff1f`. Keep the accents the same.

### 9.2 Typography

| Role | Submittable font (licensed) | Use instead (free) | Specs from their CSS |
|---|---|---|---|
| Display / H1 | ITC Garamond Std Book Condensed | **EB Garamond** (Google Fonts), weight 400 | 5.5rem desktop (scale to 3rem mobile), line-height 0.97, letter-spacing −0.055rem |
| Headings H2–H3, body | PP Neue Montreal | **Inter** or **Manrope**, weight 400 | H2 3.12rem / 1.25, H3 2rem / 1.25 |
| Body UI text | Bureau Sans Book | **Inter** 400 | 1rem / 1.5, letter-spacing 0.01em |
| Eyebrows, labels, code | Spezia Semi Mono Semi Bold | **JetBrains Mono** 600, uppercase, 0.75rem, letter-spacing 0.08em | |

Headings are weight 400. Submittable's style uses large, light headings, not bold ones. Keep bold for H4 and small labels.

### 9.3 Shape and components
- Radius: buttons `0.5rem`; cards `1rem`; large panels `1.5rem`; eyebrow pills `6.25rem`.
- Primary button padding: `1.12rem 2rem` (marketing), `0.625rem 1rem` (console). Border is 2px in the same color as the fill.
- Eyebrow: `--warm-stone` pill, padding `0.5rem 0.8rem`, mono uppercase label.
- Generous whitespace: section padding 6rem desktop, 3rem mobile.
- Focus states: 2px `--signal-blue` outline with 2px offset. Never remove the focus outline.
- Meet WCAG AA contrast. Coral on white is fine at button sizes with white text on coral. Don't use coral for body text.

---

## 10. "Why this project" page (`/why`)

Paul will finalize the copy. Scaffold `content/why.mdx` with this draft and keep the source links:

> ### Why I built this
>
> **Submittable's customers ran 28,931 programs and 4.4 million reviews in 2025.** Every one of those programs had to be set up by hand: eligibility, form, rubric, review stages, timeline. Setup is where admins spend days before a single application arrives.
>
> **Your admins already have AI tools open.** Today, Submittable's AI Assistant offers four starter templates inside the app. This prototype goes further: an admin describes the program in their own Claude, and gets back a complete, checked draft in Submittable.
>
> **The market is moving this way.** Fluxx has an MCP server that answers questions about grant data. This one *does the setup work*, and it's built on the same standard.
>
> **It follows your Responsible AI Principles:**
> - *Human control:* the AI can't publish. A person reviews and clicks Publish.
> - *Traceable and reversible:* every AI action is logged with who, which tool and when, and can be undone in one click.
> - *Transparent and opt-in:* org admins turn AI connections on or off and can revoke any connected app.
> - *Private and secure:* setup touches program configuration, not applicant data. Tokens are scoped per org and per permission, and follow the current MCP authorization spec.
>
> **It plans for the downside of low friction.** If setup takes 60 seconds, people will experiment. Drafts start in a private sandbox, expire after 14 days, check for duplicates before creating, and are capped per person, so the account stays clean.
>
> **How I'd measure it in production:** time from first prompt to published program; share of AI drafts that get published; validation errors caught before review; sandbox drafts expired vs. promoted.
>
> Sources: Submittable 2025 Year in Review; Submittable Help Center (AI Assistant Tool); Submittable Responsible AI Principles; Fluxx AI Grants Management; MCP Authorization spec 2026-07-28.

---

## 11. Build log (`/build-log`)

Render from `content/build-log.json`. The page has six sections in this order. Claude Code appends facts during the build (§0.5). Paul writes the final wording.

```jsonc
{
  "summary": { "totalHours": 0, "calendarDays": 0, "linesShipped": 0, "aiCodeKeptPct": 0,
               "modelSpendUsd": 0, "tokens": { "input": 0, "output": 0, "cacheRead": 0 } },
  "timeline": [
    { "date": "2026-10-28", "hours": 1.0, "phase": "Ideation & research",
      "shipped": "Company/competitor research, 3 prototype concepts, auth design, this spec",
      "tools": ["Claude (Opus 5.5)"], "commit": null }
  ],
  "tools": [
    { "tool": "Claude (Opus 5.5) in the Claude app", "usedFor": "Research, ideation, spec" },
    { "tool": "Claude Code", "usedFor": "…" },
    { "tool": "Cursor", "usedFor": "…" }
  ],
  "failures": [
    { "title": "", "whatHappened": "", "howCaught": "", "fix": "", "commit": "", "lesson": "" }
  ],
  "keptVsRewritten": { "aiWrittenPct": 0, "keptPct": 0, "rewrittenAreas": [""] },
  "cost": { "ideation": {}, "build": {}, "hosting": "Vercel Hobby + Neon free tier: $0" },
  "beforeProduction": [""]
}
```

### 11.1 Section requirements
1. **Timeline.** Hours spent and what shipped at each step. Show it as a vertical timeline with a running total of hours.
2. **Tools.** Which agent was used where, e.g. "Claude Code for the MCP server and auth; Cursor for UI tweaks; Claude for research and this spec."
3. **Failures.** 3–5 concrete cases with the actual mistake, with a link to the commit. Examples of the expected level of detail:
   - an invented API field or SDK method
   - a test that "passed" without testing anything
   - a large PR that had to be split
   - an auth check that accepted the wrong token audience
4. **Kept vs. rewritten.** Rough share of AI-written code kept, and which areas were rewritten by hand and why.
5. **Cost.** Model spend for the whole build, split into ideation and build, plus hosting.
6. **Before production.** The reviews, tests and monitoring Paul would add. Seed list:
   - Security review of the OAuth integration and threat model (confused deputy, token theft, prompt injection through program text)
   - Real SSO federation (SAML/OIDC) with group-to-role mapping, and refresh-token revocation on deprovisioning
   - Rate limits per user, client and org; abuse alerts on draft creation spikes
   - Contract tests against the real Submittable API in place of the mock
   - Eval set of 50 program descriptions, scored for completeness and validation pass rate, run in CI on every prompt or model change
   - Observability: traces per tool call (latency, error rate, scope denials), dashboards, alerts
   - SOC 2 evidence: audit log retention, access reviews for connected apps
   - Load test of the MCP endpoint; cold-start budget on Vercel
   - Weekly stale-draft digest email to admins

### 11.2 Ideation-phase estimate (pre-filled; Paul to confirm)

The research and ideation for this project happened in one Claude conversation on Claude Opus 5.5, Oct 28–29, 2026. It covered company and competitor research (about 25 web searches and page fetches), three concepts and revisions, the auth design, the junk-draft analysis, scraping the brand tokens, and this spec.

**Estimated usage:**

| | Tokens |
|---|---|
| Input | ~2.0–2.5M total across ~40 model calls (mostly cached context) |
| Output | ~40–60K |

**Estimated cost.** If billed at Opus API list rates of $5 / $25 per million input/output tokens, with cache reads at about a tenth of the input price, that's **roughly $3–8**. That rate is an assumption; confirm current Opus 5.5 pricing. Under a Claude subscription, it's included usage, not a separate charge.

These are estimates, not metered numbers. Replace them with actual figures if available.

**Build-phase expectation, to compare against at the end:** Claude Code for phases 1–7 is likely about 15–40M input tokens (mostly cache reads) and 0.3–0.8M output tokens. Record actuals from Claude Code's `/cost` (or the Console usage page) at the end of each phase.

---

## 12. Testing

| Layer | What | Must include |
|---|---|---|
| Unit | Validators (§6.2), similarity match, draft-cap logic, expiry calculation | Table-driven cases, including edge dates |
| Integration | Each MCP tool through an in-memory MCP client against a test DB | Audit event written; `undo_action` restores the exact `before` |
| Auth | Token validation and authorization | Wrong `aud` → 401 · expired → 401 · token in query string ignored · missing scope → 403 with correct `WWW-Authenticate` · level 3 + `programs:review` scope → domain denial · cross-org program id → 404 (not 403, so other orgs' programs aren't revealed) · revoked client → 401 · `mcpEnabled=false` → 403 |
| E2E (Playwright) | Console | Publish only via console; undo from Activity; revoke from Settings; sandbox toggle and expiry badge |
| Manual | MCP Inspector + Claude custom connector | Full demo script (§15) end to end on the Vercel preview URL |

Per §0.6, auth tests must be shown to fail against a broken implementation before they count.

---

## 13. Repository layout

```
/app
  /(public)/page.tsx, /why/page.tsx, /build-log/page.tsx
  /app/(console)/programs, /programs/[id], /programs/[id]/publish, /activity, /settings
  /api/mcp/route.ts
  /.well-known/oauth-protected-resource/route.ts
  /oauth/consent/page.tsx
  /api/cron/expire-sandbox/route.ts
/lib
  /domain        programs.ts, validate.ts, similarity.ts, audit.ts, authz.ts
  /mcp           server.ts, tools/*.ts, instructions.ts
  /auth          verifyToken.ts, scopes.ts, context.ts
  /db            schema.ts, client.ts, seed.ts
/content         why.mdx, build-log.json
/tests           unit/, integration/, auth/, e2e/
/.github/workflows/ci.yml
README.md        what it is, unofficial disclaimer, how to connect, how to run locally
```

---

## 14. Build plan

| Phase | Deliverable | Done when |
|---|---|---|
| 1 | Next.js scaffold, tokens and fonts (§9), public page shells, banner, CI | Vercel preview renders `/`, `/why`, `/build-log` from content files |
| 2 | DB schema, migrations, seed, domain layer + validators + unit tests | `pnpm test` green; seed loads 3 orgs |
| 3 | MCP server with read tools, no auth (local only, behind env flag) | MCP Inspector lists and calls read tools |
| 4 | Write tools, audit, undo, guardrails (§6.3) + integration tests | Duplicate warning and draft cap demo work in Inspector |
| 5 | OAuth: IdP setup, protected-resource metadata, token verification, scopes, step-up, consent and org picker + auth tests | Claude custom connector connects to the preview URL and completes login |
| 6 | Console: programs, detail, publish, activity/undo, settings/revoke + e2e | Full demo script passes on preview |
| 7 | Polish: landing copy, recording placeholder, README, build-log page complete | Lighthouse accessibility ≥95; build log has ≥3 real failures |
| 8 (stretch) | In-app assistant panel | Same demo prompt works from the console |

After each phase: commit, push, confirm CI is green, and append to `build-log.json`.

---

## 15. Demo script (first person, ~4 minutes)

1. **The problem (20s).** "Submittable customers set up almost 29,000 programs last year. Each one is days of configuration before an applicant shows up. Admins already have AI tools open, so I put setup where they already work."
2. **Connect (30s).** In Claude, add the connector URL. A Submittable-style login appears, then a consent screen: "Claude wants to read programs and create drafts in Lakeshore Community Foundation." "Standard OAuth, following the current MCP authorization spec. The token only works for this server and this org."
3. **Prompt (60s).** Paste the climate fund prompt. "Notice it stopped: Ben already has a Climate Resilience Fund draft. It offers to edit his instead of creating a duplicate. That's the junk-draft guardrail." Choose to create a new one with a different name.
4. **Validation (30s).** "It ran validation: the rubric scored community engagement, but the form never asked about it, so it added the field. And it warned that a 3-person panel reading every application won't scale past 200 applications."
5. **The boundary (30s).** Ask it to publish. "It can't. There's no publish tool. It gives me a link." As Ben (level 4), request review: a step-up permission prompt appears.
6. **Console (60s).** Open the link: the sandbox badge with expiry, "Created via Claude by Ben," tabs for the full config. Go to Activity, undo one AI change, and show the diff. Go to Settings and revoke Claude. The next Claude call fails cleanly.
7. **How I built it (30s).** Open `/build-log`: "Here's how many hours it took, which agents did what, the five things they got wrong, and what I'd add before production."

---

## 16. Deployment

```bash
# Repo
gh repo create program-setup-agent --public --source=. --remote=origin
git push -u origin main

# Vercel
npm i -g vercel
vercel link
vercel integration add neon          # or add Neon from the Vercel Marketplace UI
vercel env add IDP_ISSUER
vercel env add IDP_CLIENT_ID
vercel env add IDP_CLIENT_SECRET
vercel env add MCP_CANONICAL_URI     # https://<project>.vercel.app/api/mcp
vercel env add CRON_SECRET
pnpm drizzle-kit migrate && pnpm tsx lib/db/seed.ts
vercel --prod
```

- `vercel.json`: cron `0 9 * * *` → `/api/cron/expire-sandbox`, protected by `CRON_SECRET`.
- Set `MCP_CANONICAL_URI` to the production domain. Preview deployments use their own URI, so tokens from one deployment don't work on another.

---

## 17. What this demo proves

| Job description requirement | Where the demo shows it |
|---|---|
| "Shipped software with AI in the last 12 months… what broke" | `/build-log`: timeline, tools, 3–5 real failures, kept vs. rewritten |
| "Build AI into the product… set up programs in less time" | Climate fund prompt → complete validated draft in ~60s |
| API design, distributed systems, cloud | MCP tool contract, shared domain layer, serverless on Vercel + Postgres |
| Multi-tenant B2B SaaS, SOC 2 familiarity | Org-bound tokens, cross-org 404s, audit log, revoke, org-level opt-in |
| "Raise the technical bar… speed doesn't cost quality" | Auth tests proven to fail first, CI gates, small PRs, validation before review |
| "Report plainly where AI creates new problems" | Junk-draft guardrails; failures section of the build log |
| Responsible AI: human control, reversible, opt-in | No publish tool; one-click undo; org toggle and revoke |
| "Clear storyteller" | `/why` page and the 4-minute demo script |
| Cost awareness | Customer-side model calls; build cost published in the build log |

---

## 18. Acceptance checklist

- [ ] Unofficial-concept banner on every page; no Submittable logo; free font substitutes
- [ ] Claude custom connector connects to production URL and completes OAuth
- [ ] 401 with `resource_metadata` and `scope`; protected-resource metadata served
- [ ] Wrong-audience, expired and revoked tokens rejected; cross-org access returns 404
- [ ] Step-up for `programs:review` works; level-3 user still denied
- [ ] Duplicate check, draft cap, sandbox expiry badge, daily cron all demoable
- [ ] No MCP tool can publish; publish page is the only path
- [ ] Every write audited; undo restores exact prior state
- [ ] `/why` and `/build-log` live, with ≥3 real failures and cost filled in
- [ ] CI green; Lighthouse accessibility ≥95; README explains how to connect and run locally
