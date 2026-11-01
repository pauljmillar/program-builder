import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";
import Prose from "@/components/Prose";
import { readMdx } from "@/lib/content";

export const metadata: Metadata = {
  title: "Why this project — Program Builder",
};

export default function WhyPage() {
  const markdown = readMdx("why.mdx");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Eyebrow>Why this project</Eyebrow>
      <div className="mt-8">
        <Prose markdown={markdown} />
      </div>
    </main>
  );
}
