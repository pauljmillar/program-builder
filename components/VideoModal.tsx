"use client";

import { useState } from "react";

export default function VideoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border-2 border-milk-white px-8 py-[1.12rem] font-sans text-milk-white transition hover:bg-white/10"
      >
        Watch 45 seconds
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep-blue/80 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-md rounded-2xl bg-white p-8 text-deep-blue"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg">The 45-second walkthrough hasn&apos;t been recorded yet.</p>
            <p className="mt-2 text-sm text-blue-gray">
              In the meantime, scroll down and click a sample — it replays the whole thing for
              real, no video needed.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 rounded-lg border-2 border-deep-blue px-6 py-2 text-sm hover:bg-deep-blue/5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
