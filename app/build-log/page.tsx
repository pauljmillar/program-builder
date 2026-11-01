import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";
import { getBuildLog } from "@/lib/content";

export const metadata: Metadata = {
  title: "Build log — Program Builder",
};

export default function BuildLogPage() {
  const log = getBuildLog();

  const runningTotals: number[] = [];
  log.timeline.reduce((total, entry) => {
    const next = total + entry.hours;
    runningTotals.push(next);
    return next;
  }, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Eyebrow>Build log</Eyebrow>
      <h1 className="mt-6 font-display text-4xl">How this got built</h1>
      <p className="mt-4 text-blue-gray">
        Facts come from the build as it happened. I write the wording; the numbers don&apos;t move
        unless the work did.
      </p>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Timeline</h2>
        <ol className="mt-6 space-y-6 border-l border-mist-gray pl-6">
          {log.timeline.map((entry, i) => {
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-signal-blue" />
                <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">
                  {entry.date} · {entry.hours}h · running total {runningTotals[i].toFixed(1)}h
                </div>
                <div className="mt-1 font-sans text-lg">{entry.phase}</div>
                <p className="mt-1 text-deep-blue">{entry.shipped}</p>
                <div className="mt-1 text-sm text-blue-gray">{entry.tools.join(", ")}</div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Tools</h2>
        <ul className="mt-4 space-y-2">
          {log.tools.map((t, i) => (
            <li key={i}>
              <span className="font-mono text-sm">{t.tool}</span> — {t.usedFor}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Failures</h2>
        {log.failures.length === 0 ? (
          <p className="mt-4 text-blue-gray">None recorded yet — they&apos;ll land here as the build hits them.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {log.failures.map((f, i) => (
              <div key={i} className="rounded-2xl border border-mist-gray bg-white p-6">
                <h3 className="font-sans text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-blue-gray">What happened: {f.whatHappened}</p>
                <p className="mt-1 text-sm text-blue-gray">Caught by: {f.howCaught}</p>
                <p className="mt-1 text-sm text-blue-gray">Fix: {f.fix}</p>
                <p className="mt-1 text-sm text-blue-gray">Lesson: {f.lesson}</p>
                {f.commit && <p className="mt-1 font-mono text-xs text-cadet-grey">{f.commit}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Kept vs. rewritten</h2>
        <p className="mt-4 text-blue-gray">
          {log.keptVsRewritten.keptPct > 0
            ? `${log.keptVsRewritten.keptPct}% of AI-written code kept as-is.`
            : "Not yet measured — updates once enough of the build has landed."}
        </p>
        {log.keptVsRewritten.rewrittenAreas.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-blue-gray">
            {log.keptVsRewritten.rewrittenAreas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Cost</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(log.cost).map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">{k}</dt>
              <dd className="mt-1">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-2xl">Before this touches production</h2>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-blue-gray">
          {log.beforeProduction.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
