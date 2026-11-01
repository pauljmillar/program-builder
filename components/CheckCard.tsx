import type { Check } from "@/lib/schema";
import { cn } from "@/lib/utils";

export default function CheckCard({ check }: { check: Check }) {
  const hasIssues = check.fixed.length > 0 || check.remaining.length > 0;

  return (
    <div className="rounded-2xl border border-mist-gray bg-white p-6">
      <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">Check</div>

      {!hasIssues ? (
        <p className="mt-2 text-teal-green">Passed every check on the first pass.</p>
      ) : (
        <>
          {check.fixed.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-teal-green">
                Caught {check.fixed.length} problem{check.fixed.length === 1 ? "" : "s"} and fixed{" "}
                {check.fixed.length === 1 ? "it" : "them"}:
              </div>
              <ul className="mt-2 space-y-2 text-sm">
                {check.fixed.map((issue, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-sea-green">✓</span>
                    <span className="text-teal-green">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {check.remaining.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-deep-blue">Needs your call:</div>
              <ul className="mt-2 space-y-2 text-sm">
                {check.remaining.map((issue, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex gap-2 rounded-lg p-2",
                      issue.severity === "warning" && "bg-warm-ivory"
                    )}
                  >
                    <span className={issue.severity === "error" ? "text-orange-red" : "text-amber"}>
                      {issue.severity === "error" ? "✕" : "!"}
                    </span>
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
