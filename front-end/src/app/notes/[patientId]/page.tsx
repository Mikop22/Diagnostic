import {
  CircleUserRound,
  ChevronDown,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

/* ── Diagnostic Nudge Accordion Import ── */
import { DiagnosticNudgeAccordion } from "@/app/_components/DiagnosticNudgeAccordion";
import { getDashboardData } from "@/lib/api";

/* Number of extra empty ruled lines after content */
const EMPTY_LINES = 3;

/* ── Page ── */

export default async function NotesPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;

  // Since we don't have real time-series hardware for this test patient,
  const isTestPatient = patientId === "1e996459-a341-45de-993a-6bf64fa9b51e";
  const patientName = isTestPatient ? "Test Patient" : "Unknown Patient";

  // 1. Await the real analysis response from the backend 
  const result = await getDashboardData(patientId);

  // 2. Safely unpack real data
  const { clinical_brief, condition_matches } = result;

  // 3. Map to UI 
  // Map the new structured summary content to the notebook lines
  const noteLines = [
    clinical_brief.summary,
    "",
    "RECOMMENDED ACTIONS:",
    ...clinical_brief.recommended_actions.map(action => `- ${action}`),
  ];

  return (
    <div className="flex h-full w-full flex-col bg-transparent font-poppins">
      {/* ── Navigation Bar ── */}
      <nav className="glass-nav flex h-16 shrink-0 items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Link href="/patients" className="gradient-logo text-[24px] font-medium tracking-[-0.1px]">
            diagnostic
          </Link>
          <div className="flex gap-2">
            <Link href="/patients" className="flex items-center justify-center rounded-[20px] border border-[var(--border-nav-inactive)] bg-transparent px-5 py-2 transition-colors hover:bg-[var(--lavender-bg)]">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">Patients</span>
            </Link>
            <Link href="/schedule" className="flex items-center justify-center rounded-[20px] border border-[var(--border-nav-inactive)] bg-transparent px-5 py-2 transition-colors hover:bg-[var(--lavender-bg)]">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">Schedule</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CircleUserRound className="h-7 w-7 text-[var(--purple-primary)]" strokeWidth={1.5} />
          <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Dr. Patel</span>
          <ChevronDown className="h-4 w-4 text-[var(--text-nav)]" />
        </div>
      </nav>

      {/* ── Notes Content ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 px-8 py-8">
        {/* Patient header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-semibold tracking-[-0.3px] text-[var(--text-primary)]">
              {patientName}
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-[16px] bg-[rgba(243,237,250,0.5)] px-4 py-2">
            <span className="text-[14px] font-medium tracking-[0.5px] uppercase text-[var(--text-secondary)]">Date:</span>
            <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Mar. 10, 2026</span>
          </div>
        </div>

        {/* Main area: notes + research sidebar */}
        <div className="flex min-h-0 flex-1 gap-8">
          {/* Notes card — ruled notebook */}
          <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] px-10 py-8">
            <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col">
              {/* Lines with text */}
              {noteLines.map((line, i) => (
                <div
                  key={i}
                  className="flex h-[56px] shrink-0 items-end gap-3 [border-bottom:1px_solid_rgba(232,222,248,0.4)]"
                >
                  <div className="mb-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-primary)] opacity-40" />
                  <span className="pb-2 text-[15px] font-medium leading-relaxed tracking-[-0.1px] text-[var(--text-body)]">
                    {line}
                  </span>
                </div>
              ))}

              {/* Empty ruled lines */}
              {Array.from({ length: EMPTY_LINES }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className={`shrink-0 [border-bottom:1px_solid_rgba(232,222,248,0.4)] ${i === EMPTY_LINES - 1 ? "flex-1" : "h-[56px]"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Research sidebar */}
          <div className="glass-card flex w-[380px] shrink-0 flex-col gap-5 overflow-y-auto rounded-[24px] px-7 py-8">
            <h3 className="text-[16px] font-semibold tracking-[-0.1px] text-[var(--text-primary)]">
              Notable Research
            </h3>

            {/* Use the new DiagnosticNudgeAccordion directly here, filtering out bad scores if needed, 
                but mapping directly to the response format */}
            <DiagnosticNudgeAccordion matches={condition_matches} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/${patientId}`}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
          >
            <ChevronLeft className="h-[18px] w-[18px] text-[var(--purple-primary)]" />
            <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--purple-primary)]">Back</span>
          </Link>

          <button className="glass-purple flex items-center gap-2 rounded-[20px] px-5 py-2.5 transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98]">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-[13px] font-medium text-white">Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
