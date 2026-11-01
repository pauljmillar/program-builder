import { cn } from "@/lib/utils";

export default function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-[6.25rem] bg-warm-stone px-[0.8rem] py-[0.5rem] font-mono text-xs uppercase tracking-[0.08em] text-deep-blue",
        className
      )}
    >
      {children}
    </span>
  );
}
