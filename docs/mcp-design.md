# MCP server design (not built)

This is the design from the first version of this project, `program-setup-agent-spec.md`,
before the direction changed to a public browser demo (see `/why` and `/build-log`). The
reasoning for the change: the person screening job applications won't connect an AI tool to
try an MCP server, so a no-setup browser demo proves the same engineering judgment in a form
anyone can actually open. This design is kept here as a second real artifact — the same
program-setup pipeline, designed for the realistic enterprise path: running inside a
customer's own Claude or ChatGPT, authenticated to their org, writing drafts only.

Copied and lightly adapted from `program-setup-agent-spec.md` §6-7.

---

## MCP server

**Endpoint:** `POST/GET /api/mcp` (Streamable HTTP). Server name `program-setup-agent`.

**Server instructions** (sent to the client): explain that every program starts as a sandbox
draft. Call `find_similar_programs` before `create_program_draft`. Run `validate_program`
before `request_review`. The agent can't publish; it returns a link for a human.

### Tools

All inputs are Zod schemas. Every write emits an `auditEvent` and returns `{ programId, status,
consoleUrl, warnings[] }`. Add MCP tool annotations (`readOnlyHint`, `destructiveHint`,
`idempotentHint`) as listed.

| Tool | Scope | Min level | Annotations | Behavior |
|---|---|---|---|---|
| `list_programs` | `programs:read` | 1 | readOnly | Filter by status and `createdByMe`. Returns name, status, owner, `expiresAt`. |
| `get_program` | `programs:read` | 1 | readOnly | Full config of one program. |
| `find_similar_programs` | `programs:read` | 1 | readOnly | Fuzzy match on name and summary (trigram or token overlap; no embeddings needed). Returns top 3 with owner and status. |
| `create_program_draft` | `programs:draft` | 3 | — | Creates `status: sandbox`, `expiresAt = now + org.sandboxTtlDays`. Enforces the draft cap. |
| `update_program_basics` | `programs:draft` | 3 | idempotent | Name, summary, funding, award max. |
| `set_eligibility` | `programs:draft` | 3 | idempotent | Replaces rules. |
| `set_form` | `programs:draft` | 3 | idempotent | Replaces sections and fields. |
| `set_rubric` | `programs:draft` | 3 | idempotent | Weights must sum to 100. |
| `set_review_stages` | `programs:draft` | 3 | idempotent | |
| `set_timeline` | `programs:draft` | 3 | idempotent | |
| `set_faq` | `programs:draft` | 3 | idempotent | |
| `validate_program` | `programs:read` | 1 | readOnly | Returns structured issues — the same categories as this demo's checker. |
| `request_review` | `programs:review` | 4 | — | `sandbox → ready_for_review`. Fails if validation has errors. Clears `expiresAt`. **Triggers step-up** if the token lacks `programs:review`. |
| `get_publish_link` | `programs:read` | 1 | readOnly | Returns `/app/programs/{id}/publish`. **No publish tool exists.** |
| `archive_program` | `programs:draft` | 3 | destructive | Only the owner's sandbox drafts, or level ≥4. |
| `undo_action` | `programs:draft` | 3 | destructive | Reverts one audit event by id (restores `before`). Only the actor or level ≥4. |

Only the owner's sandbox drafts are editable at level 3. Levels 4-5 can edit any non-published
program in their org. Published programs are read-only to MCP.

### Junk-draft guardrails (the part that matters most for trust)

1. **Sandbox by default.** MCP-created programs are `sandbox`. They are hidden from the default
   console list ("Show sandbox" toggle) and never visible to applicants.
2. **Expiry.** Sandbox drafts expire after 14 days and show a badge: "Expires in 9 days". A
   daily cron job archives expired drafts and writes audit events.
3. **Duplicate check.** `create_program_draft` runs the similarity check itself. If a match
   scores above a threshold, it returns `warnings: [{code:'SIMILAR_EXISTS', programs:[...]}]`
   and doesn't create the draft unless `confirmNew: true`.
4. **Draft cap.** At `org.draftCapPerUser` open sandbox drafts, creation returns a friendly
   error listing the user's oldest drafts and suggesting `archive_program`.
5. **Origin tag.** Programs record `createdVia` and `clientId`. The console filter is "Created
   via AI tool".

---

## Authorization (follows the MCP spec, 2026-07-28)

### Identity provider choice

Use a hosted IdP that documents MCP OAuth support: WorkOS AuthKit, Auth0, Stytch, Descope, or
Clerk. Prefer one that supports **Client ID Metadata Documents (CIMD)**, which the 2026-07-28
spec recommends. If none supports it on a free tier, fall back to Dynamic Client Registration
(deprecated but allowed for backwards compatibility).

Requirements for the IdP: OAuth 2.1 with PKCE (S256); honors the `resource` parameter (RFC
8707) and sets `aud` to the MCP server's canonical URI; metadata at
`/.well-known/oauth-authorization-server` or OIDC discovery; `iss` in authorization responses
(RFC 9207) where supported; a consent screen (ours or theirs) that can show org and scopes.

### Flow

1. A client calls `/api/mcp` without a token. The server returns `401` with
   `WWW-Authenticate: Bearer resource_metadata="https://<host>/.well-known/oauth-protected-resource", scope="programs:read programs:draft"`.
2. `/.well-known/oauth-protected-resource` returns the resource URI, the IdP issuer, and the
   supported scopes. `programs:review` is deliberately *not* in `scopes_supported`; it's
   requested through step-up.
3. The client registers (CIMD or DCR), runs PKCE with `resource=https://<host>/api/mcp`, and
   the user logs in.
4. **Consent screen** (`/oauth/consent`): "**Claude** wants to **read programs** and **create
   draft programs** in **Lakeshore Community Foundation**." An org picker if the user belongs
   to more than one org. The selected `orgId` is bound to the grant.
5. On every request the server validates signature, expiry, `iss` and `aud == canonical URI`;
   resolves the membership for `(sub, orgId)` and rejects it if removed or if
   `org.mcpEnabled == false`; checks the tool's scope (403 with `insufficient_scope` to trigger
   step-up if missing); checks the tool's minimum permission level in the domain layer, with a
   plain-English error if a level-3 user who stepped up still can't `request_review`.
6. `connectedClients` is upserted with `lastUsedAt`.

### Admin controls (console)

- **Settings → AI connections:** an org-level on/off toggle for `mcpEnabled`. Off means every
  MCP call for that org gets 403 with a clear message.
- **Settings → Connected AI apps:** a table of user, client, scopes, last used, and a Revoke
  button. Revoke sets `revokedAt`; the server rejects tokens for that grant, and the IdP's
  revoke endpoint is called for refresh tokens where available.

### Explicitly prohibited

- Token passthrough to any upstream API
- Accepting tokens whose `aud` isn't this server
- Tokens in query strings
- Any MCP tool that publishes
