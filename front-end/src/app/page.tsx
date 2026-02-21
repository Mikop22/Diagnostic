"use client";

import { useState } from "react";
import { MOCK_RESPONSE, MOCK_PAYLOAD } from "@/lib/mock-data";
import { analyzePatient } from "@/lib/api";
import { DeltaBadge } from "./_components/DeltaBadge";
import { BiometricGhostChart } from "./_components/BiometricGhostChart";
import { DiagnosticNudgeAccordion } from "./_components/DiagnosticNudgeAccordion";
import type { AnalysisResponse } from "@/lib/types";

export default function DashboardPage() {
  const [useLive, setUseLive] = useState(false);
  const [liveResponse, setLiveResponse] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const response = useLive && liveResponse ? liveResponse : MOCK_RESPONSE;
  const payload = MOCK_PAYLOAD;

  async function handleToggle() {
    if (!useLive) {
      setLoading(true);
      setError(null);
      try {
        const res = await analyzePatient(MOCK_PAYLOAD);
        setLiveResponse(res);
        setUseLive(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch from API");
      } finally {
        setLoading(false);
      }
    } else {
      setUseLive(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic</h1>
            <p className="text-sm text-slate-500">
              Patient {response.patient_id} &middot; {payload.hardware_source} &middot; Synced {new Date(payload.sync_timestamp).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                useLive
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? "Connecting..." : useLive ? "Live API" : "Mock Data"}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
            <span className="inline-block px-3 py-1 bg-red-50 text-red-700 text-sm font-semibold rounded-full">
              {response.clinical_brief.severity_assessment.split("—")[0].trim()}
            </span>
          </div>
        </div>
      </header>

      <main className="px-8 py-6 max-w-7xl mx-auto">
        {/* Row 1: Clinical Brief */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Clinical Brief</h2>
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <p className="text-slate-800 leading-relaxed mb-4">{response.clinical_brief.summary}</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Key Symptoms</h3>
                <ul className="space-y-1">
                  {response.clinical_brief.key_symptoms.map((s, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">&#9679;</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Recommended Actions</h3>
                <ul className="space-y-1">
                  {response.clinical_brief.recommended_actions.map((a, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">&#10003;</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2: Delta Badges */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Biometric Deltas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {response.biometric_deltas.map((d) => (
              <DeltaBadge key={d.metric} delta={d} />
            ))}
          </div>
        </section>

        {/* Row 3: Ghost Charts */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">7-Day Acute Biometrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BiometricGhostChart title="Resting Heart Rate" data={payload.data.acute_7_day.metrics.restingHeartRate} baselineAvg={64.94} unit="bpm" color="#ef4444" />
            <BiometricGhostChart title="HRV (SDNN)" data={payload.data.acute_7_day.metrics.heartRateVariabilitySDNN} baselineAvg={47.07} unit="ms" color="#3b82f6" />
            <BiometricGhostChart title="Step Count" data={payload.data.acute_7_day.metrics.stepCount} baselineAvg={8433} unit="steps" color="#8b5cf6" />
            <BiometricGhostChart title="Wrist Temperature Deviation" data={payload.data.acute_7_day.metrics.appleSleepingWristTemperature} baselineAvg={-0.06} unit="degC" color="#f59e0b" />
          </div>
        </section>

        {/* Row 4: Diagnostic Nudges */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Condition Matches (Vector Search)</h2>
          <DiagnosticNudgeAccordion matches={response.condition_matches} />
        </section>
      </main>
    </div>
  );
}
