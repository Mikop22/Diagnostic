import {
  PatientPayload,
  AnalysisResponse,
  BiometricDelta,
  ClinicalBrief,
} from "./types";
import { MOCK_CONDITION_MATCHES } from "./types";

// ---------- Patient Payload (from testpayload.json + narrative) ----------

export const MOCK_PAYLOAD: PatientPayload = {
  patient_id: "pt_883920_x",
  sync_timestamp: "2026-02-21T12:35:39Z",
  hardware_source: "Apple Watch Series 9",
  patient_narrative:
    "I've been experiencing severe pelvic pain for the past 4 days that started suddenly on February 18th. The pain is sharp, constant, and radiates to my lower back. I can barely walk - my steps have dropped dramatically. I'm waking up 5-6 times a night from the pain. My Apple Watch is showing my heart rate is way higher than normal and my HRV crashed. I've had similar episodes before but doctors keep telling me it's just period cramps. I have a family history of endometriosis and uterine fibroids. The pain is NOT normal period pain - it's debilitating and affects my ability to work and care for my children.",
  data: {
    acute_7_day: {
      granularity: "daily_summary",
      metrics: {
        heartRateVariabilitySDNN: [
          { date: "2026-02-15", value: 48.2, unit: "ms" },
          { date: "2026-02-16", value: 47.1, unit: "ms" },
          { date: "2026-02-17", value: 45.9, unit: "ms" },
          { date: "2026-02-18", value: 22.4, unit: "ms", flag: "severe_drop" },
          { date: "2026-02-19", value: 24.1, unit: "ms" },
          { date: "2026-02-20", value: 28.5, unit: "ms" },
          { date: "2026-02-21", value: 31.0, unit: "ms" },
        ],
        restingHeartRate: [
          { date: "2026-02-15", value: 62, unit: "bpm" },
          { date: "2026-02-16", value: 63, unit: "bpm" },
          { date: "2026-02-17", value: 62, unit: "bpm" },
          { date: "2026-02-18", value: 78, unit: "bpm", flag: "elevated" },
          { date: "2026-02-19", value: 76, unit: "bpm" },
          { date: "2026-02-20", value: 74, unit: "bpm" },
          { date: "2026-02-21", value: 72, unit: "bpm" },
        ],
        appleSleepingWristTemperature: [
          { date: "2026-02-15", value: -0.12, unit: "degC_deviation" },
          { date: "2026-02-16", value: -0.1, unit: "degC_deviation" },
          { date: "2026-02-17", value: 0.05, unit: "degC_deviation" },
          {
            date: "2026-02-18",
            value: 0.85,
            unit: "degC_deviation",
            flag: "sustained_high",
          },
          { date: "2026-02-19", value: 0.92, unit: "degC_deviation" },
          { date: "2026-02-20", value: 0.8, unit: "degC_deviation" },
          { date: "2026-02-21", value: 0.75, unit: "degC_deviation" },
        ],
        respiratoryRate: [
          { date: "2026-02-15", value: 14.5, unit: "breaths/min" },
          { date: "2026-02-16", value: 14.6, unit: "breaths/min" },
          { date: "2026-02-17", value: 14.5, unit: "breaths/min" },
          {
            date: "2026-02-18",
            value: 18.2,
            unit: "breaths/min",
            flag: "elevated",
          },
          { date: "2026-02-19", value: 17.8, unit: "breaths/min" },
          { date: "2026-02-20", value: 16.5, unit: "breaths/min" },
          { date: "2026-02-21", value: 16.0, unit: "breaths/min" },
        ],
        walkingAsymmetryPercentage: [
          { date: "2026-02-15", value: 1.2, unit: "%" },
          { date: "2026-02-16", value: 1.5, unit: "%" },
          { date: "2026-02-17", value: 1.3, unit: "%" },
          {
            date: "2026-02-18",
            value: 8.5,
            unit: "%",
            flag: "guarding_detected",
          },
          { date: "2026-02-19", value: 8.2, unit: "%" },
          { date: "2026-02-20", value: 6.0, unit: "%" },
          { date: "2026-02-21", value: 5.5, unit: "%" },
        ],
        stepCount: [
          { date: "2026-02-15", value: 8500, unit: "count" },
          { date: "2026-02-16", value: 8200, unit: "count" },
          { date: "2026-02-17", value: 8600, unit: "count" },
          {
            date: "2026-02-18",
            value: 1200,
            unit: "count",
            flag: "mobility_drop",
          },
          { date: "2026-02-19", value: 1500, unit: "count" },
          { date: "2026-02-20", value: 2500, unit: "count" },
          { date: "2026-02-21", value: 3000, unit: "count" },
        ],
        sleepAnalysis_awakeSegments: [
          { date: "2026-02-15", value: 1, unit: "count" },
          { date: "2026-02-16", value: 1, unit: "count" },
          { date: "2026-02-17", value: 2, unit: "count" },
          { date: "2026-02-18", value: 6, unit: "count", flag: "painsomnia" },
          { date: "2026-02-19", value: 5, unit: "count" },
          { date: "2026-02-20", value: 4, unit: "count" },
          { date: "2026-02-21", value: 3, unit: "count" },
        ],
      },
    },
    longitudinal_6_month: {
      granularity: "weekly_average",
      metrics: {
        restingHeartRate: [
          { week_start: "2025-08-24", value: 61.2, unit: "bpm" },
          { week_start: "2025-08-31", value: 61.5, unit: "bpm" },
          { week_start: "2025-09-07", value: 61.4, unit: "bpm" },
          { week_start: "2025-09-14", value: 61.8, unit: "bpm" },
          { week_start: "2025-09-21", value: 62.1, unit: "bpm" },
          { week_start: "2025-09-28", value: 62.0, unit: "bpm" },
          { week_start: "2025-10-05", value: 62.5, unit: "bpm" },
          { week_start: "2025-10-12", value: 62.8, unit: "bpm" },
          { week_start: "2025-10-19", value: 63.1, unit: "bpm" },
          { week_start: "2025-10-26", value: 63.5, unit: "bpm" },
          { week_start: "2025-11-02", value: 63.8, unit: "bpm" },
          { week_start: "2025-11-09", value: 64.1, unit: "bpm" },
          { week_start: "2025-11-16", value: 64.5, unit: "bpm" },
          { week_start: "2025-11-23", value: 64.7, unit: "bpm" },
          { week_start: "2025-11-30", value: 65.1, unit: "bpm" },
          { week_start: "2025-12-07", value: 65.5, unit: "bpm" },
          { week_start: "2025-12-14", value: 65.8, unit: "bpm" },
          { week_start: "2025-12-21", value: 66.2, unit: "bpm" },
          { week_start: "2025-12-28", value: 66.5, unit: "bpm" },
          { week_start: "2026-01-04", value: 66.8, unit: "bpm" },
          { week_start: "2026-01-11", value: 67.1, unit: "bpm" },
          { week_start: "2026-01-18", value: 67.4, unit: "bpm" },
          { week_start: "2026-01-25", value: 67.7, unit: "bpm" },
          { week_start: "2026-02-01", value: 68.1, unit: "bpm" },
          { week_start: "2026-02-08", value: 68.4, unit: "bpm" },
          {
            week_start: "2026-02-15",
            value: 68.8,
            unit: "bpm",
            trend: "creeping_elevation",
          },
        ],
        walkingAsymmetryPercentage: [
          { week_start: "2025-08-24", value: 1.1, unit: "%" },
          { week_start: "2025-08-31", value: 1.1, unit: "%" },
          { week_start: "2025-09-07", value: 1.2, unit: "%" },
          { week_start: "2025-09-14", value: 1.2, unit: "%" },
          { week_start: "2025-09-21", value: 1.3, unit: "%" },
          { week_start: "2025-09-28", value: 1.3, unit: "%" },
          { week_start: "2025-10-05", value: 1.4, unit: "%" },
          { week_start: "2025-10-12", value: 1.5, unit: "%" },
          { week_start: "2025-10-19", value: 1.6, unit: "%" },
          { week_start: "2025-10-26", value: 1.8, unit: "%" },
          { week_start: "2025-11-02", value: 2.0, unit: "%" },
          { week_start: "2025-11-09", value: 2.1, unit: "%" },
          { week_start: "2025-11-16", value: 2.3, unit: "%" },
          { week_start: "2025-11-23", value: 2.4, unit: "%" },
          { week_start: "2025-11-30", value: 2.5, unit: "%" },
          { week_start: "2025-12-07", value: 2.6, unit: "%" },
          { week_start: "2025-12-14", value: 2.8, unit: "%" },
          { week_start: "2025-12-21", value: 2.9, unit: "%" },
          { week_start: "2025-12-28", value: 3.1, unit: "%" },
          { week_start: "2026-01-04", value: 3.3, unit: "%" },
          { week_start: "2026-01-11", value: 3.4, unit: "%" },
          { week_start: "2026-01-18", value: 3.6, unit: "%" },
          { week_start: "2026-01-25", value: 3.8, unit: "%" },
          { week_start: "2026-02-01", value: 4.0, unit: "%" },
          { week_start: "2026-02-08", value: 4.1, unit: "%" },
          {
            week_start: "2026-02-15",
            value: 4.3,
            unit: "%",
            trend: "gradual_impairment",
          },
        ],
      },
    },
  },
};

// ---------- Pre-computed Biometric Deltas ----------

export const MOCK_DELTAS: BiometricDelta[] = [
  {
    metric: "restingHeartRate",
    acute_avg: 69.57,
    longitudinal_avg: 64.94,
    delta: 4.63,
    unit: "bpm",
    clinically_significant: false,
  },
  {
    metric: "walkingAsymmetryPercentage",
    acute_avg: 4.6,
    longitudinal_avg: 2.35,
    delta: 2.25,
    unit: "%",
    clinically_significant: false,
  },
  {
    metric: "heartRateVariabilitySDNN",
    acute_avg: 26.5,
    longitudinal_avg: 47.07,
    delta: -20.57,
    unit: "ms",
    clinically_significant: true,
  },
  {
    metric: "respiratoryRate",
    acute_avg: 17.13,
    longitudinal_avg: 14.53,
    delta: 2.59,
    unit: "breaths/min",
    clinically_significant: true,
  },
  {
    metric: "stepCount",
    acute_avg: 2050,
    longitudinal_avg: 8433.33,
    delta: -6383.33,
    unit: "count",
    clinically_significant: true,
  },
  {
    metric: "sleepAnalysis_awakeSegments",
    acute_avg: 4.5,
    longitudinal_avg: 1.33,
    delta: 3.17,
    unit: "count",
    clinically_significant: true,
  },
  {
    metric: "appleSleepingWristTemperature",
    acute_avg: 0.83,
    longitudinal_avg: -0.06,
    delta: 0.89,
    unit: "degC_deviation",
    clinically_significant: true,
  },
];

// ---------- Mock Clinical Brief ----------

export const MOCK_CLINICAL_BRIEF: ClinicalBrief = {
  summary:
    "Multi-system decompensation consistent with severe acute pain episode. Autonomic dysregulation (HRV collapse -44%, resting HR +7%), profound mobility impairment (steps -76%), disrupted sleep architecture (awakenings +238%), and sustained thermoregulatory shift (+0.89\u00b0C). Pattern onset February 18th aligns with patient-reported acute pelvic pain exacerbation. Biometric signature is consistent with deep inflammatory/nociceptive process rather than functional pain.",
  key_symptoms: [
    "Severe pelvic pain with acute onset (Feb 18)",
    "HRV collapse: 47 ms \u2192 22 ms (autonomic crisis)",
    "Mobility drop: 8,400 \u2192 1,200 steps/day (-76%)",
    "Sleep fragmentation: 1 \u2192 6 awakenings/night",
    "Sustained wrist temperature elevation (+0.89\u00b0C)",
    "Walking asymmetry spike: 1.3% \u2192 8.5% (guarding pattern)",
    "Respiratory rate elevation: 14.5 \u2192 18.2 breaths/min",
  ],
  severity_assessment: "HIGH",
  recommended_actions: [
    "Urgent gynecology referral for pelvic imaging (transvaginal ultrasound + MRI)",
    "Inflammatory marker panel (CRP, ESR, CA-125)",
    "Pain management assessment - current pattern suggests undertreated pain",
    "Consider diagnostic laparoscopy given family history and symptom severity",
    "Sleep study if fragmentation persists after pain management",
  ],
};

// ---------- Assembled Mock Response ----------

export const MOCK_RESPONSE: AnalysisResponse = {
  patient_id: MOCK_PAYLOAD.patient_id,
  clinical_brief: MOCK_CLINICAL_BRIEF,
  biometric_deltas: MOCK_DELTAS,
  condition_matches: MOCK_CONDITION_MATCHES,
};
