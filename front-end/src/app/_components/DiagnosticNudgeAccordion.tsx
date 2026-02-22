"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPaperUrl } from "@/lib/api";
import type { ConditionMatch } from "@/lib/types";

interface AccordionProps {
  matches: ConditionMatch[];
}

export function DiagnosticNudgeAccordion({ matches }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pdfErrors, setPdfErrors] = useState<Record<number, boolean>>({});

  function handlePdfError(index: number) {
    setPdfErrors((prev) => ({ ...prev, [index]: true }));
  }

  return (
    <div className="space-y-3">
      {matches.map((match, i) => {
        const isOpen = openIndex === i;
        const scorePercent = (match.similarity_score * 100).toFixed(1);
        const hasPdfError = pdfErrors[i];

        return (
          <motion.div
            key={match.pmcid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-lg border border-slate-200 overflow-hidden"
          >
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
                <motion.svg
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-t border-slate-200"
                >
                  <div className="px-5 py-3 bg-slate-50">
                    <p className="text-sm text-slate-700">{match.snippet}</p>
                  </div>
                  {hasPdfError ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 border-t border-slate-100">
                      <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500 mb-1">PDF not available</p>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/?term=${match.pmcid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
                      >
                        View on PubMed &rarr;
                      </a>
                    </div>
                  ) : (
                    <div className="h-[600px]">
                      <iframe
                        src={getPaperUrl(match.pmcid)}
                        className="w-full h-full border-0"
                        title={`Paper: ${match.title}`}
                        onError={() => handlePdfError(i)}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
