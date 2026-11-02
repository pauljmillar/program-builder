import Link from "next/link";

const links = [
  { href: "/why", label: "Why this project" },
  { href: "/build-log", label: "Build log" },
  { href: "/how-it-works", label: "How it works" },
  { href: "https://github.com/pauljmillar/program-builder", label: "GitHub" },
];

export default function Footer() {
  return (
    <footer className="bg-deep-blue text-milk-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm">
        <span className="font-mono uppercase tracking-[0.08em] text-cadet-grey">
          Program Builder — Paul Millar
        </span>
        <nav className="flex flex-wrap gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-sky-blue focus-visible:text-sky-blue"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
