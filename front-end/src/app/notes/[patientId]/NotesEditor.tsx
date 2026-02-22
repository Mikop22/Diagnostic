"use client";

import { useState } from "react";

export function NotesEditor() {
  const [notes, setNotes] = useState("");

  // Count lines for the ruled background
  const lineCount = Math.max(notes.split("\n").length + 3, 12);

  return (
    <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] px-10 py-8">
      <div className="relative mx-auto flex w-full max-w-[800px] flex-1 flex-col">
        {/* Ruled lines background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className="flex h-[56px] items-end [border-bottom:1px_solid_rgba(232,222,248,0.4)]"
            >
              <div className="mb-2.5 ml-0 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-primary)] opacity-40" />
            </div>
          ))}
        </div>

        {/* Editable textarea overlay */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Type your notes here..."
          className="relative z-10 w-full flex-1 resize-none bg-transparent pl-5 text-[15px] font-medium leading-[56px] tracking-[-0.1px] text-[var(--text-body)] placeholder:text-[var(--text-muted)] placeholder:opacity-50 focus:outline-none"
          spellCheck
        />
      </div>
    </div>
  );
}
