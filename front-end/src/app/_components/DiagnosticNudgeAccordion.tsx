"use client";

import { useState } from "react";
import { getPaperUrl } from "@/lib/api";
import type { ConditionMatch } from "@/lib/types";

interface AccordionProps {
  matches: ConditionMatch[];
}

export function DiagnosticNudgeAccordion({ matches }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {matches.map((match, i) => {
        const isOpen = openIndex === i;
        const scorePercent = (match.similarity_score * 100).toFixed(1);

        return (
          <div key={match.pmcid} className="rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-600">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{match.condition}</p>
                  <p className="text-xs text-slate-500">{match.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500">{scorePercent}% match</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-slate-200">
                <div className="px-5 py-3 bg-slate-50">
                  <p className="text-sm text-slate-700">{match.snippet}</p>
                </div>
                <div className="h-[600px]">
                  <iframe src={getPaperUrl(match.pmcid)} className="w-full h-full border-0" title={`Paper: ${match.title}`} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
