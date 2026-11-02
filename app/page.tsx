import Eyebrow from "@/components/Eyebrow";
import StatTile from "@/components/StatTile";
import Prose from "@/components/Prose";
import ProgramDemo from "@/components/ProgramDemo";
import Link from "next/link";
import { getAboutStats, readMdx } from "@/lib/content";
import { latestEvalResult } from "@/lib/eval";
import type { Sample } from "@/lib/samples";
import climateResilience from "@/content/samples/climate-resilience.json";
import smallBusinessRecovery from "@/content/samples/small-business-recovery.json";
import employeeScholarship from "@/content/samples/employee-scholarship.json";

const samples = [climateResilience, smallBusinessRecovery, employeeScholarship] as unknown as Sample[];

export default function Home() {
  const aboutStats = getAboutStats();
  const aboutBio = readMdx("about.mdx");
  const evalResult = latestEvalResult();

  return (
    <main>
      {/* Hero */}
      <section className="bg-deep-blue px-6 py-24 text-milk-white">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow className="bg-warm-stone/90">A WORK SAMPLE FOR SUBMITTABLE</Eyebrow>
          <h1 className="mt-6 font-display text-5xl leading-[0.97] tracking-[-0.03em] sm:text-6xl">
            One sentence in. A complete grant program out.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pale-blue">
            I built this to show how I&apos;d lead engineering at Submittable: AI that does real
            work, checked by code, and measured.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#try-it"
              className="rounded-lg border-2 border-coral-red bg-coral-red px-8 py-[1.12rem] font-sans text-white transition hover:border-orange-red hover:bg-orange-red"
            >
              Try a sample
            </a>
            <a
              href="#try-it"
              className="rounded-lg border-2 border-milk-white px-8 py-[1.12rem] font-sans text-milk-white transition hover:bg-white/10"
            >
              Watch 45 seconds
            </a>
          </div>
        </div>
      </section>

      {/* Try it */}
      <section id="try-it" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Try it</Eyebrow>
          <h2 className="mt-4 font-display text-3xl">Pick a sample, watch it build.</h2>
          <div className="mt-8">
            <ProgramDemo samples={samples} />
          </div>
          <p className="mt-6 text-sm text-blue-gray">
            These 3 replays are real, recorded runs — no model call, no cost. Writing your own
            program is coming with live mode.
          </p>
        </div>
      </section>

      {/* How I know it works */}
      <section className="bg-off-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>How I know it works</Eyebrow>
          <h2 className="mt-4 font-display text-3xl">Measured, not claimed.</h2>
          <p className="mt-4 max-w-2xl text-blue-gray">
            Tested on {evalResult?.caseCount ?? 50} program descriptions, from simple to
            deliberately contradictory. The numbers update every time I change the prompts.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-4">
            <StatTile
              value={evalResult ? `${Math.round(evalResult.metrics.finalPassRate * 100)}%` : "—"}
              label="Programs that passed every check"
            />
            <StatTile
              value={evalResult ? String(evalResult.metrics.problemsFixedAutomatically) : "—"}
              label="Problems caught and fixed automatically"
            />
            <StatTile
              value={evalResult ? `${(evalResult.metrics.latencyP50Ms / 1000).toFixed(1)}s` : "—"}
              label="Median build time"
            />
            <StatTile
              value={evalResult ? `$${evalResult.metrics.costPerProgramUsd.toFixed(3)}` : "—"}
              label="Cost per program"
            />
          </div>
          <Link href="/how-it-works" className="mt-6 inline-block text-sm text-signal-blue hover:underline">
            See the full test results →
          </Link>
        </div>
      </section>

      {/* About Paul */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>About Paul</Eyebrow>
          <div className="mt-6">
            <Prose markdown={aboutBio} />
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {aboutStats.map((stat, i) => (
              <StatTile key={i} value={stat.value} label={stat.label} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="mailto:paul.millar@gmail.com"
              className="rounded-lg border-2 border-coral-red bg-coral-red px-8 py-[0.625rem] font-sans text-white transition hover:border-orange-red hover:bg-orange-red"
            >
              Let&apos;s talk
            </a>
            <a
              href="#"
              title="TODO (Paul): add your LinkedIn profile URL"
              className="rounded-lg border-2 border-deep-blue px-8 py-[0.625rem] font-sans text-deep-blue transition hover:bg-deep-blue/5"
            >
              LinkedIn
            </a>
            <a
              href="#"
              title="TODO (Paul): link your resume PDF"
              className="rounded-lg border-2 border-deep-blue px-8 py-[0.625rem] font-sans text-deep-blue transition hover:bg-deep-blue/5"
            >
              Resume (PDF)
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
