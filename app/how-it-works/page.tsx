import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import StatTile from "@/components/StatTile";
import EvalChart from "@/components/EvalChart";
import { latestEvalResult, latestPerPromptVersion } from "@/lib/eval";

export const metadata: Metadata = {
  title: "How it works — Program Builder",
};

const ARCHITECTURE = `Browser (public, no login)
  |  1) sample prompt -> replay a recorded run (static JSON, no model call)
  |  2) custom prompt -> POST /api/build (streamed) [not yet live]
  v
+------------------------- Vercel (Next.js) --------------------------+
| /api/build    rate limit + spend cap (Upstash Redis)   [planned]    |
|               -> generation pipeline (lib/generate)                 |
|                  step 1 basics -> 2 eligibility -> 3 form ->        |
|                  4 rubric -> 5 review stages -> 6 timeline -> 7 FAQ |
|               -> checker (lib/validate, plain code, no AI)          |
|               -> if errors: repair call with the issue list        |
|                  -> check again (max 2 repair rounds)               |
| Pages: / , /why , /build-log , /how-it-works                        |
+-----------------------------------------------------------------------+
Offline: \`pnpm eval\` runs the pipeline over 50 descriptions
         -> writes content/eval/results-<promptVersion>.json (committed)
         \`pnpm record\` makes the 3 sample runs -> content/samples/*.json`;

const RULES = [
  ["RUBRIC_FIELD_MISSING", "error", "Each rubric criterion's fields exist on the form"],
  ["RUBRIC_WEIGHTS", "error", "Weights sum to 100"],
  ["TIMELINE_ORDER", "error", "open < close < reviewStart < decision ≤ notify"],
  ["AWARD_RANGE", "error", "awardMin ≤ awardMax ≤ fundingTotal"],
  ["ELIGIBILITY_UNCOLLECTED", "error", "Every eligibility field is collected by the form"],
  ["PROMPT_CONFLICT", "error", "Numbers in the output match numbers stated in the prompt"],
  ["FUND_CAPACITY", "warning", "Fewer than 3 awards possible at this size"],
  ["PANEL_LOAD", "warning", "A panelist would read more than 60 applications"],
  ["APPLICANT_BURDEN", "warning", "Form takes over an hour for an award under $10,000"],
  ["LONG_TEXT_LIMIT", "warning", "A required long-text field has no word limit"],
] as const;

export default function HowItWorksPage() {
  const latest = latestEvalResult();
  const versions = latestPerPromptVersion();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Eyebrow>For engineers</Eyebrow>
      <h1 className="mt-6 font-display text-4xl">How it works</h1>
      <p className="mt-4 text-blue-gray">
        The AI drafts every section through a strict schema. Code — not AI — decides whether the
        result is good enough to show.
      </p>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Architecture</h2>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-mist-gray bg-white p-4 font-mono text-xs leading-relaxed text-deep-blue">
          {ARCHITECTURE}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">The generation pipeline</h2>
        <p className="mt-3 text-blue-gray">
          Seven sequential tool-use calls to Claude — basics, eligibility, application form,
          rubric, review stages, timeline, FAQ — each one given every section generated before
          it, each constrained to that section&apos;s Zod schema (converted to JSON Schema at
          call time, so generation and validation can never drift apart). The checker then runs
          ten plain-TypeScript rules against the assembled program. If any rule returns an
          error, the full program and the issue list go back to the model for a repair pass; the
          checker runs again, for at most 2 rounds. Warnings are never auto-fixed — they&apos;re
          surfaced as &quot;needs your call.&quot;
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">The checker</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-oyster text-left text-blue-gray">
              <th className="py-2 pr-4 font-mono text-xs uppercase tracking-[0.08em]">Code</th>
              <th className="py-2 pr-4 font-mono text-xs uppercase tracking-[0.08em]">Severity</th>
              <th className="py-2 font-mono text-xs uppercase tracking-[0.08em]">Rule</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map(([code, severity, rule]) => (
              <tr key={code} className="border-b border-oyster last:border-0">
                <td className="py-2 pr-4 font-mono text-xs">{code}</td>
                <td className={`py-2 pr-4 text-xs ${severity === "error" ? "text-orange-red" : "text-amber"}`}>
                  {severity}
                </td>
                <td className="py-2 text-blue-gray">{rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Evaluation</h2>
        {latest ? (
          <>
            <p className="mt-3 text-blue-gray">
              {latest.caseCount} program descriptions — foundation, government, corporate, and
              scholarship programs, deliberately vague prompts, deliberately contradictory ones,
              and a few unusual shapes (rolling deadlines, a non-English prompt, 10,000 expected
              applications). Latest run: prompt version <code>{latest.promptVersion}</code>,
              model <code>{latest.model}</code>, {new Date(latest.generatedAt).toLocaleDateString()}.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-4">
              <StatTile
                value={`${Math.round(latest.metrics.finalPassRate * 100)}%`}
                label="Final pass rate"
              />
              <StatTile
                value={`${Math.round(latest.metrics.expectedFlagsCaughtRate * 100)}%`}
                label="Contradictions caught"
              />
              <StatTile value={`${(latest.metrics.latencyP50Ms / 1000).toFixed(1)}s`} label="Median build time" />
              <StatTile value={`$${latest.metrics.costPerProgramUsd.toFixed(3)}`} label="Cost per program" />
            </div>
            {versions.length > 1 && (
              <div className="mt-8">
                <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">
                  Prompt version comparison
                </div>
                <div className="mt-3">
                  <EvalChart results={versions} />
                </div>
                <p className="mt-3 text-sm text-blue-gray">
                  v2 tried telling the model to always make a defensible assumption instead of
                  declining — it fixed the vague-prompt failures, but also made the model more
                  willing to quietly resolve a stated contradiction instead of leaving it for
                  the checker to catch, which is the opposite of what this needs. v1 stayed the
                  default; see <Link href="/build-log" className="text-signal-blue">/build-log</Link>{" "}
                  for the real numbers behind that call.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-blue-gray">No eval run committed yet.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">3 real examples from the eval</h2>
        <div className="mt-4 space-y-6">
          <div className="rounded-2xl border border-mist-gray bg-white p-6">
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">contradictory-01</div>
            <p className="mt-2 text-blue-gray">
              &quot;A $10,000 fund for local artists. Awards up to $50,000.&quot; The checker
              caught the conflict (<code>PROMPT_CONFLICT</code>), sent it through 2 repair
              rounds, and left it in <code>remaining</code> rather than silently picking a
              number — the model kept flip-flopping between honoring the $10,000 total and the
              $50,000 award cap, because a $10,000 fund genuinely can&apos;t pay a $50,000
              award. Correct behavior: a human needs to resolve this, not the AI.
            </p>
          </div>
          <div className="rounded-2xl border border-mist-gray bg-white p-6">
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">contradictory-06</div>
            <p className="mt-2 text-blue-gray">
              &quot;Awards up to $60,000 from a $40,000 total fund.&quot; On the first eval run,
              the repair step failed outright — the model responded with plain text instead of
              calling the tool, apparently balking at &quot;fixing&quot; something
              unfixable. Fixed by adding a one-time retry with an explicit nudge to always call
              the tool. After the fix: the checker correctly flags <code>AWARD_RANGE</code> and
              leaves it unresolved, same as the case above.
            </p>
          </div>
          <div className="rounded-2xl border border-mist-gray bg-white p-6">
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">contradictory-02 and contradictory-04</div>
            <p className="mt-2 text-blue-gray">
              Both prompts stated an impossible order (&quot;review starts March 1, but
              applications don&apos;t open until April 1&quot;; &quot;notify April 1, decisions
              not final until April 15&quot;). Neither got flagged — not because the checker
              missed them, but because the model generated a self-consistent timeline that just
              didn&apos;t reproduce the stated contradiction. Worth knowing: a capable model will
              sometimes quietly resolve bad input instead of faithfully reproducing it for the
              checker to catch, which is usually good, but means a few <code>mustFlag</code>{" "}
              eval cases will always under-report how often the model actually handles messy
              input well.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Guardrails and cost controls</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-blue-gray">
          <li>No real Submittable API calls — the &quot;In Submittable&quot; tab is a labeled concept mapping.</li>
          <li>The checker is deterministic TypeScript; the model never decides whether its own output is valid.</li>
          <li>
            Live mode (rate limiting, a daily spend cap, a topic guard, a kill switch) is designed but not yet
            deployed — see the build log for status. The 3 recorded samples replay for $0 either way.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Plugging into Submittable</h2>
        <p className="mt-3 text-blue-gray">
          Submittable has a public V4 read/write API (released December 2023), which would be the
          integration point for a real version of this. That&apos;s an assumption worth confirming
          with their platform team, not something verified against their current docs from
          outside the company.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">The MCP version (not built)</h2>
        <p className="mt-3 text-blue-gray">
          The same pipeline could run inside a customer&apos;s own Claude or ChatGPT through an MCP
          server: OAuth per the MCP 2026-07-28 spec, org-bound tokens, drafts only, no publish
          tool, sandbox drafts that expire after 14 days, and a duplicate check. That was this
          project&apos;s first design — see <Link href="/why" className="text-signal-blue">/why</Link>{" "}
          for why it changed, and the full design in{" "}
          <a
            href="https://github.com/pauljmillar/program-builder/blob/main/docs/mcp-design.md"
            className="text-signal-blue"
          >
            docs/mcp-design.md
          </a>
          .
        </p>
      </section>
    </main>
  );
}
