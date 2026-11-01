import type { DraftProgram } from "@/lib/schema";

/**
 * A fully valid program that passes every rule in lib/validate with zero issues.
 * Each rule's test clones this and breaks exactly one thing.
 */
export function baseProgram(): DraftProgram {
  return structuredClone({
    promptVersion: "v1",
    basics: {
      name: "Climate Resilience Fund",
      summary: "Grants for climate resilience projects run by nonprofits.",
      funder: { name: "Test Foundation", type: "foundation" },
      fundingTotal: 500_000,
      awardMin: 5_000,
      awardMax: 25_000,
      currency: "USD",
      expectedApplications: 100,
    },
    eligibility: {
      rules: [
        {
          id: "r1",
          label: "Based in Illinois, Indiana or Wisconsin",
          field: "state",
          op: "in",
          value: ["IL", "IN", "WI"],
          message: "Organization must be based in IL, IN or WI.",
        },
      ],
    },
    form: {
      sections: [
        {
          id: "s1",
          title: "Organization",
          fields: [
            {
              key: "state",
              label: "State",
              type: "select",
              required: true,
              options: ["IL", "IN", "WI"],
            },
            {
              key: "project_description",
              label: "Project description",
              type: "long_text",
              required: true,
              maxWords: 500,
            },
          ],
        },
      ],
      estimatedMinutes: 10,
    },
    rubric: {
      scale: { min: 1, max: 5 },
      criteria: [
        {
          key: "impact",
          label: "Impact",
          weight: 60,
          description: "How much climate benefit the project delivers.",
          formFieldKeys: ["project_description"],
        },
        {
          key: "feasibility",
          label: "Feasibility",
          weight: 40,
          description: "Whether the project can realistically be delivered.",
          formFieldKeys: ["project_description"],
        },
      ],
    },
    reviewStages: {
      stages: [
        {
          order: 1,
          name: "Staff screening",
          reviewerType: "staff",
          reviewersPerApplication: 1,
          assignment: "all",
          advanceRule: "Pass eligibility and completeness check",
        },
        {
          order: 2,
          name: "Community panel",
          reviewerType: "panel",
          reviewersPerApplication: 3,
          panelSize: 5,
          assignment: "all",
          advanceRule: "Top 10 by weighted score",
        },
      ],
    },
    timeline: {
      timezone: "America/Chicago",
      opensAt: "2027-01-15T00:00:00Z",
      closesAt: "2027-03-01T00:00:00Z",
      reviewStartsAt: "2027-03-02T00:00:00Z",
      decisionAt: "2027-04-01T00:00:00Z",
      notifyAt: "2027-04-02T00:00:00Z",
    },
    faq: {
      items: [{ q: "Who can apply?", a: "Nonprofits based in IL, IN or WI." }],
    },
  } satisfies DraftProgram);
}
