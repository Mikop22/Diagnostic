import type { PatientPayload, AnalysisResponse, PatientRecord, AppointmentRecord } from "./types";
import MOCK_PAYLOAD_JSON from "./testpayload.json";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzePatient(patientId: string): Promise<AnalysisResponse> {
  const payloadToAnalyze: PatientPayload = {
    ...(MOCK_PAYLOAD_JSON as PatientPayload),
    patient_id: patientId,
  };

  const res = await fetch(`${API_BASE}/api/v1/analyze-patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payloadToAnalyze),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function getPaperUrl(pmcid: string): string {
  return `${API_BASE}/api/v1/paper/${pmcid}`;
}

// --- Patient Management ---

export async function fetchPatients(): Promise<PatientRecord[]> {
  const res = await fetch(`${API_BASE}/api/v1/patients`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function createPatient(name: string, email: string): Promise<PatientRecord> {
  const res = await fetch(`${API_BASE}/api/v1/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create patient: ${body}`);
  }
  return res.json();
}

export async function createAppointment(
  patientId: string,
  date: string,
  time: string
): Promise<AppointmentRecord> {
  const res = await fetch(`${API_BASE}/api/v1/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_id: patientId, date, time }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create appointment: ${body}`);
  }
  return res.json();
}

