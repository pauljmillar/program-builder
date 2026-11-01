export interface StepListItem {
  label: string;
  status: "done" | "active" | "pending";
  ms: number;
}

export default function StepList({ steps }: { steps: StepListItem[] }) {
  return (
    <div className="rounded-2xl border border-mist-gray bg-white p-4">
      <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">
        Building your program
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className={
                  step.status === "done"
                    ? "text-teal-green"
                    : step.status === "active"
                      ? "animate-pulse text-signal-blue"
                      : "text-cadet-grey"
                }
              >
                {step.status === "done" ? "✓" : step.status === "active" ? "●" : "○"}
              </span>
              <span className={step.status === "pending" ? "text-cadet-grey" : "text-deep-blue"}>
                {step.label}
              </span>
            </span>
            {step.status === "done" && (
              <span className="font-mono text-xs text-blue-gray">{(step.ms / 1000).toFixed(1)}s</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
