"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPaperUrl } from "@/lib/api";
import type { ConditionMatch } from "@/lib/types";

// Global blob cache — persists across accordion open/close cycles
const blobCache = new Map<string, string>();
const fetchPromises = new Map<string, Promise<string | null>>();

function fetchAndCache(pmcid: string): Promise<string | null> {
  if (blobCache.has(pmcid)) return Promise.resolve(blobCache.get(pmcid)!);
  if (fetchPromises.has(pmcid)) return fetchPromises.get(pmcid)!;

  const promise = fetch(getPaperUrl(pmcid), {
    headers: { "ngrok-skip-browser-warning": "true" },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      blobCache.set(pmcid, blobUrl);
      fetchPromises.delete(pmcid);
      return blobUrl;
    })
    .catch(() => {
      fetchPromises.delete(pmcid);
      return null;
    });

  fetchPromises.set(pmcid, promise);
  return promise;
}

function usePdfBlob(pmcid: string | null) {
  const [url, setUrl] = useState<string | null>(
    pmcid ? blobCache.get(pmcid) ?? null : null
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pmcid) return;
    // Already cached — instant
    if (blobCache.has(pmcid)) {
      setUrl(blobCache.get(pmcid)!);
      return;
    }
    fetchAndCache(pmcid).then((blobUrl) => {
      if (blobUrl) setUrl(blobUrl);
      else setError(true);
    });
  }, [pmcid]);

  return { url, error };
}

/** Prefetch all PDFs in background so they're cached when user clicks */
function usePrefetchPdfs(pmcids: string[]) {
  useEffect(() => {
    pmcids.forEach((id) => fetchAndCache(id));
  }, [pmcids]);
}

function PdfViewer({ pmcid, title }: { pmcid: string | null; title: string }) {
  const { url, error } = usePdfBlob(pmcid);

  if (!pmcid) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 border-t border-slate-100">
        <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="text-sm font-medium text-slate-500 mb-1">PDF not available</p>
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/?term=${pmcid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
        >
          View on PubMed &rarr;
        </a>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex items-center justify-center py-12 bg-slate-50 border-t border-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
      </div>
    );
  }

  return (
    <div className="h-[600px]">
      <iframe src={url} className="w-full h-full border-0" title={`Paper: ${title}`} />
    </div>
  );
}

interface AccordionProps {
  matches: ConditionMatch[];
}

export function DiagnosticNudgeAccordion({ matches }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Prefetch all PDFs as soon as the accordion mounts
  usePrefetchPdfs(matches.map((m) => m.pmcid));

  return (
    <div className="space-y-3">
      {matches.map((match, i) => {
        const isOpen = openIndex === i;
        const scorePercent = (match.similarity_score * 100).toFixed(1);

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
                  <PdfViewer pmcid={isOpen ? match.pmcid : null} title={match.title} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
