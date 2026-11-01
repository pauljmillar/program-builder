"use client";

import { useState } from "react";
import type { Program } from "@/lib/schema";
import { cn } from "@/lib/utils";

const SUBMITTABLE_MAPPING: { section: string; submittableConcept: string }[] = [
  { section: "Eligibility", submittableConcept: "Eligibility requirements" },
  { section: "Application form", submittableConcept: "Initial form" },
  { section: "Scoring rubric", submittableConcept: "Scorecard" },
  { section: "Review stages", submittableConcept: "Review stages" },
  { section: "Timeline", submittableConcept: "Deadlines & rounds" },
  { section: "Applicant FAQ", submittableConcept: "Guidelines page" },
];

const TABS = ["program", "json", "submittable"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  program: "Program",
  json: "JSON",
  submittable: "In Submittable",
};

export default function ProgramTabs({ program }: { program: Program }) {
  const [tab, setTab] = useState<Tab>("program");

  return (
    <div className="rounded-2xl border border-mist-gray bg-white p-6">
      <div className="flex gap-4 border-b border-oyster pb-3 text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "pb-1",
              tab === t ? "border-b-2 border-signal-blue text-signal-blue" : "text-blue-gray"
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "program" && (
        <p className="mt-4 text-sm text-blue-gray">
          A readable version of everything above — scroll up to see each section, or switch to JSON
          for the raw output.
        </p>
      )}

      {tab === "json" && (
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-deep-blue p-4 font-mono text-xs text-milk-white">
          {JSON.stringify(program, null, 2)}
        </pre>
      )}

      {tab === "submittable" && (
        <div className="mt-4">
          <p className="text-sm text-blue-gray">
            Concept mapping, not a real integration — this is what each section would become in
            Submittable.
          </p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {SUBMITTABLE_MAPPING.map((row) => (
                <tr key={row.section} className="border-b border-oyster last:border-0">
                  <td className="py-2 pr-4 font-medium">{row.section}</td>
                  <td className="py-2 text-blue-gray">{row.submittableConcept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
