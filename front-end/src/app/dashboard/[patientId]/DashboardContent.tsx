"use client";

import {
  CircleHelp,
  Info,
} from "lucide-react";
import { ClientCharts } from "./ClientCharts";
import { DiagnosticNudgeAccordion } from "@/app/_components/DiagnosticNudgeAccordion";
import type { AnalysisResponse } from "@/lib/types";

interface DashboardContentProps {
  data: AnalysisResponse;
  patientId: string;
}

export function DashboardContent({ data, patientId }: DashboardContentProps) {
  const { clinical_brief, biometric_deltas, condition_matches } = data;

  const guidingQuestions = clinical_brief.guiding_questions || [];
  const symptoms = clinical_brief.key_symptoms.slice(0, 5);

  const criticalDeltas = biometric_deltas
    .filter(d => d.clinically_significant)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
    .map(d => ({
      label: d.metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_*[a-zA-Z]*_/, ""),
      value: d.acute_avg.toString(),
      unit: d.unit,
      arrow: (d.delta > 0 ? "↑ " : "↓ ") + Math.abs(d.delta).toString(),
      baseline: `vs ${d.longitudinal_avg}`
    }));

  const riskFactors = data.risk_profile?.factors || [];

  const getSeverityStyle = (severity: string, weight: number) => {
    const w = Math.min(220, Math.max(40, weight * 2.2));
    switch (severity.toLowerCase()) {
      case "high": return { dot: "var(--red-alert)", gradient: "url(#riskGradHigh)", width: w };
      case "elevated": return { dot: "var(--purple-accent)", gradient: "url(#riskGradElevated)", width: w };
      case "moderate": return { dot: "var(--purple-primary)", gradient: "url(#riskGradMod)", width: w };
      default: return { dot: "var(--lavender-border)", fill: "var(--lavender-border)", width: w };
    }
  };

  return (
    <>
      {/* ═══ TOP ROW ═══ */}
      <div className="flex min-h-0 flex-[14] gap-8">
        {/* Guiding Questions */}
        <div className="glass-card flex w-[32%] shrink-0 flex-col overflow-hidden rounded-[24px]">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-5 w-5 text-[var(--purple-primary)]" />
              <span className="text-[16px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Guiding Questions</span>
            </div>
            <Info className="h-[18px] w-[18px] text-[var(--text-nav)]" />
          </div>
          <div className="flex flex-col gap-2.5 px-5 pb-4 pt-1">
            {guidingQuestions.map((q) => (
              <div key={q} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-primary)]" />
                <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-body)]">{q}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="glass-card flex w-[30%] shrink-0 flex-col overflow-hidden rounded-[24px]">
          <div className="flex items-center px-6 py-5">
            <span className="text-[16px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Symptoms</span>
          </div>
          <div className="flex flex-col gap-2.5 px-5 pb-4 pt-1">
            {symptoms.map((s) => (
              <div key={s} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-accent)]" />
                <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-body)]">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Deltas Grid */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Key Deltas</span>
            <span className="text-[11px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">avg 7d vs 26-wk avg</span>
          </div>

          {/* Top 2 deltas */}
          <div className="flex flex-1 gap-3">
            {criticalDeltas.slice(0, 2).map((d) => (
              <div key={d.label} className="glass-card flex flex-1 flex-col justify-center gap-1 rounded-[20px] px-[18px] py-4">
                <span className="text-[12px] font-medium tracking-[-0.1px] text-[var(--text-nav)] truncate">{d.label}</span>
                <span className="text-[28px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">{d.value}</span>
                <span className="text-[11px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">{d.unit}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-[var(--red-alert)]">{d.arrow}</span>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] truncate">{d.baseline}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom 2: Third Delta + Reported Pain */}
          <div className="flex flex-1 gap-3">
            {criticalDeltas[2] && (
              <div className="glass-card flex flex-1 flex-col justify-center gap-1 rounded-[20px] px-[18px] py-4">
                <span className="text-[12px] font-medium tracking-[-0.1px] text-[var(--text-nav)] truncate">{criticalDeltas[2].label}</span>
                <span className="text-[28px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">{criticalDeltas[2].value}</span>
                <span className="text-[11px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">{criticalDeltas[2].unit}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-[var(--red-alert)]">{criticalDeltas[2].arrow}</span>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] truncate">{criticalDeltas[2].baseline}</span>
                </div>
              </div>
            )}

            {/* Walking Asymmetry */}
            {(() => {
              const asymmetry = biometric_deltas.find(d => d.metric === "walkingAsymmetryPercentage");
              const val = asymmetry ? asymmetry.acute_avg.toFixed(1) : "--";
              const base = asymmetry ? asymmetry.longitudinal_avg.toFixed(1) : "--";
              const severityText = asymmetry && asymmetry.acute_avg > 5 ? "Guarding Detected" : "Normal";
              const severityColor = asymmetry && asymmetry.acute_avg > 5 ? "text-[var(--red-alert)]" : "text-[var(--text-muted)]";
              const fillWidth = asymmetry ? Math.min(100, (asymmetry.acute_avg / 10) * 100) : 0;

              return (
                <div className="glass-card flex flex-1 flex-col justify-center gap-1 rounded-[20px] px-[18px] py-4">
                  <span className="text-[12px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">Walking Asymmetry</span>
                  <div className="flex items-end gap-1.5">
                    <span className="text-[28px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">{val}</span>
                    <span className="mb-1 text-[16px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">%</span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-[var(--lavender-border)]">
                    <div className="rounded-[3px] bg-gradient-to-r from-[var(--purple-primary)] to-[var(--red-alert)]" style={{ width: `${fillWidth}%` }} />
                  </div>
                  <div className="flex justify-between items-center w-full mt-1">
                    <span className={`text-[11px] font-medium ${severityColor}`}>{severityText}</span>
                    <span className="text-[10px] font-medium text-[var(--text-nav)]">base {base}%</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ═══ METRICS ROW ═══ */}
      <div className="flex min-h-0 flex-[9] gap-8">
        <ClientCharts />
      </div>

      {/* ═══ BOTTOM ROW ═══ */}
      <div className="flex min-h-0 flex-[12] gap-8">
        {/* Screening Count */}
        <div className="glass-card flex flex-1 flex-col overflow-hidden rounded-[24px]">
          <div className="flex items-center justify-between px-[18px] py-3.5">
            <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Screening Count</span>
            <Info className="h-4 w-4 text-[var(--text-nav)]" />
          </div>
          <div className="flex items-center px-[18px]">
            <div className="nav-pill-active flex items-center gap-1.5 rounded-[14px] px-3 py-[5px]">
              <span className="text-[12px] font-medium text-[var(--purple-primary)]">MRI</span>
              <svg className="h-3 w-3 text-[var(--purple-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="relative flex-1 px-[18px] py-3">
            <div className="flex justify-between px-0.5 text-[11px] font-medium text-[var(--text-nav)]">
              <span>Exp</span>
              <span className="mr-8">Avg</span>
            </div>
            <div className="mt-3 flex h-1.5 overflow-hidden rounded-[3px] bg-[var(--lavender-border)]">
              <div className="w-[65%] rounded-[3px] bg-gradient-to-r from-[var(--purple-primary)] to-[var(--purple-accent)]" />
            </div>
            <div className="mt-2.5 flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>25</span>
              <span>30</span>
              <span>40</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Risk Profile */}
        <div className="glass-card flex flex-1 flex-col overflow-hidden rounded-[24px]">
          <div className="flex items-center px-[18px] py-3.5">
            <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Risk Profile</span>
          </div>
          <div className="flex flex-col gap-3.5 px-[18px] pb-3.5 pt-1">
            <svg className="absolute h-0 w-0">
              <defs>
                <linearGradient id="riskGradHigh"><stop offset="0%" stopColor="#D92D20" /><stop offset="100%" stopColor="#F97066" /></linearGradient>
                <linearGradient id="riskGradElevated"><stop offset="0%" stopColor="#5D2EA8" /><stop offset="100%" stopColor="#B58DE0" /></linearGradient>
                <linearGradient id="riskGradMod"><stop offset="0%" stopColor="#7F56D9" /><stop offset="100%" stopColor="#B692F6" /></linearGradient>
              </defs>
            </svg>
            {riskFactors.length > 0 ? riskFactors.map((factor, i) => {
              const style = getSeverityStyle(factor.severity, factor.weight);
              return (
                <div key={i} className="flex items-center gap-3 w-full" title={`${factor.category} - ${factor.description}`}>
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[12px] font-medium text-[var(--text-primary)] block truncate">{factor.factor}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <svg className="h-2 w-2 shrink-0 flex-none" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={style.dot} /></svg>
                    <svg className="h-1.5 shrink-0 flex-none" style={{ width: style.width }}>
                      <rect width={style.width} height="6" rx="3" fill={"gradient" in style ? style.gradient : style.fill} />
                    </svg>
                    <Info className="h-3.5 w-3.5 shrink-0 text-[var(--text-nav)]" />
                  </div>
                </div>
              );
            }) : (
              <div className="text-[12px] text-[var(--text-muted)] text-center py-2">No active risks detected</div>
            )}
          </div>
        </div>

        {/* Possible Diagnosis */}
        <div className="glass-card flex flex-1 overflow-hidden rounded-[24px]">
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2 px-[18px] py-3.5">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">Possible Diagnosis</span>
              <Info className="h-3.5 w-3.5 text-[var(--text-nav)]" />
            </div>
            <svg className="absolute h-0 w-0">
              <defs>
                <linearGradient id="diagGrad"><stop offset="0%" stopColor="#5D2EA8" /><stop offset="100%" stopColor="#F294B9" /></linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col gap-2.5 px-[18px] pb-3.5 h-[140px] overflow-y-auto">
              {condition_matches.map((match, i) => {
                const scorePercent = (match.similarity_score * 100).toFixed(1);
                const isTopMatch = i === 0;
                const maxWidth = 140;
                const barWidth = Math.max(20, Math.floor(match.similarity_score * maxWidth));

                return (
                  <div key={match.pmcid} className="flex h-5 items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <svg className="h-2 w-2 shrink-0 flex-none">
                        <circle cx="4" cy="4" r="4" fill={isTopMatch ? "var(--purple-primary)" : "var(--lavender-border)"} />
                      </svg>
                      <div className="flex items-center">
                        <svg className="h-[5px] shrink-0 flex-none" style={{ width: barWidth }}>
                          <rect width={barWidth} height="5" rx="3" fill={isTopMatch ? "url(#diagGrad)" : "var(--lavender-border)"} />
                        </svg>
                        <span className="ml-2 text-[10px] text-[var(--text-body)] truncate max-w-[80px]" title={match.condition}>{match.condition}</span>
                      </div>
                    </div>
                    <span className={`text-[13px] font-medium ${isTopMatch ? 'text-[var(--purple-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {scorePercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
