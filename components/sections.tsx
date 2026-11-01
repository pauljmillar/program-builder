import type { Basics, EligibilityRule, FaqItem, Form, ReviewStage, Rubric, Timeline } from "@/lib/schema";

export function BasicsSummary({ basics }: { basics: Basics }) {
  return (
    <div>
      <p className="text-blue-gray">{basics.summary}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-blue-gray">Funder</dt>
          <dd>{basics.funder.name}</dd>
        </div>
        <div>
          <dt className="text-blue-gray">Total funding</dt>
          <dd>${basics.fundingTotal.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-blue-gray">Award range</dt>
          <dd>
            ${basics.awardMin.toLocaleString()}–${basics.awardMax.toLocaleString()}
          </dd>
        </div>
        {basics.expectedApplications && (
          <div>
            <dt className="text-blue-gray">Expected applications</dt>
            <dd>{basics.expectedApplications.toLocaleString()}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function EligibilityList({ rules }: { rules: EligibilityRule[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {rules.map((r) => (
        <li key={r.id}>• {r.label}</li>
      ))}
    </ul>
  );
}

export function FormPreview({ form }: { form: Form }) {
  return (
    <div className="space-y-4">
      {form.sections.map((s) => (
        <div key={s.id}>
          <div className="font-mono text-xs uppercase tracking-[0.08em] text-blue-gray">{s.title}</div>
          <ul className="mt-1 text-sm">
            {s.fields.map((f) => (
              <li key={f.key}>
                {f.label}
                {f.required ? "" : " (optional)"}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RubricTable({ rubric }: { rubric: Rubric }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rubric.criteria.map((c) => (
          <tr key={c.key} className="border-b border-oyster last:border-0">
            <td className="py-2 pr-4 align-top font-medium">{c.label}</td>
            <td className="py-2 pr-4 align-top text-blue-gray">{c.weight}%</td>
            <td className="py-2 align-top text-blue-gray">{c.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ReviewStagesList({ stages }: { stages: ReviewStage[] }) {
  return (
    <ol className="space-y-2 text-sm">
      {stages.map((s) => (
        <li key={s.order}>
          <span className="font-medium">
            {s.order}. {s.name}
          </span>{" "}
          — {s.reviewerType}
          {s.panelSize ? ` (panel of ${s.panelSize})` : ""}, {s.assignment.replace("_", " ")}
        </li>
      ))}
    </ol>
  );
}

export function TimelineList({ timeline }: { timeline: Timeline }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
      <div>
        <dt className="text-blue-gray">Opens</dt>
        <dd>{fmt(timeline.opensAt)}</dd>
      </div>
      <div>
        <dt className="text-blue-gray">Closes</dt>
        <dd>{fmt(timeline.closesAt)}</dd>
      </div>
      <div>
        <dt className="text-blue-gray">Review starts</dt>
        <dd>{fmt(timeline.reviewStartsAt)}</dd>
      </div>
      <div>
        <dt className="text-blue-gray">Decision</dt>
        <dd>{fmt(timeline.decisionAt)}</dd>
      </div>
      <div>
        <dt className="text-blue-gray">Notify</dt>
        <dd>{fmt(timeline.notifyAt)}</dd>
      </div>
    </dl>
  );
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3 text-sm">
      {items.map((item, i) => (
        <div key={i}>
          <div className="font-medium">{item.q}</div>
          <p className="mt-1 text-blue-gray">{item.a}</p>
        </div>
      ))}
    </div>
  );
}
