import type { PatientPayload, AnalysisResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzePatient(payload: PatientPayload): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/v1/analyze-patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function getPaperUrl(pmcid: string): string {
  return `${API_BASE}/api/v1/paper/${pmcid}`;
}
