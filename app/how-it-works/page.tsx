import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";

export const metadata: Metadata = {
  title: "How it works — Program Builder",
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Eyebrow>For engineers</Eyebrow>
      <h1 className="mt-6 font-display text-4xl">How it works</h1>
      <p className="mt-4 text-blue-gray">
        Architecture, the generation pipeline, evaluation results and guardrails land here once
        the pipeline and eval harness are built.
      </p>
    </main>
  );
}
