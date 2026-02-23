"use client";

// ─── REFACTOR SUMMARY ──────────────────────────────────────────────────────────
// DELETED:  Standalone "Key Deltas" number cards — delta value + pill now embedded
//           in the top-left corner of each respective BiometricChart component.
// DELETED:  Standalone "Screening Count" bar graph — redundant real estate; folded
//           into Risk Profile card as a compact badge row.
// MERGED:   "Symptoms" list + patient narrative → single "Clinical Intake" card
//           with a two-tab toggle: "In Patient's Words" vs "AI Extracted".
// ADDED:    Patient header strip (name, hardware, risk context, XRPL badge).
// ADDED:    DiagnosticNudgeAccordion replaces the mini similarity-bar rows in the
//           "Possible Diagnosis" card — each condition now expands to show PMCID,
//           paper title, abstract snippet, and inline PDF viewer.
// ──────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  CircleHelp,
  Info,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { ClientCharts } from "./ClientCharts";
import { DiagnosticNudgeAccordion } from "@/app/_components/DiagnosticNudgeAccordion";
import type { AnalysisResponse, PatientPayload } from "@/lib/types";

const sectionVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

// ─── Demo data mirrors the CLAUDE.md mock payload ────────────────────────────
const DEMO_ACUTE_METRICS = {
  heartRateVariabilitySDNN: [
    { date: "2026-02-15", value: 48.2, unit: "ms" },
    { date: "2026-02-16", value: 47.1, unit: "ms" },
    { date: "2026-02-17", value: 45.9, unit: "ms" },
    { date: "2026-02-18", value: 22.4, unit: "ms" },
    { date: "2026-02-19", value: 24.1, unit: "ms" },
    { date: "2026-02-20", value: 28.5, unit: "ms" },
    { date: "2026-02-21", value: 31.0, unit: "ms" },
  ],
  restingHeartRate: [
    { date: "2026-02-15", value: 62, unit: "bpm" },
    { date: "2026-02-16", value: 63, unit: "bpm" },
    { date: "2026-02-17", value: 62, unit: "bpm" },
    { date: "2026-02-18", value: 78, unit: "bpm" },
    { date: "2026-02-19", value: 76, unit: "bpm" },
    { date: "2026-02-20", value: 74, unit: "bpm" },
    { date: "2026-02-21", value: 72, unit: "bpm" },
  ],
  appleSleepingWristTemperature: [
    { date: "2026-02-15", value: -0.12, unit: "degC_deviation" },
    { date: "2026-02-16", value: -0.10, unit: "degC_deviation" },
    { date: "2026-02-17", value: 0.05, unit: "degC_deviation" },
    { date: "2026-02-18", value: 0.85, unit: "degC_deviation" },
    { date: "2026-02-19", value: 0.92, unit: "degC_deviation" },
    { date: "2026-02-20", value: 0.80, unit: "degC_deviation" },
    { date: "2026-02-21", value: 0.75, unit: "degC_deviation" },
  ],
  respiratoryRate: [
    { date: "2026-02-15", value: 14.5, unit: "breaths/min" },
    { date: "2026-02-16", value: 14.6, unit: "breaths/min" },
    { date: "2026-02-17", value: 14.5, unit: "breaths/min" },
    { date: "2026-02-18", value: 18.2, unit: "breaths/min" },
    { date: "2026-02-19", value: 17.8, unit: "breaths/min" },
    { date: "2026-02-20", value: 16.5, unit: "breaths/min" },
    { date: "2026-02-21", value: 16.0, unit: "breaths/min" },
  ],
  walkingAsymmetryPercentage: [
    { date: "2026-02-15", value: 1.2, unit: "%" },
    { date: "2026-02-16", value: 1.5, unit: "%" },
    { date: "2026-02-17", value: 1.3, unit: "%" },
    { date: "2026-02-18", value: 8.5, unit: "%" },
    { date: "2026-02-19", value: 8.2, unit: "%" },
    { date: "2026-02-20", value: 6.0, unit: "%" },
    { date: "2026-02-21", value: 5.5, unit: "%" },
  ],
  stepCount: [
    { date: "2026-02-15", value: 8500, unit: "count" },
    { date: "2026-02-16", value: 8200, unit: "count" },
    { date: "2026-02-17", value: 8600, unit: "count" },
    { date: "2026-02-18", value: 1200, unit: "count" },
    { date: "2026-02-19", value: 1500, unit: "count" },
    { date: "2026-02-20", value: 2500, unit: "count" },
    { date: "2026-02-21", value: 3000, unit: "count" },
  ],
  sleepAnalysis_awakeSegments: [
    { date: "2026-02-15", value: 1, unit: "count" },
    { date: "2026-02-16", value: 1, unit: "count" },
    { date: "2026-02-17", value: 2, unit: "count" },
    { date: "2026-02-18", value: 6, unit: "count" },
    { date: "2026-02-19", value: 5, unit: "count" },
    { date: "2026-02-20", value: 4, unit: "count" },
    { date: "2026-02-21", value: 3, unit: "count" },
  ],
};

// Patient name lookup — in production this would come from the patient management API
const DEMO_PATIENT_NAMES: Record<string, string> = {
  "pt_883920_x": "Amara Osei",
};

// Demo patient narrative — production value arrives via patient_payload.patient_narrative
const DEMO_NARRATIVE =
  "Over the past two weeks, the pain has become unbearable. It started slowly, " +
  "but then on the 18th I couldn't get out of bed — the cramping was so severe I " +
  "couldn't walk without hunching over. I counted six times waking up that night. " +
  "My heart was racing and I was sweating. I've had flares before but nothing like " +
  "this. Every step feels like something is twisting inside me. I've cut my movement " +
  "to almost nothing. I've been short of breath even just walking to the bathroom, " +
  "and nothing my last doctor suggested has helped at all.";

// ─── XRPL Provenance Badge ────────────────────────────────────────────────────
function XRPLBadge() {
  return (
    <div
      className="glass-card flex items-center gap-3 rounded-[16px] px-4 py-3"
      style={{ boxShadow: "0 4px 16px rgba(93,46,168,0.12), inset 0 1px 0 rgba(255,255,255,0.40)" }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: "linear-gradient(135deg, rgba(93,46,168,0.15), rgba(61,189,173,0.15))" }}
      >
        <ShieldCheck className="h-4 w-4" style={{ color: "#3DBDAD" }} strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold tracking-[0.5px] text-[var(--purple-primary)] uppercase">
          XRPL Verified
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-wide">
          Tx: 8F2A…9B1C
        </span>
      </div>
    </div>
  );
}

// ─── Glass tooltip ────────────────────────────────────────────────────────────
function GlassTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <div
        className="glass-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(4px)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ─── Intake tab toggle ────────────────────────────────────────────────────────
function IntakeTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[14px] px-3 py-1 text-[12px] font-medium tracking-[-0.1px] transition-all ${
        active
          ? "nav-pill-active text-[var(--purple-primary)]"
          : "text-[var(--text-nav)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

interface DashboardContentProps {
  data: AnalysisResponse & { patient_payload?: PatientPayload };
  patientId: string;
}

export function DashboardContent({ data, patientId }: DashboardContentProps) {
  const [intakeTab, setIntakeTab] = useState<"narrative" | "ai">("narrative");

  const { clinical_brief, biometric_deltas, condition_matches, patient_payload } = data;
  const acuteMetrics = patient_payload?.data?.acute_7_day?.metrics || DEMO_ACUTE_METRICS;
  const narrative = patient_payload?.patient_narrative ?? DEMO_NARRATIVE;
  const hardwareSource = patient_payload?.hardware_source ?? "Apple Watch Series 9";
  const patientName = DEMO_PATIENT_NAMES[data.patient_id] ?? `Patient ${data.patient_id}`;

  const guidingQuestions = clinical_brief.guiding_questions || [];
  const symptoms = clinical_brief.key_symptoms.slice(0, 6);
  const riskFactors = data.risk_profile?.factors || [];
  const topRisk = riskFactors.find((f) => f.severity === "high") ?? riskFactors[0];

  const getSeverityStyle = (severity: string, weight: number) => {
    const w = Math.min(200, Math.max(36, weight * 2.0));
    switch (severity.toLowerCase()) {
      case "high":     return { dot: "var(--red-alert)",      gradient: "url(#riskGradHigh)",     width: w };
      case "elevated": return { dot: "var(--purple-accent)",  gradient: "url(#riskGradElevated)", width: w };
      case "moderate": return { dot: "var(--purple-primary)", gradient: "url(#riskGradMod)",      width: w };
      default:         return { dot: "var(--lavender-border)", fill: "var(--lavender-border)",     width: w };
    }
  };

  return (
    <>
      {/* ══ PATIENT HEADER ══════════════════════════════════════════════════ */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex shrink-0 items-center justify-between"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-[var(--text-primary)]">
            {patientName}
          </h1>
          <div className="flex items-center gap-2">
            {/* Hardware source chip */}
            <span className="flex items-center gap-1.5 rounded-[12px] border border-[var(--lavender-border)] bg-[var(--lavender-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
              <Cpu className="h-3 w-3" />
              {hardwareSource}
            </span>
            {/* Top risk context */}
            {topRisk && (
              <span
                className="rounded-[12px] px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background:
                    topRisk.severity === "high"
                      ? "rgba(226,92,92,0.10)"
                      : "rgba(93,46,168,0.08)",
                  color:
                    topRisk.severity === "high"
                      ? "var(--red-alert)"
                      : "var(--purple-primary)",
                }}
              >
                {topRisk.factor} · {topRisk.severity.toUpperCase()}
              </span>
            )}
            <span className="text-[11px] text-[var(--text-muted)]">
              {patient_payload?.patient_id ?? data.patient_id}
            </span>
          </div>
        </div>

        {/* XRPL cryptographic provenance badge — top-right of dashboard header */}
        <XRPLBadge />
      </motion.div>

      {/* ══ TOP ROW: Clinical Intake + Guiding Questions ════════════════════ */}
      <motion.div
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex min-h-0 flex-[10] gap-8"
      >
        {/* Clinical Intake — merged Symptoms + Patient Narrative */}
        <div className="glass-card flex w-[54%] shrink-0 flex-col overflow-hidden rounded-[24px]">
          <div className="flex shrink-0 items-center justify-between px-5 py-4">
            <span className="text-[15px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
              Clinical Intake
            </span>
            <div className="flex items-center gap-1">
              <IntakeTab
                active={intakeTab === "narrative"}
                label="In Patient's Words"
                onClick={() => setIntakeTab("narrative")}
              />
              <IntakeTab
                active={intakeTab === "ai"}
                label="AI Extracted"
                onClick={() => setIntakeTab("ai")}
              />
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {intakeTab === "narrative" ? (
                <motion.div
                  key="narrative"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 overflow-y-auto px-5 pb-4"
                >
                  <p className="text-[13px] leading-[1.65] text-[var(--text-body)]">
                    &ldquo;{narrative}&rdquo;
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 overflow-y-auto px-5 pb-4"
                >
                  <div className="flex flex-col gap-2">
                    {symptoms.map((s) => (
                      <div key={s} className="flex items-start gap-2.5">
                        <div className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-accent)]" />
                        <span className="text-[13px] leading-[1.55] text-[var(--text-body)]">{s}</span>
                      </div>
                    ))}
                    {symptoms.length === 0 && (
                      <span className="text-[12px] text-[var(--text-muted)]">No symptoms extracted.</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Guiding Questions */}
        <div className="glass-card flex flex-1 flex-col overflow-hidden rounded-[24px]">
          <div className="flex shrink-0 items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-[var(--purple-primary)]" />
              <span className="text-[15px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
                Guiding Questions
              </span>
            </div>
            <GlassTooltip text="AI-generated clinical questions based on biometric + narrative data">
              <Info className="h-[16px] w-[16px] cursor-help text-[var(--text-nav)]" />
            </GlassTooltip>
          </div>
          <div className="flex flex-col gap-2.5 overflow-y-auto px-5 pb-4 pt-1">
            {guidingQuestions.map((q) => (
              <div key={q} className="flex items-start gap-2.5">
                <div className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-primary)]" />
                <span className="text-[13px] leading-[1.55] text-[var(--text-body)]">{q}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══ METRICS ROW: 4 Biometric Charts (delta embedded) ═══════════════ */}
      <motion.div
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex min-h-0 flex-[9] gap-8"
      >
        <ClientCharts biometricDeltas={biometric_deltas} acuteData={acuteMetrics} />
      </motion.div>

      {/* ══ BOTTOM ROW: Risk Profile + Possible Diagnosis ═══════════════════ */}
      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex min-h-0 flex-[12] gap-8"
      >
        {/* Risk Profile — Screening Count folded in as badge row at top */}
        <div className="glass-card flex w-[36%] shrink-0 flex-col overflow-hidden rounded-[24px]">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-[18px] py-3.5">
            <span className="text-[14px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
              Risk Profile
            </span>
            <GlassTooltip text="Systematic risk factors based on demographic and clinical data">
              <Info className="h-3.5 w-3.5 cursor-help text-[var(--text-nav)]" />
            </GlassTooltip>
          </div>

          {/* Screening Count badge — formerly a standalone card, now folded in */}
          <div className="mx-[18px] mb-3 flex items-center justify-between rounded-[12px] bg-[var(--lavender-bg)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">MRI Screenings</span>
              <span className="rounded-[8px] bg-[var(--lavender-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--purple-primary)]">
                Expected
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-[56px] overflow-hidden rounded-[3px] bg-[rgba(232,222,248,0.6)]">
                <div
                  className="animate-fill-bar h-full w-[65%] rounded-[3px] bg-gradient-to-r from-[var(--purple-primary)] to-[var(--purple-accent)]"
                />
              </div>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">65%</span>
            </div>
          </div>

          {/* Risk factor bars */}
          <div className="flex flex-col gap-3 overflow-y-auto px-[18px] pb-4">
            <svg className="absolute h-0 w-0">
              <defs>
                <linearGradient id="riskGradHigh">
                  <stop offset="0%" stopColor="#D92D20" />
                  <stop offset="100%" stopColor="#F97066" />
                </linearGradient>
                <linearGradient id="riskGradElevated">
                  <stop offset="0%" stopColor="#5D2EA8" />
                  <stop offset="100%" stopColor="#B58DE0" />
                </linearGradient>
                <linearGradient id="riskGradMod">
                  <stop offset="0%" stopColor="#7F56D9" />
                  <stop offset="100%" stopColor="#B692F6" />
                </linearGradient>
              </defs>
            </svg>
            {riskFactors.length > 0 ? (
              riskFactors.map((factor, i) => {
                const style = getSeverityStyle(factor.severity, factor.weight);
                return (
                  <div
                    key={i}
                    className="flex w-full items-center gap-3"
                    title={`${factor.category} — ${factor.description}`}
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="block truncate text-[12px] font-medium text-[var(--text-primary)]">
                        {factor.factor}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <svg className="h-2 w-2 flex-none">
                        <circle cx="4" cy="4" r="4" fill={style.dot} />
                      </svg>
                      <svg className="h-1.5 flex-none" style={{ width: style.width }}>
                        <rect
                          height="6"
                          rx="3"
                          fill={"gradient" in style ? style.gradient : (style as { fill: string }).fill}
                        >
                          <animate
                            attributeName="width"
                            from="0"
                            to={String(style.width)}
                            dur="0.8s"
                            fill="freeze"
                            calcMode="spline"
                            keySplines="0.16 1 0.3 1"
                            keyTimes="0;1"
                            begin={`${i * 0.1}s`}
                          />
                        </rect>
                      </svg>
                    </div>
                  </div>
                );
              })
            ) : (
              <span className="py-2 text-center text-[12px] text-[var(--text-muted)]">
                No active risks detected
              </span>
            )}
          </div>
        </div>

        {/* Possible Diagnosis — DiagnosticNudgeAccordion with PDF citations */}
        <div className="glass-card flex flex-1 flex-col overflow-hidden rounded-[24px]">
          <div className="flex shrink-0 items-center gap-2 px-[18px] py-3.5">
            <span className="text-[14px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
              Possible Diagnosis
            </span>
            <GlassTooltip text="PubMedBERT vector similarity matches — expand to view cited paper">
              <Info className="h-3.5 w-3.5 cursor-help text-[var(--text-nav)]" />
            </GlassTooltip>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-4">
            {condition_matches.length > 0 ? (
              <DiagnosticNudgeAccordion matches={condition_matches} />
            ) : (
              <span className="text-[12px] text-[var(--text-muted)]">
                No condition matches available.
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
