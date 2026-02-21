// Types copied from shared/api-contract.ts

export interface MetricDataPoint {
  date: string;
  value: number;
  unit: string;
  flag?: string;
}

export interface LongitudinalDataPoint {
  week_start: string;
  value: number;
  unit: string;
  trend?: string;
}

export interface AcuteMetrics {
  heartRateVariabilitySDNN: MetricDataPoint[];
  restingHeartRate: MetricDataPoint[];
  appleSleepingWristTemperature: MetricDataPoint[];
  respiratoryRate: MetricDataPoint[];
  walkingAsymmetryPercentage: MetricDataPoint[];
  stepCount: MetricDataPoint[];
  sleepAnalysis_awakeSegments: MetricDataPoint[];
}

export interface LongitudinalMetrics {
  restingHeartRate: LongitudinalDataPoint[];
  walkingAsymmetryPercentage: LongitudinalDataPoint[];
}

export interface PatientPayload {
  patient_id: string;
  sync_timestamp: string;
  hardware_source: string;
  patient_narrative: string;
  data: {
    acute_7_day: {
      granularity: string;
      metrics: AcuteMetrics;
    };
    longitudinal_6_month: {
      granularity: string;
      metrics: LongitudinalMetrics;
    };
  };
}

export interface ClinicalBrief {
  summary: string;
  key_symptoms: string[];
  severity_assessment: string;
  recommended_actions: string[];
}

export interface BiometricDelta {
  metric: string;
  acute_avg: number;
  longitudinal_avg: number;
  delta: number;
  unit: string;
  clinically_significant: boolean;
}

export interface ConditionMatch {
  condition: string;
  similarity_score: number;
  pmcid: string;
  title: string;
  snippet: string;
}

export interface AnalysisResponse {
  patient_id: string;
  clinical_brief: ClinicalBrief;
  biometric_deltas: BiometricDelta[];
  condition_matches: ConditionMatch[];
}

export const MOCK_CONDITION_MATCHES: ConditionMatch[] = [
  {
    condition: "Endometriosis",
    similarity_score: 0.9412,
    pmcid: "PMC6263431",
    title: "Endometriosis: Pathogenesis, diagnosis, and treatment",
    snippet:
      "Chronic pelvic pain with acute exacerbation, elevated inflammatory markers, and mobility impairment consistent with deep infiltrating endometriosis.",
  },
  {
    condition: "Uterine Fibroids",
    similarity_score: 0.8734,
    pmcid: "PMC5914402",
    title: "Uterine Fibroids: Current perspectives",
    snippet:
      "Heavy menstrual bleeding, pelvic pressure, and pain patterns with autonomic nervous system disruption evidenced by HRV changes.",
  },
  {
    condition: "Adenomyosis",
    similarity_score: 0.8201,
    pmcid: "PMC7661568",
    title: "Adenomyosis: A systematic review of clinical features",
    snippet:
      "Diffuse uterine enlargement with severe dysmenorrhea and pelvic pain radiating to lower back.",
  },
];
