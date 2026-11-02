"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import type { Sample } from "@/lib/samples";
import { buildStepTimeline } from "@/lib/samples";
import StepList from "@/components/StepList";
import SectionCard from "@/components/SectionCard";
import CheckCard from "@/components/CheckCard";
import ProgramTabs from "@/components/ProgramTabs";
import {
  BasicsSummary,
  EligibilityList,
  FaqList,
  FormPreview,
  ReviewStagesList,
  RubricTable,
  TimelineList,
} from "@/components/sections";

function ReplayView({ sample, onBack }: { sample: Sample; onBack: () => void }) {
  const [revealed, setRevealed] = useState(0);
  const stepTimeline = useMemo(() => buildStepTimeline(sample.timings), [sample]);

  useEffect(() => {
    let cancelled = false;
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    stepTimeline.forEach((step, i) => {
      elapsed += step.ms;
      timers.push(
        setTimeout(() => {
          if (!cancelled) setRevealed(i + 1);
        }, elapsed)
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [stepTimeline]);

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div>
        <StepList
          steps={stepTimeline.map((step, i) => ({
            label: step.label,
            status: i < revealed ? "done" : i === revealed ? "active" : "pending",
            ms: step.ms,
          }))}
        />
        <button onClick={onBack} className="mt-4 text-sm text-signal-blue hover:underline">
          ← Try a different sample
        </button>
      </div>

      <div className="space-y-6">
        {revealed >= 1 && (
          <SectionCard title={sample.program.basics.name}>
            <BasicsSummary basics={sample.program.basics} />
          </SectionCard>
        )}
        {revealed >= 2 && (
          <SectionCard title="Eligibility">
            <EligibilityList rules={sample.program.eligibility.rules} />
          </SectionCard>
        )}
        {revealed >= 3 && (
          <SectionCard title={`Application form · ~${sample.program.form.estimatedMinutes} min to apply`}>
            <FormPreview form={sample.program.form} />
          </SectionCard>
        )}
        {revealed >= 4 && (
          <SectionCard title="Scoring rubric">
            <RubricTable rubric={sample.program.rubric} />
          </SectionCard>
        )}
        {revealed >= 5 && (
          <SectionCard title="Review stages">
            <ReviewStagesList stages={sample.program.reviewStages.stages} />
          </SectionCard>
        )}
        {revealed >= 6 && (
          <SectionCard title="Timeline">
            <TimelineList timeline={sample.program.timeline} />
          </SectionCard>
        )}
        {revealed >= 7 && (
          <SectionCard title="Applicant FAQ">
            <FaqList items={sample.program.faq.items} />
          </SectionCard>
        )}
        {revealed >= 8 && <CheckCard check={sample.program.check} />}
        {revealed >= 8 && <ProgramTabs program={sample.program} />}
      </div>
    </div>
  );
}

export default function ProgramDemo({ samples }: { samples: Sample[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = samples.find((s) => s.id === selectedId) ?? null;

  if (!selected) {
    return (
      <div className="grid gap-6 sm:grid-cols-3">
        {samples.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              track("sample_clicked", { sampleId: s.id });
              setSelectedId(s.id);
            }}
            className="rounded-2xl border border-mist-gray bg-white p-6 text-left transition hover:border-signal-blue focus-visible:border-signal-blue"
          >
            <div className="font-sans text-lg">{s.title}</div>
            <p className="mt-2 text-sm text-blue-gray">{s.prompt}</p>
          </button>
        ))}
      </div>
    );
  }

  return <ReplayView key={selected.id} sample={selected} onBack={() => setSelectedId(null)} />;
}
