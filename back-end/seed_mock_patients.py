import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "diagnostic")

print(f"Connecting to MongoDB at {MONGO_URI}, DB: {DB_NAME}")
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def get_acute_dates(end_date_str, days=7):
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    return [(end_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in reversed(range(1, days+1))]

def get_long_dates(end_date_str, weeks=26):
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    # find latest sunday
    while end_date.weekday() != 6:
        end_date -= timedelta(days=1)
    return [(end_date - timedelta(weeks=i)).strftime('%Y-%m-%d') for i in reversed(range(weeks))]

def generate_metric(dates, base, noise, unit, spikes=None, trend=0.0):
    metrics = []
    current_base = base
    for i, date in enumerate(dates):
        current_base += trend
        val = current_base + random.uniform(-noise, noise)
        flag = None
        
        if spikes and i in spikes:
            spike_val, spike_flag = spikes[i]
            if spike_val is not None:
                val = spike_val
            flag = spike_flag
            
        metric = {
            "date" if len(dates) == 7 else "week_start": date,
            "value": round(val, 2) if unit != "count" else int(val),
            "unit": unit
        }
        if flag:
            metric["flag" if len(dates) == 7 else "trend"] = flag
        metrics.append(metric)
    return metrics

def create_patient_and_appointment(pt_data):
    patient_id = f"pt_mock_{str(uuid.uuid4())[:8]}"
    form_token = str(uuid.uuid4())
    xrp_address = f"rMock{str(uuid.uuid4()).replace('-', '')[:16]}"
    
    now = datetime.now(timezone.utc).isoformat()
    
    # 1. Generate Acute Metrics
    acute_dates = get_acute_dates("2026-03-10", 7)
    long_dates = get_long_dates("2026-03-10", 26)
    
    a_conf = pt_data["acute_config"]
    acute_metrics = {
        "heartRateVariabilitySDNN": generate_metric(acute_dates, **a_conf["hrv"], unit="ms"),
        "restingHeartRate": generate_metric(acute_dates, **a_conf["rhr"], unit="bpm"),
        "appleSleepingWristTemperature": generate_metric(acute_dates, **a_conf["temp"], unit="degC_deviation"),
        "respiratoryRate": generate_metric(acute_dates, **a_conf["rr"], unit="breaths/min"),
        "walkingAsymmetryPercentage": generate_metric(acute_dates, **a_conf["walk"], unit="%"),
        "stepCount": generate_metric(acute_dates, **a_conf["steps"], unit="count"),
        "sleepAnalysis_awakeSegments": generate_metric(acute_dates, **a_conf["sleep"], unit="count"),
        "bloodOxygenSaturation": generate_metric(acute_dates, **a_conf["spo2"], unit="%"),
        "walkingStepLength": generate_metric(acute_dates, **a_conf["step_len"], unit="meters"),
        "walkingDoubleSupportPercentage": generate_metric(acute_dates, **a_conf["dsp"], unit="%"),
    }

    l_conf = pt_data["long_config"]
    long_metrics = {
        "restingHeartRate": generate_metric(long_dates, **l_conf["rhr"], unit="bpm"),
        "walkingAsymmetryPercentage": generate_metric(long_dates, **l_conf["walk"], unit="%"),
        "bloodOxygenSaturation": generate_metric(long_dates, **l_conf["spo2"], unit="%"),
        "walkingStepLength": generate_metric(long_dates, **l_conf["step_len"], unit="meters"),
        "walkingDoubleSupportPercentage": generate_metric(long_dates, **l_conf["dsp"], unit="%"),
    }

    # Generate menstrual cycle phase series (string-valued; excluded from numeric delta computation)
    menstrual_raw = pt_data.get("menstrual_phases", [])
    menstrual_series = [
        {"date": acute_dates[i], "value": phase, "unit": "phase"}
        for i, phase in enumerate(menstrual_raw)
    ] if menstrual_raw else []
    acute_metrics["menstrualCyclePhase"] = menstrual_series

    patient_payload = {
        "patient_id": patient_id,
        "sync_timestamp": now,
        "hardware_source": "Apple Watch Series 9",
        "patient_narrative": pt_data["narrative"],
        "data": {
            "acute_7_day": {
                "granularity": "daily_summary",
                "metrics": acute_metrics
            },
            "longitudinal_6_month": {
                "granularity": "weekly_average",
                "metrics": long_metrics
            }
        },
        "risk_profile": pt_data["risk_profile"]
    }
    
    analysis_result = {
        "patient_id": patient_id,
        "clinical_brief": pt_data["clinical_brief"],
        "biometric_deltas": pt_data["deltas"],
        "condition_matches": pt_data["conditions"],
        "risk_profile": pt_data["risk_profile"]
    }

    patient_record = {
        "id": patient_id,
        "name": pt_data["name"],
        "email": pt_data["name"].split(' ')[0].lower() + "@example.com",
        "xrp_wallet_address": xrp_address,
        "xrp_wallet_seed": "sMockSeed...",
        "created_at": now,
        "status": "completed",
        "concern": pt_data["narrative"][:50] + "..."
    }
    
    appointment_record = {
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "date": "2026-03-10",
        "time": pt_data["time"],
        "status": "completed",
        "form_token": form_token,
        "created_at": now,
        "patient_payload": patient_payload,
        "analysis_result": analysis_result
    }
    
    return patient_record, appointment_record

# PATIENT 1: Amara Osei - Endometriosis
amara = {
    "name": "Amara Osei",
    "time": "09:15",
    "narrative": "Complains of severe, stabbing pelvic pain that radiates down her leg, dismissed previously as 'normal cramps.'",
    "risk_profile": {"factors": [
        {"category": "Reproductive", "factor": "Family History of Endometriosis", "description": "Mother diagnosed with stage IV endometriosis at age 32, required hysterectomy.", "severity": "High", "weight": 85},
        {"category": "Hormonal", "factor": "Early Menarche", "description": "Onset of menstruation at age 10, increasing lifetime estrogen exposure.", "severity": "Elevated", "weight": 65},
        {"category": "Inflammatory", "factor": "Chronic Pelvic Inflammation", "description": "Elevated CRP levels detected in prior bloodwork, consistent with systemic inflammatory response.", "severity": "High", "weight": 78},
        {"category": "Behavioral", "factor": "Delayed Diagnosis", "description": "7-year history of dismissed pain complaints across 4 providers.", "severity": "Moderate", "weight": 55},
    ]},
    "acute_config": {
        "hrv": {"base": 45, "noise": 3, "spikes": {4: (20, "crashed"), 5: (22, "crashed"), 6: (21, "crashed")}},
        "rhr": {"base": 65, "noise": 2, "spikes": {5: (75, "elevated")}},
        "temp": {"base": 0.1, "noise": 0.1, "spikes": {4: (0.9, "sustained_high"), 5: (1.1, "sustained_high"), 6: (0.8, "sustained_high")}},
        "rr": {"base": 14, "noise": 0.5},
        "walk": {"base": 1.2, "noise": 0.2, "spikes": {4: (8.5, "guarding_detected"), 5: (9.2, "guarding_detected"), 6: (8.8, "guarding_detected")}},
        "steps": {"base": 8000, "noise": 500, "spikes": {4: (2000, "mobility_drop"), 5: (1500, "mobility_drop"), 6: (1800, "mobility_drop")}},
        "sleep": {"base": 1, "noise": 1, "spikes": {4: (5, "painsomnia"), 5: (6, "painsomnia"), 6: (5, "painsomnia")}},
        "spo2": {"base": 97.8, "noise": 0.3, "spikes": {4: (95.2, "dip_detected"), 5: (95.5, "dip_detected")}},
        "step_len": {"base": 0.72, "noise": 0.02, "spikes": {4: (0.58, "shortened_stride"), 5: (0.57, "shortened_stride"), 6: (0.61, "shortened_stride")}},
        "dsp": {"base": 22.0, "noise": 0.5, "spikes": {4: (31.5, "guarding_gait"), 5: (32.0, "guarding_gait"), 6: (29.8, "guarding_gait")}},
    },
    "long_config": {
        "rhr": {"base": 64, "noise": 1.5, "trend": 0},
        "walk": {"base": 1.2, "noise": 0.1, "trend": 0},
        "spo2": {"base": 97.8, "noise": 0.2},
        "step_len": {"base": 0.72, "noise": 0.01},
        "dsp": {"base": 22.0, "noise": 0.4},
    },
    "menstrual_phases": ["Luteal", "Luteal", "Luteal", "Luteal", "Luteal", "Luteal", "Menstrual"],
    "clinical_brief": {
        "summary": "Patient presents with severe cyclic pelvic and radiating leg pain with acute biometric decomposition over the past 3 days. Walking asymmetry spiked 383% above baseline, wrist temperature sustained +0.8\u00b0C deviation, and sleep fragmentation increased 5x — collectively indicating an acute inflammatory or endometriotic flare.",
        "key_symptoms": ["Severe stabbing pelvic pain radiating to left leg", "Cyclic pain pattern worsening during luteal phase", "Significant gait guarding and mobility impairment", "Sleep fragmentation due to nocturnal pain episodes", "Sustained low-grade inflammatory temperature elevation"],
        "severity_assessment": "High",
        "recommended_actions": ["Urgent transvaginal ultrasound with Doppler", "Consult gynecology specialist for laparoscopic evaluation", "Serum CA-125 and inflammatory marker panel (CRP, ESR)", "Pain management reassessment — current regimen inadequate"],
        "cited_sources": ["PMC8765432: Atypical Presentations of Endometriosis", "PMC6234891: Digital Biomarkers for Pelvic Pain Conditions", "PMC4412078: Walking Asymmetry as Guarding Indicator"],
        "guiding_questions": ["Has the pain worsened specifically during the luteal or menstrual phase?", "Is there any history of painful intercourse (dyspareunia)?", "How many days per month does the pain prevent normal daily activities?", "Have you experienced any gastrointestinal symptoms alongside the pain (bloating, painful bowel movements)?", "Were previous providers' assessments documented, and were imaging studies ever performed?"]
    },
    "deltas": [
        {"metric": "walkingAsymmetryPercentage", "acute_avg": 5.8, "longitudinal_avg": 1.2, "delta": 4.6, "unit": "%", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-07", "changepoint_direction": "up"},
        {"metric": "appleSleepingWristTemperature", "acute_avg": 0.6, "longitudinal_avg": 0.1, "delta": 0.5, "unit": "degC_deviation", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-07", "changepoint_direction": "up"},
        {"metric": "heartRateVariabilitySDNN", "acute_avg": 21.0, "longitudinal_avg": 45.0, "delta": -24.0, "unit": "ms", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-07", "changepoint_direction": "down"},
        {"metric": "sleepAnalysis_awakeSegments", "acute_avg": 5.3, "longitudinal_avg": 1.2, "delta": 4.1, "unit": "count", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None},
        {"metric": "stepCount", "acute_avg": 1767, "longitudinal_avg": 8000, "delta": -6233, "unit": "count", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-07", "changepoint_direction": "down"}
    ],
    "conditions": [
        {"condition": "Deep-Infiltrating Endometriosis", "similarity_score": 0.89, "pmcid": "PMC8765432", "title": "Atypical Presentations of Endometriosis", "snippet": "Radiating leg pain and pelvic guarding correspond heavily to deep-infiltrating endometriosis implants affecting the sciatic nerve."},
        {"condition": "Adenomyosis", "similarity_score": 0.76, "pmcid": "PMC6234891", "title": "Adenomyosis vs Endometriosis: Differential Biometric Signatures", "snippet": "Sustained temperature elevation with cyclic pain intensification distinguishes adenomyosis from superficial endometriosis."},
        {"condition": "Pelvic Inflammatory Disease", "similarity_score": 0.62, "pmcid": "PMC4412078", "title": "Acute Pelvic Inflammatory Presentations", "snippet": "Acute-onset walking asymmetry combined with temperature deviation may indicate pelvic inflammatory etiology."}
    ]
}

# PATIENT 2: Maria Santos - Uterine Fibroids (Anemia)
maria = {
    "name": "Maria Santos",
    "time": "11:45",
    "narrative": "Extreme fatigue, heavy bleeding, shortness of breath when walking up stairs.",
    "risk_profile": {"factors": [
        {"category": "Hematological", "factor": "Chronic Menorrhagia", "description": "Self-reported soaking through pads every 45 minutes during peak flow days for 18+ months.", "severity": "High", "weight": 82},
        {"category": "Cardiovascular", "factor": "Compensatory Tachycardia", "description": "RHR creeping from 65 to 85 bpm over 6 months — body compensating for reduced oxygen-carrying capacity.", "severity": "High", "weight": 78},
        {"category": "Nutritional", "factor": "Iron Deficiency Risk", "description": "Diet history indicates low iron intake; no supplementation despite heavy menstrual losses.", "severity": "Elevated", "weight": 60},
        {"category": "Functional", "factor": "Progressive Exercise Intolerance", "description": "Step count declining 500+ steps/week over 6 months, indicating worsening cardiovascular reserve.", "severity": "Moderate", "weight": 55},
    ]},
    "acute_config": {
        "hrv": {"base": 30, "noise": 2},
        "rhr": {"base": 85, "noise": 3},
        "temp": {"base": 0.0, "noise": 0.1},
        "rr": {"base": 16, "noise": 0.5, "spikes": {5: (20, "elevated"), 6: (19, "elevated")}},
        "walk": {"base": 1.5, "noise": 0.2},
        "steps": {"base": 6000, "noise": 300, "trend": -500},
        "sleep": {"base": 2, "noise": 1},
        "spo2": {"base": 93.5, "noise": 0.8, "spikes": {5: (91.2, "hypoxia_risk"), 6: (91.8, "hypoxia_risk")}},
        "step_len": {"base": 0.68, "noise": 0.02},
        "dsp": {"base": 24.5, "noise": 0.5},
    },
    "long_config": {
        "rhr": {"base": 65, "noise": 1.0, "trend": 0.8, "spikes": {25: (None, "creeping_elevation")}},
        "walk": {"base": 1.5, "noise": 0.1, "trend": 0},
        "spo2": {"base": 95.5, "noise": 0.5, "trend": -0.1},
        "step_len": {"base": 0.70, "noise": 0.02},
        "dsp": {"base": 23.5, "noise": 0.4},
    },
    "menstrual_phases": ["Menstrual", "Menstrual", "Menstrual", "Follicular", "Follicular", "Follicular", "Follicular"],
    "clinical_brief": {
        "summary": "Symptomatic anemia strongly correlated with suspected uterine fibroids. Longitudinal data reveals a 6-month creeping RHR elevation from 65 to 85 bpm — the body progressively compensating for reduced hemoglobin. Acute step count has dropped 44% from baseline, confirming functional cardiovascular decompensation.",
        "key_symptoms": ["Extreme fatigue unrelieved by rest", "Shortness of breath climbing a single flight of stairs", "Menorrhagia — soaking through protection every 45 minutes", "Orthostatic lightheadedness upon standing", "Progressive exercise intolerance over 6 months"],
        "severity_assessment": "High",
        "recommended_actions": ["Stat CBC with iron studies, ferritin, and reticulocyte count", "Pelvic ultrasound to evaluate fibroid burden and uterine size", "Cardiology consult if hemoglobin < 8 g/dL", "Initiate IV iron infusion if oral iron not tolerated"],
        "cited_sources": ["PMC5555555: Impact of Fibroids on Cardiovascular Metrics", "PMC3378201: Iron Deficiency Anemia in Premenopausal Women", "PMC7721903: Digital Biomarkers of Anemia Progression"],
        "guiding_questions": ["How many pads or tampons do you use on your heaviest day, and how often do you change them?", "Have you noticed your heart racing when walking short distances or climbing stairs?", "Have you experienced any pica cravings (ice, clay, starch) — a hallmark sign of severe iron deficiency?", "When was your last complete blood count, and were you told your hemoglobin was low?", "Have you ever been prescribed iron supplements, and if so, did you experience side effects?"]
    },
    "deltas": [
        {"metric": "restingHeartRate", "acute_avg": 85, "longitudinal_avg": 73, "delta": 12, "unit": "bpm", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-05", "changepoint_direction": "up"},
        {"metric": "stepCount", "acute_avg": 4500, "longitudinal_avg": 8000, "delta": -3500, "unit": "count", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-06", "changepoint_direction": "down"},
        {"metric": "respiratoryRate", "acute_avg": 19.5, "longitudinal_avg": 15.2, "delta": 4.3, "unit": "breaths/min", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None},
        {"metric": "heartRateVariabilitySDNN", "acute_avg": 28, "longitudinal_avg": 42, "delta": -14, "unit": "ms", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None}
    ],
    "conditions": [
        {"condition": "Uterine Fibroids with Secondary Anemia", "similarity_score": 0.85, "pmcid": "PMC5555555", "title": "Impact of Fibroids on Cardiovascular Metrics", "snippet": "Chronic blood loss from fibroids frequently presents with a gradual rise in resting heart rate as the body compensates for reduced oxygen-carrying capacity."},
        {"condition": "Iron Deficiency Anemia (Non-Fibroid)", "similarity_score": 0.72, "pmcid": "PMC3378201", "title": "Anemia in Premenopausal Women: Differential Diagnosis", "snippet": "Menorrhagia-induced iron deficiency presents with progressive tachycardia and exercise intolerance before symptomatic pallor."},
        {"condition": "Endometrial Hyperplasia", "similarity_score": 0.58, "pmcid": "PMC7721903", "title": "Heavy Uterine Bleeding: Beyond Fibroids", "snippet": "Endometrial hyperplasia should be considered when menorrhagia occurs alongside metabolic compensation patterns."}
    ]
}

# PATIENT 3: Jordan Lee - POTS
jordan = {
    "name": "Jordan Lee",
    "time": "08:30",
    "narrative": "Dizziness when standing up, brain fog, racing heart after mild exertion.",
    "risk_profile": {"factors": [
        {"category": "Immunological", "factor": "Post-Viral Autoimmune Trigger", "description": "Severe viral illness 3 months ago with incomplete recovery — common POTS precipitant.", "severity": "High", "weight": 80},
        {"category": "Autonomic", "factor": "Erratic Heart Rate Variability", "description": "HRV swinging between 10-50ms within single days, indicating autonomic nervous system instability.", "severity": "High", "weight": 75},
        {"category": "Cardiovascular", "factor": "Orthostatic Tachycardia", "description": "RHR spikes to 110 bpm recorded without exertion, consistent with postural hemodynamic failure.", "severity": "Elevated", "weight": 70},
        {"category": "Neurological", "factor": "Cognitive Dysfunction", "description": "Self-reported 'brain fog' impairing work performance and daily decision-making.", "severity": "Moderate", "weight": 50},
    ]},
    "acute_config": {
        "hrv": {"base": 20, "noise": 15, "spikes": {1: (15, "crashed"), 4: (10, "crashed"), 6: (12, "crashed")}},
        "rhr": {"base": 75, "noise": 20, "spikes": {2: (110, "extreme_erratic"), 5: (105, "extreme_erratic")}},
        "temp": {"base": 0.0, "noise": 0.1},
        "rr": {"base": 14, "noise": 0.5},
        "walk": {"base": 1.0, "noise": 0.2},
        "steps": {"base": 5000, "noise": 1000},
        "sleep": {"base": 2, "noise": 1},
        "spo2": {"base": 97.5, "noise": 1.0},
        "step_len": {"base": 0.68, "noise": 0.04},
        "dsp": {"base": 23.5, "noise": 1.0},
    },
    "long_config": {
        "rhr": {"base": 70, "noise": 5, "trend": 0},
        "walk": {"base": 1.0, "noise": 0.1, "trend": 0},
        "spo2": {"base": 97.5, "noise": 0.5},
        "step_len": {"base": 0.70, "noise": 0.03},
        "dsp": {"base": 23.0, "noise": 0.5},
    },
    "menstrual_phases": ["Follicular", "Follicular", "Follicular", "Follicular", "Ovulatory", "Follicular", "Follicular"],
    "clinical_brief": {
        "summary": "Presents with highly erratic heart rate variability (swinging 10-50ms within days) and RHR spikes to 110 bpm independent of exertion. HRV has collapsed 67% below 6-month baseline. Pattern is consistent with post-viral autonomic dysfunction (POTS) — the body's fight-or-flight system is misfiring at rest.",
        "key_symptoms": ["Severe orthostatic dizziness — near-syncope upon standing", "Persistent cognitive dysfunction (brain fog) affecting work", "Inappropriate tachycardia to 110 bpm without physical exertion", "Exercise intolerance — unable to complete previously routine activities", "Post-exertional malaise lasting 24-48 hours"],
        "severity_assessment": "High",
        "recommended_actions": ["10-minute active standing test or tilt table test", "24-hour Holter monitor to quantify erratic HR episodes", "Autonomic reflex screening panel", "Trial of increased salt and fluid intake (2-3L/day)"],
        "cited_sources": ["PMC7777777: Autonomic Dysfunction Post-Infection", "PMC8834521: POTS Diagnostic Criteria and Wearable Correlates", "PMC6190234: Post-COVID Dysautonomia in Young Adults"],
        "guiding_questions": ["Does the racing heart occur specifically when you stand up from sitting or lying down?", "Have you noticed any improvement in symptoms with increased salt or fluid intake?", "How long after the viral illness did these symptoms begin — days, weeks, or gradually?", "Are the symptoms worse in the morning or after meals?", "Have you experienced any fainting episodes, or do you feel like you might faint?"]
    },
    "deltas": [
        {"metric": "heartRateVariabilitySDNN", "acute_avg": 15, "longitudinal_avg": 45, "delta": -30, "unit": "ms", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-04", "changepoint_direction": "down"},
        {"metric": "restingHeartRate", "acute_avg": 88, "longitudinal_avg": 70, "delta": 18, "unit": "bpm", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-05", "changepoint_direction": "up"},
        {"metric": "respiratoryRate", "acute_avg": 17.2, "longitudinal_avg": 14.5, "delta": 2.7, "unit": "breaths/min", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None},
        {"metric": "sleepAnalysis_awakeSegments", "acute_avg": 4.0, "longitudinal_avg": 1.5, "delta": 2.5, "unit": "count", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None}
    ],
    "conditions": [
        {"condition": "Post-Viral POTS (Dysautonomia)", "similarity_score": 0.92, "pmcid": "PMC7777777", "title": "Autonomic Dysfunction Post-Infection", "snippet": "Characterized by erratic swings in heart rate and depressed HRV without fever, with onset 2-12 weeks post-viral illness."},
        {"condition": "Inappropriate Sinus Tachycardia", "similarity_score": 0.74, "pmcid": "PMC8834521", "title": "IST vs POTS: Differentiating via Wearable Data", "snippet": "IST presents with elevated resting HR independent of posture, distinguished from POTS by absence of orthostatic component."},
        {"condition": "Chronic Fatigue Syndrome (ME/CFS)", "similarity_score": 0.65, "pmcid": "PMC6190234", "title": "Post-Viral Fatigue Syndromes: Overlapping Presentations", "snippet": "Post-exertional malaise and cognitive dysfunction overlap significantly with dysautonomia presentations."}
    ]
}

# PATIENT 4: David Chen - Psoriatic Arthritis
david = {
    "name": "David Chen",
    "time": "10:30",
    "narrative": "Joint stiffness in the mornings, specifically in the knees and fingers, worsening over the last month.",
    "risk_profile": {"factors": [
        {"category": "Dermatological", "factor": "Active Plaque Psoriasis", "description": "Diagnosed with moderate plaque psoriasis 2 years ago — 30% of psoriasis patients develop PsA.", "severity": "High", "weight": 80},
        {"category": "Musculoskeletal", "factor": "Progressive Gait Deterioration", "description": "Walking asymmetry has crept from 2% to 7.5% over 6 months — joint damage accumulating silently.", "severity": "High", "weight": 75},
        {"category": "Inflammatory", "factor": "Nocturnal Pain Pattern", "description": "Sleep fragmentation spiking to 4-5 awakenings per night, consistent with inflammatory joint pain peaking at rest.", "severity": "Elevated", "weight": 62},
        {"category": "Genetic", "factor": "HLA-B27 Candidate", "description": "Family history of autoimmune conditions increases likelihood of spondyloarthropathy spectrum.", "severity": "Moderate", "weight": 50},
    ]},
    "acute_config": {
        "hrv": {"base": 40, "noise": 5},
        "rhr": {"base": 68, "noise": 2},
        "temp": {"base": 0.3, "noise": 0.1},
        "rr": {"base": 15, "noise": 0.5},
        "walk": {"base": 7.5, "noise": 0.5, "spikes": {6: (8.0, "elevated_asymmetry")}},
        "steps": {"base": 6500, "noise": 500},
        "sleep": {"base": 1, "noise": 0.5, "spikes": {3: (4, "elevated"), 4: (5, "elevated"), 5: (4, "elevated")}},
        "spo2": {"base": 97.8, "noise": 0.3},
        "step_len": {"base": 0.62, "noise": 0.03, "spikes": {3: (0.55, "joint_limited"), 4: (0.54, "joint_limited"), 5: (0.55, "joint_limited")}},
        "dsp": {"base": 29.0, "noise": 0.8, "spikes": {3: (33.5, "guarding_gait"), 4: (34.2, "guarding_gait")}},
    },
    "long_config": {
        "rhr": {"base": 65, "noise": 1.0, "trend": 0},
        "walk": {"base": 2.0, "noise": 0.2, "trend": 0.2, "spikes": {25: (None, "creeping_elevation")}},
        "spo2": {"base": 97.8, "noise": 0.2},
        "step_len": {"base": 0.68, "noise": 0.02, "trend": -0.003},
        "dsp": {"base": 24.0, "noise": 0.5, "trend": 0.2},
    },
    "menstrual_phases": [],
    "clinical_brief": {
        "summary": "Progressive walking asymmetry creeping from 2% to 7.5% over 6 months reveals silent joint deterioration — a pattern that precedes radiographic damage by 12-18 months. Combined with acute sleep fragmentation (4-5x baseline), the data indicates an active inflammatory arthropathy in a patient with known psoriasis.",
        "key_symptoms": ["Morning joint stiffness lasting >45 minutes in fingers and knees", "Progressive gait asymmetry worsening over 6 months", "Nocturnal pain causing 4-5 awakenings per night", "Dactylitis (sausage digit) reported in right index finger", "Fatigue disproportionate to activity level"],
        "severity_assessment": "Moderate to High",
        "recommended_actions": ["Rheumatology referral for CASPAR criteria evaluation", "Inflammatory markers: CRP, ESR, and HLA-B27 typing", "X-ray hands/feet plus MRI of affected joints", "Dermatology co-management for psoriasis-PsA correlation"],
        "cited_sources": ["PMC8888888: Gait alterations in early Psoriatic Arthritis", "PMC5523901: Digital Biomarkers Preceding Radiographic Joint Damage", "PMC7712345: Sleep Disruption in Inflammatory Arthropathies"],
        "guiding_questions": ["Does the morning stiffness improve after you have been moving for 30-60 minutes?", "Have you noticed any nail changes — pitting, ridging, or separation from the nail bed?", "Has any single finger or toe become uniformly swollen (sausage-like)?", "Is your psoriasis currently flaring, and do joint symptoms correlate with skin flares?", "Have you experienced any lower back stiffness, especially in the early morning?"]
    },
    "deltas": [
        {"metric": "walkingAsymmetryPercentage", "acute_avg": 7.5, "longitudinal_avg": 4.5, "delta": 3.0, "unit": "%", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-06", "changepoint_direction": "up"},
        {"metric": "sleepAnalysis_awakeSegments", "acute_avg": 4, "longitudinal_avg": 1, "delta": 3, "unit": "count", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-06", "changepoint_direction": "up"},
        {"metric": "appleSleepingWristTemperature", "acute_avg": 0.35, "longitudinal_avg": 0.05, "delta": 0.30, "unit": "degC_deviation", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None}
    ],
    "conditions": [
        {"condition": "Psoriatic Arthritis", "similarity_score": 0.88, "pmcid": "PMC8888888", "title": "Gait alterations in early Psoriatic Arthritis", "snippet": "Longitudinal creeping of walking asymmetry is a key digital biomarker for joint deterioration before radiographic evidence."},
        {"condition": "Rheumatoid Arthritis", "similarity_score": 0.71, "pmcid": "PMC5523901", "title": "Early RA vs PsA: Distinguishing Features", "snippet": "Symmetrical small joint involvement without dactylitis favors RA, while asymmetric presentation with enthesitis favors PsA."},
        {"condition": "Ankylosing Spondylitis", "similarity_score": 0.54, "pmcid": "PMC7712345", "title": "Axial Spondyloarthropathy Screening", "snippet": "Morning stiffness with inflammatory back pain pattern should prompt HLA-B27 testing in psoriasis patients."}
    ]
}

# PATIENT 5: Elijah Brooks - Sleep Apnea
elijah = {
    "name": "Elijah Brooks",
    "time": "14:00",
    "narrative": "Waking up gasping for air, chronic daytime fatigue, morning headaches.",
    "risk_profile": {"factors": [
        {"category": "Metabolic", "factor": "Elevated BMI (>30)", "description": "BMI 34.2 — strongest modifiable risk factor for obstructive sleep apnea.", "severity": "High", "weight": 80},
        {"category": "Respiratory", "factor": "Nocturnal Respiratory Instability", "description": "Respiratory rate spiking to 26-28 breaths/min during sleep — 73% above waking baseline.", "severity": "High", "weight": 85},
        {"category": "Neurological", "factor": "Chronic Sleep Deprivation", "description": "Averaging 12-18 awakenings per night, preventing restorative deep sleep for weeks.", "severity": "High", "weight": 78},
        {"category": "Cardiovascular", "factor": "Nocturnal Hypoxemia Risk", "description": "Sustained respiratory events increase risk of pulmonary hypertension and arrhythmia.", "severity": "Elevated", "weight": 65},
    ]},
    "acute_config": {
        "hrv": {"base": 35, "noise": 5},
        "rhr": {"base": 72, "noise": 3},
        "temp": {"base": 0.1, "noise": 0.1},
        "rr": {"base": 15, "noise": 1, "spikes": {2: (26, "massive_spike"), 4: (28, "massive_spike"), 6: (25, "massive_spike")}},
        "walk": {"base": 1.2, "noise": 0.2},
        "steps": {"base": 7000, "noise": 800},
        "sleep": {"base": 1, "noise": 1, "spikes": {1: (15, "extreme"), 3: (18, "extreme"), 5: (16, "extreme")}},
        "spo2": {"base": 91.0, "noise": 1.5, "spikes": {1: (88.2, "critical_drop"), 3: (87.5, "critical_drop"), 5: (89.0, "critical_drop")}},
        "step_len": {"base": 0.71, "noise": 0.02},
        "dsp": {"base": 22.5, "noise": 0.4},
    },
    "long_config": {
        "rhr": {"base": 70, "noise": 1.5, "trend": 0},
        "walk": {"base": 1.2, "noise": 0.1, "trend": 0},
        "spo2": {"base": 94.5, "noise": 1.0, "trend": -0.1},
        "step_len": {"base": 0.71, "noise": 0.02},
        "dsp": {"base": 22.5, "noise": 0.3},
    },
    "menstrual_phases": [],
    "clinical_brief": {
        "summary": "Respiratory rate spikes to 26-28 breaths/min during sleep align precisely with extreme sleep fragmentation (12-18 awakenings/night) — a 300% increase over baseline. This pattern, combined with witnessed apneic episodes and morning headaches, constitutes a textbook severe OSA presentation detectable through wearable data alone.",
        "key_symptoms": ["Witnessed apneic episodes — gasping and choking during sleep", "Excessive daytime sleepiness despite 8+ hours in bed", "Morning headaches resolving within 1-2 hours of waking", "Nocturia (2-3 bathroom trips per night)", "Unrefreshing sleep with cognitive impairment during the day"],
        "severity_assessment": "High — Urgent",
        "recommended_actions": ["Urgent polysomnography (sleep study) — suspected AHI >30 events/hour", "Evaluate for CPAP titration based on study results", "Assess for nocturnal hypoxemia with overnight pulse oximetry", "Screen for secondary hypertension and metabolic syndrome"],
        "cited_sources": ["PMC9999999: Wearable detection of sleep apnea events", "PMC6543210: Respiratory Rate as Digital Biomarker for OSA Severity", "PMC8123456: Cardiovascular Consequences of Untreated Sleep Apnea"],
        "guiding_questions": ["Has a bed partner or family member witnessed you stop breathing or gasp during sleep?", "Do you frequently fall asleep during passive activities like watching TV or reading?", "How would you rate your daytime sleepiness on a scale of 1-10?", "Do you wake up with headaches that go away within an hour or two?", "Have you been told you have high blood pressure, and is it difficult to control with medication?"]
    },
    "deltas": [
        {"metric": "respiratoryRate", "acute_avg": 21, "longitudinal_avg": 15, "delta": 6, "unit": "breaths/min", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-05", "changepoint_direction": "up"},
        {"metric": "sleepAnalysis_awakeSegments", "acute_avg": 12, "longitudinal_avg": 3, "delta": 9, "unit": "count", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-04", "changepoint_direction": "up"},
        {"metric": "heartRateVariabilitySDNN", "acute_avg": 30, "longitudinal_avg": 42, "delta": -12, "unit": "ms", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None},
        {"metric": "restingHeartRate", "acute_avg": 75, "longitudinal_avg": 70, "delta": 5, "unit": "bpm", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None}
    ],
    "conditions": [
        {"condition": "Severe Obstructive Sleep Apnea", "similarity_score": 0.95, "pmcid": "PMC9999999", "title": "Wearable detection of sleep apnea events", "snippet": "Massive spikes in respiratory rate and awake segments are hallmark digital signs of OSA with estimated AHI >30."},
        {"condition": "Central Sleep Apnea", "similarity_score": 0.68, "pmcid": "PMC6543210", "title": "Central vs Obstructive Apnea: Respiratory Waveform Analysis", "snippet": "Central apnea events lack the obstructive effort pattern and may co-occur with OSA in complex cases."},
        {"condition": "Obesity Hypoventilation Syndrome", "similarity_score": 0.61, "pmcid": "PMC8123456", "title": "OHS Comorbidity with Sleep Apnea", "snippet": "Daytime hypercapnia and nocturnal respiratory failure in patients with BMI >30 may indicate OHS superimposed on OSA."}
    ]
}

# PATIENT 6: Priya Sharma - PCOS
priya = {
    "name": "Priya Sharma",
    "time": "15:30",
    "narrative": "Sudden weight fluctuations, irregular cycles, and sudden spikes in systemic inflammation.",
    "risk_profile": {"factors": [
        {"category": "Endocrine", "factor": "Insulin Resistance", "description": "Borderline HOMA-IR of 2.8 — subclinical metabolic dysfunction driving hormonal imbalance.", "severity": "High", "weight": 75},
        {"category": "Hormonal", "factor": "Anovulatory Cycles", "description": "Erratic wrist temperature lacking normal biphasic pattern confirms absent ovulation for 3+ months.", "severity": "High", "weight": 80},
        {"category": "Metabolic", "factor": "Unexplained Weight Fluctuations", "description": "8 lb weight swing in 6 weeks without dietary changes, consistent with hormonal fluid retention.", "severity": "Elevated", "weight": 60},
        {"category": "Inflammatory", "factor": "Chronic Low-Grade Inflammation", "description": "Depressed HRV baseline suggests sustained sympathetic activation from metabolic stress.", "severity": "Moderate", "weight": 55},
    ]},
    "acute_config": {
        "hrv": {"base": 25, "noise": 4, "spikes": {3: (20, "depressed"), 4: (18, "depressed")}},
        "rhr": {"base": 78, "noise": 4},
        "temp": {"base": 0.4, "noise": 0.8, "spikes": {1: (-0.5, "erratic"), 3: (1.2, "erratic"), 6: (-0.2, "erratic")}},
        "rr": {"base": 15, "noise": 0.5},
        "walk": {"base": 1.4, "noise": 0.2},
        "steps": {"base": 8500, "noise": 1000},
        "sleep": {"base": 2, "noise": 1},
        "spo2": {"base": 97.8, "noise": 0.3},
        "step_len": {"base": 0.70, "noise": 0.02},
        "dsp": {"base": 22.5, "noise": 0.4},
    },
    "long_config": {
        "rhr": {"base": 75, "noise": 2, "trend": 0},
        "walk": {"base": 1.3, "noise": 0.1, "trend": 0},
        "spo2": {"base": 97.8, "noise": 0.2},
        "step_len": {"base": 0.70, "noise": 0.02},
        "dsp": {"base": 22.5, "noise": 0.3},
    },
    "menstrual_phases": ["Follicular", "Follicular", "Late_Follicular", "Anovulatory", "Anovulatory", "Anovulatory", "Late_Follicular"],
    "clinical_brief": {
        "summary": "Wrist temperature data reveals complete absence of the normal biphasic ovulatory pattern — confirming chronic anovulation. Combined with HRV depressed 37% below baseline (indicating sustained sympathetic activation) and erratic temperature swings of \u00b11.2\u00b0C, the biometric profile strongly correlates with PCOS-driven hormonal and metabolic dysregulation.",
        "key_symptoms": ["Irregular menstrual cycles — ranging from 21 to 65 days apart", "Unexplained weight gain of 8 lbs in 6 weeks", "Persistent adult-onset acne along jawline and chin", "Thinning hair on scalp with excess facial hair growth (hirsutism)", "Chronic fatigue with afternoon energy crashes"],
        "severity_assessment": "Moderate to High",
        "recommended_actions": ["Endocrinology panel: free/total testosterone, DHEA-S, LH/FSH ratio, fasting insulin", "Pelvic ultrasound for ovarian morphology (follicle count)", "Fasting glucose and HbA1c to assess insulin resistance", "Consider metformin trial if HOMA-IR confirmed elevated"],
        "cited_sources": ["PMC1010101: Biphasic temperature loss in PCOS", "PMC7845632: Wearable Thermometry for Ovulation Detection", "PMC5512890: Metabolic Syndrome Overlap in PCOS"],
        "guiding_questions": ["Have you noticed increased hair growth on your face, chest, or abdomen?", "How long have your menstrual cycles been irregular, and what is the longest gap between periods?", "Have you experienced difficulty losing weight despite diet and exercise changes?", "Is there a family history of diabetes, PCOS, or metabolic syndrome?", "Have you been screened for prediabetes or insulin resistance previously?"]
    },
    "deltas": [
        {"metric": "appleSleepingWristTemperature", "acute_avg": 0.4, "longitudinal_avg": 0.0, "delta": 0.4, "unit": "degC_deviation", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None},
        {"metric": "heartRateVariabilitySDNN", "acute_avg": 22, "longitudinal_avg": 35, "delta": -13, "unit": "ms", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-06", "changepoint_direction": "down"},
        {"metric": "restingHeartRate", "acute_avg": 78, "longitudinal_avg": 72, "delta": 6, "unit": "bpm", "clinically_significant": True, "changepoint_detected": False, "changepoint_date": None, "changepoint_direction": None}
    ],
    "conditions": [
        {"condition": "Polycystic Ovary Syndrome (PCOS)", "similarity_score": 0.87, "pmcid": "PMC1010101", "title": "Biphasic temperature loss in PCOS", "snippet": "Erratic sleeping wrist temperatures and lack of biphasic patterns indicate anovulatory cycles, a hallmark of PCOS."},
        {"condition": "Hypothalamic Amenorrhea", "similarity_score": 0.63, "pmcid": "PMC7845632", "title": "Functional vs Organic Anovulation", "snippet": "Stress-induced hypothalamic suppression can mimic PCOS thermometry patterns but lacks hyperandrogenic features."},
        {"condition": "Subclinical Hypothyroidism", "similarity_score": 0.55, "pmcid": "PMC5512890", "title": "Thyroid Dysfunction and Menstrual Irregularity", "snippet": "TSH elevation between 4-10 mIU/L can cause cycle irregularity and weight gain overlapping with PCOS presentation."}
    ]
}

patients_list = [amara, maria, jordan, david, elijah, priya]

def seed_db():
    print("Clearing old appointments and patients...")
    db.appointments.delete_many({})
    db.patients.delete_many({})
    
    for pt in patients_list:
        p_record, a_record = create_patient_and_appointment(pt)
        db.patients.insert_one(p_record)
        db.appointments.insert_one(a_record)
        print(f"Inserted: {pt['name']} for {pt['time']}")
        
    print("Database seeded successfully with 6 mock patients.")

if __name__ == "__main__":
    seed_db()
