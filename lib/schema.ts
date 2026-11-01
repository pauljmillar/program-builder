import { z } from "zod";

export const FunderType = z.enum(["foundation", "corporate", "government"]);

export const Basics = z.object({
  name: z.string(),
  summary: z.string(),
  funder: z.object({
    name: z.string(),
    type: FunderType,
  }),
  fundingTotal: z.coerce.number().min(1),
  awardMin: z.coerce.number().min(1),
  awardMax: z.coerce.number().min(1),
  currency: z.literal("USD"),
  expectedApplications: z.coerce.number().min(1).optional(),
});

export const EligibilityOp = z.enum(["eq", "in", "lte", "gte", "exists"]);

export const EligibilityRule = z.object({
  id: z.string(),
  label: z.string(),
  field: z.string(),
  op: EligibilityOp,
  value: z.union([z.string(), z.number(), z.array(z.string())]),
  message: z.string(),
});

export const Eligibility = z.object({
  rules: z.array(EligibilityRule),
});

export const FieldType = z.enum([
  "short_text",
  "long_text",
  "number",
  "currency",
  "select",
  "multi_select",
  "date",
  "file",
  "ein",
  "address",
]);

export const FormField = z.object({
  key: z.string(),
  label: z.string(),
  type: FieldType,
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  maxWords: z.coerce.number().min(1).optional(),
  helpText: z.string().optional(),
});

export const FormSection = z.object({
  id: z.string(),
  title: z.string(),
  fields: z.array(FormField),
});

export const Form = z.object({
  sections: z.array(FormSection),
  estimatedMinutes: z.coerce.number().nonnegative(),
});

export const RubricCriterion = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.coerce.number().min(1),
  description: z.string(),
  formFieldKeys: z.array(z.string()),
});

export const Rubric = z.object({
  scale: z.object({ min: z.literal(1), max: z.literal(5) }),
  criteria: z.array(RubricCriterion),
});

export const ReviewerType = z.enum(["staff", "panel", "committee", "external"]);
export const AssignmentType = z.enum(["all", "round_robin", "by_category"]);

export const ReviewStage = z.object({
  order: z.coerce.number().int().min(1),
  name: z.string(),
  reviewerType: ReviewerType,
  reviewersPerApplication: z.coerce.number().min(1),
  panelSize: z.coerce.number().min(1).optional(),
  assignment: AssignmentType,
  advanceRule: z.string(),
});

export const ReviewStages = z.object({
  stages: z.array(ReviewStage),
});

export const Timeline = z.object({
  timezone: z.string(),
  opensAt: z.string(),
  closesAt: z.string(),
  reviewStartsAt: z.string(),
  decisionAt: z.string(),
  notifyAt: z.string(),
});

export const FaqItem = z.object({
  q: z.string(),
  a: z.string(),
});

export const Faq = z.object({
  items: z.array(FaqItem).min(1),
});

export const IssueSeverity = z.enum(["error", "warning"]);

export const Issue = z.object({
  code: z.string(),
  severity: IssueSeverity,
  section: z.string(),
  message: z.string(),
  fixedBy: z.enum(["repair"]).nullable().optional(),
});
export type Issue = z.infer<typeof Issue>;

export const Check = z.object({
  rounds: z.array(z.object({ round: z.number().int(), issues: z.array(Issue) })),
  fixed: z.array(Issue),
  remaining: z.array(Issue),
});

export const Program = z.object({
  promptVersion: z.string(),
  basics: Basics,
  eligibility: Eligibility,
  form: Form,
  rubric: Rubric,
  reviewStages: ReviewStages,
  timeline: Timeline,
  faq: Faq,
  check: Check,
});
export type Program = z.infer<typeof Program>;

// The sections the model drafts, before `check` is attached by the pipeline.
export const DraftProgram = Program.omit({ check: true });
export type DraftProgram = z.infer<typeof DraftProgram>;

export type FormFieldType = z.infer<typeof FieldType>;
export type Basics = z.infer<typeof Basics>;
export type EligibilityRule = z.infer<typeof EligibilityRule>;
export type Eligibility = z.infer<typeof Eligibility>;
export type FormField = z.infer<typeof FormField>;
export type FormSection = z.infer<typeof FormSection>;
export type Form = z.infer<typeof Form>;
export type RubricCriterion = z.infer<typeof RubricCriterion>;
export type Rubric = z.infer<typeof Rubric>;
export type ReviewStage = z.infer<typeof ReviewStage>;
export type ReviewStages = z.infer<typeof ReviewStages>;
export type Timeline = z.infer<typeof Timeline>;
export type FaqItem = z.infer<typeof FaqItem>;
export type Faq = z.infer<typeof Faq>;
export type Check = z.infer<typeof Check>;

export interface AnthropicToolInputSchema {
  type: "object";
  properties?: unknown;
  required?: string[];
  [key: string]: unknown;
}

export function programSectionJsonSchema<T extends z.ZodTypeAny>(schema: T): AnthropicToolInputSchema {
  return z.toJSONSchema(schema, { target: "draft-7" }) as AnthropicToolInputSchema;
}
