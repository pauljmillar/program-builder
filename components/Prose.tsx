import ReactMarkdown from "react-markdown";

export default function Prose({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:font-sans prose-headings:font-normal prose-a:text-signal-blue">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
