"use client";

import { track } from "@vercel/analytics";

export default function TrackedLink({
  event,
  className,
  href,
  title,
  children,
}: {
  event: string;
  className?: string;
  href: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} title={title} className={className} onClick={() => track(event)}>
      {children}
    </a>
  );
}
