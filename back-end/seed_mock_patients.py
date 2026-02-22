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
        "sleepAnalysis_awakeSegments": generate_metric(acute_dates, **a_conf["sleep"], unit="count")
    }
    
    l_conf = pt_data["long_config"]
    long_metrics = {
        "restingHeartRate": generate_metric(long_dates, **l_conf["rhr"], unit="bpm"),
        "walkingAsymmetryPercentage": generate_metric(long_dates, **l_conf["walk"], unit="%")
    }
    
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
    "risk_profile": {"factors": [{"category": "Reproductive", "factor": "Family History", "description": "Mother had severe endometriosis.", "severity": "High", "weight": 80}]},
    "acute_config": {
        "hrv": {"base": 45, "noise": 3, "spikes": {4: (20, "crashed"), 5: (22, "crashed"), 6: (21, "crashed")}},
        "rhr": {"base": 65, "noise": 2, "spikes": {5: (75, "elevated")}},
        "temp": {"base": 0.1, "noise": 0.1, "spikes": {4: (0.9, "sustained_high"), 5: (1.1, "sustained_high"), 6: (0.8, "sustained_high")}},
        "rr": {"base": 14, "noise": 0.5},
        "walk": {"base": 1.2, "noise": 0.2, "spikes": {4: (8.5, "guarding_detected"), 5: (9.2, "guarding_detected"), 6: (8.8, "guarding_detected")}},
        "steps": {"base": 8000, "noise": 500, "spikes": {4: (2000, "mobility_drop"), 5: (1500, "mobility_drop"), 6: (1800, "mobility_drop")}},
        "sleep": {"base": 1, "noise": 1, "spikes": {4: (5, "painsomnia"), 5: (6, "painsomnia"), 6: (5, "painsomnia")}}
    },
    "long_config": {
        "rhr": {"base": 64, "noise": 1.5, "trend": 0},
        "walk": {"base": 1.2, "noise": 0.1, "trend": 0}
    },
    "clinical_brief": {
        "summary": "Patient presents with severe cyclic pelvic and radiating leg pain with acute biometric decomposition over the past 3 days.",
        "key_symptoms": ["Radiating pelvic pain", "Severe cramping", "Mobility impairment"],
        "severity_assessment": "High",
        "recommended_actions": ["Urgent transvaginal ultrasound", "Consult gynecology specialist"],
        "cited_sources": ["PMC1234567: Endometriosis presentation"],
        "guiding_questions": ["Has the pain worsened specifically during menses?", "Is there any history of painful intercourse?"]
    },
    "deltas": [
        {"metric": "walkingAsymmetryPercentage", "acute_avg": 5.8, "longitudinal_avg": 1.2, "delta": 4.6, "unit": "%", "clinically_significant": True, "changepoint_detected": True, "changepoint_date": "2026-03-07", "changepoint_direction": "up"},
        {"metric": "appleSleepingWristTemperature", "acute_avg": 0.6, "longitudinal_avg": 0.1, "delta": 0.5, "unit": "degC_deviation", "clinically_significant": True}
    ],
    "conditions": [
        {"condition": "Deep-Infiltrating Endometriosis", "similarity_score": 0.89, "pmcid": "PMC8765432", "title": "Atypical Presentations of Endometriosis", "snippet": "Radiating leg pain and pelvic guarding correspond heavily to deep-infiltrating endometriosis implants."}
    ]
}

# PATIENT 2: Maria Santos - Uterine Fibroids (Anemia)
maria = {
    "name": "Maria Santos",
    "time": "11:45",
    "narrative": "Extreme fatigue, heavy bleeding, shortness of breath when walking up stairs.",
    "risk_profile": {"factors": [{"category": "Hematological", "factor": "Heavy Menstrual Bleeding", "description": "Chronic heavy periods.", "severity": "Moderate", "weight": 60}]},
    "acute_config": {
        "hrv": {"base": 30, "noise": 2},
        "rhr": {"base": 85, "noise": 3},
        "temp": {"base": 0.0, "noise": 0.1},
        "rr": {"base": 16, "noise": 0.5, "spikes": {5: (20, "elevated"), 6: (19, "elevated")}},
        "walk": {"base": 1.5, "noise": 0.2},
        "steps": {"base": 6000, "noise": 300, "trend": -500},
        "sleep": {"base": 2, "noise": 1}
    },
    "long_config": {
        "rhr": {"base": 65, "noise": 1.0, "trend": 0.8, "spikes": {25: (None, "creeping_elevation")}},
        "walk": {"base": 1.5, "noise": 0.1, "trend": 0}
    },
    "clinical_brief": {
        "summary": "Symptomatic anemia strongly correlated with suspected uterine fibroids, showing creeping RHR over 6 months.",
        "key_symptoms": ["Extreme fatigue", "Shortness of breath on exertion", "Heavy bleeding"],
        "severity_assessment": "Moderate to High",
        "recommended_actions": ["CBC panel to check hemoglobin", "Pelvic ultrasound"],
        "cited_sources": ["PMC2345678: Fibroids and Anemia"],
        "guiding_questions": ["Do you use more than one pad/tampon per hour?", "Do you experience lightheadedness upon standing?"]
    },
    "deltas": [
        {"metric": "restingHeartRate", "acute_avg": 85, "longitudinal_avg": 73, "delta": 12, "unit": "bpm", "clinically_significant": True},
        {"metric": "stepCount", "acute_avg": 4500, "longitudinal_avg": 8000, "delta": -3500, "unit": "count", "clinically_significant": True}
    ],
    "conditions": [
        {"condition": "Uterine Fibroids with Secondary Anemia", "similarity_score": 0.85, "pmcid": "PMC5555555", "title": "Impact of Fibroids on Cardiovascular Metrics", "snippet": "Chronic blood loss from fibroids frequently presents with a gradual rise in resting heart rate to maintain cardiac output."}
    ]
}

# PATIENT 3: Jordan Lee - POTS
jordan = {
    "name": "Jordan Lee",
    "time": "08:30",
    "narrative": "Dizziness when standing up, brain fog, racing heart after mild exertion.",
    "risk_profile": {"factors": [{"category": "Immunological", "factor": "Recent Viral Infection", "description": "Recovered from a severe viral illness 3 months ago.", "severity": "Moderate", "weight": 70}]},
    "acute_config": {
        "hrv": {"base": 20, "noise": 15, "spikes": {1: (15, "crashed"), 4: (10, "crashed"), 6: (12, "crashed")}},
        "rhr": {"base": 75, "noise": 20, "spikes": {2: (110, "extreme_erratic"), 5: (105, "extreme_erratic")}},
        "temp": {"base": 0.0, "noise": 0.1},
        "rr": {"base": 14, "noise": 0.5},
        "walk": {"base": 1.0, "noise": 0.2},
        "steps": {"base": 5000, "noise": 1000},
        "sleep": {"base": 2, "noise": 1}
    },
    "long_config": {
        "rhr": {"base": 70, "noise": 5, "trend": 0},
        "walk": {"base": 1.0, "noise": 0.1, "trend": 0}
    },
    "clinical_brief": {
        "summary": "Presents with highly erratic heart rate variability and heart rate spikes independent of exertion, indicative of autonomic dysfunction.",
        "key_symptoms": ["Orthostatic dizziness", "Brain fog", "Tachycardia"],
        "severity_assessment": "High",
        "recommended_actions": ["Tilt table test", "Holter monitor"],
        "cited_sources": ["PMC3456789: Post-Viral POTS"],
        "guiding_questions": ["Is the racing heart specific to standing up?", "Have you noticed any changes in symptoms with increased salt intake?"]
    },
    "deltas": [
        {"metric": "heartRateVariabilitySDNN", "acute_avg": 15, "longitudinal_avg": 45, "delta": -30, "unit": "ms", "clinically_significant": True},
        {"metric": "restingHeartRate", "acute_avg": 88, "longitudinal_avg": 70, "delta": 18, "unit": "bpm", "clinically_significant": True}
    ],
    "conditions": [
        {"condition": "Post-Viral POTS (Dysautonomia)", "similarity_score": 0.92, "pmcid": "PMC7777777", "title": "Autonomic Dysfunction Post-Infection", "snippet": "Characterized by erratic swings in heart rate and depressed HRV without fever."}
    ]
}

# PATIENT 4: David Chen - Psoriatic Arthritis
david = {
    "name": "David Chen",
    "time": "10:30",
    "narrative": "Joint stiffness in the mornings, specifically in the knees and fingers, worsening over the last month.",
    "risk_profile": {"factors": [{"category": "Dermatological", "factor": "Plaque Psoriasis", "description": "Diagnosed with skin psoriasis 2 years ago.", "severity": "High", "weight": 75}]},
    "acute_config": {
        "hrv": {"base": 40, "noise": 5},
        "rhr": {"base": 68, "noise": 2},
        "temp": {"base": 0.3, "noise": 0.1},
        "rr": {"base": 15, "noise": 0.5},
        "walk": {"base": 7.5, "noise": 0.5, "spikes": {6: (8.0, "elevated_asymmetry")}},
        "steps": {"base": 6500, "noise": 500},
        "sleep": {"base": 1, "noise": 0.5, "spikes": {3: (4, "elevated"), 4: (5, "elevated"), 5: (4, "elevated")}}
    },
    "long_config": {
        "rhr": {"base": 65, "noise": 1.0, "trend": 0},
        "walk": {"base": 2.0, "noise": 0.2, "trend": 0.2, "spikes": {25: (None, "creeping_elevation")}}
    },
    "clinical_brief": {
        "summary": "Progressive increase in walking asymmetry over 6 months, combined with acute sleep disruption due to pain.",
        "key_symptoms": ["Morning joint stiffness", "Sleep disturbances"],
        "severity_assessment": "Moderate",
        "recommended_actions": ["Rheumatology workup", "Assess inflammatory markers (CRP, ESR)"],
        "cited_sources": ["PMC4567890: Psoriatic Arthritis progression"],
        "guiding_questions": ["Does the stiffness improve after you've been moving for an hour?", "Have you noticed any nail changes?"]
    },
    "deltas": [
        {"metric": "walkingAsymmetryPercentage", "acute_avg": 7.5, "longitudinal_avg": 4.5, "delta": 3.0, "unit": "%", "clinically_significant": True},
        {"metric": "sleepAnalysis_awakeSegments", "acute_avg": 4, "longitudinal_avg": 1, "delta": 3, "unit": "count", "clinically_significant": True}
    ],
    "conditions": [
        {"condition": "Psoriatic Arthritis", "similarity_score": 0.88, "pmcid": "PMC8888888", "title": "Gait alterations in early Psoriatic Arthritis", "snippet": "Longitudinal creeping of walking asymmetry is a key digital biomarker for joint deterioration before radiographic evidence."}
    ]
}

# PATIENT 5: Elijah Brooks - Sleep Apnea
elijah = {
    "name": "Elijah Brooks",
    "time": "14:00",
    "narrative": "Waking up gasping for air, chronic daytime fatigue, morning headaches.",
    "risk_profile": {"factors": [{"category": "Metabolic", "factor": "BMI > 30", "description": "Elevated BMI.", "severity": "Moderate", "weight": 65}]},
    "acute_config": {
        "hrv": {"base": 35, "noise": 5},
        "rhr": {"base": 72, "noise": 3},
        "temp": {"base": 0.1, "noise": 0.1},
        "rr": {"base": 15, "noise": 1, "spikes": {2: (26, "massive_spike"), 4: (28, "massive_spike"), 6: (25, "massive_spike")}},
        "walk": {"base": 1.2, "noise": 0.2},
        "steps": {"base": 7000, "noise": 800},
        "sleep": {"base": 1, "noise": 1, "spikes": {1: (15, "extreme"), 3: (18, "extreme"), 5: (16, "extreme")}}
    },
    "long_config": {
        "rhr": {"base": 70, "noise": 1.5, "trend": 0},
        "walk": {"base": 1.2, "noise": 0.1, "trend": 0}
    },
    "clinical_brief": {
        "summary": "Severe nightly respiratory rate anomalies perfectly aligned with extreme sleep fragmentation.",
        "key_symptoms": ["Gasping during sleep", "Daytime fatigue", "Morning headaches"],
        "severity_assessment": "High",
        "recommended_actions": ["Polysomnography (Sleep Study)", "Evaluate for CPAP"],
        "cited_sources": ["PMC5678901: OSA and Biometrics"],
        "guiding_questions": ["Has anyone witnessed you stop breathing during sleep?", "Do you often fall asleep during sedentary activities?"]
    },
    "deltas": [
        {"metric": "respiratoryRate", "acute_avg": 21, "longitudinal_avg": 15, "delta": 6, "unit": "breaths/min", "clinically_significant": True},
        {"metric": "sleepAnalysis_awakeSegments", "acute_avg": 12, "longitudinal_avg": 3, "delta": 9, "unit": "count", "clinically_significant": True}
    ],
    "conditions": [
        {"condition": "Severe Obstructive Sleep Apnea", "similarity_score": 0.95, "pmcid": "PMC9999999", "title": "Wearable detection of sleep apnea events", "snippet": "Massive spikes in respiratory rate and awake segments are hallmark digital signs of OSA."}
    ]
}

# PATIENT 6: Priya Sharma - PCOS
priya = {
    "name": "Priya Sharma",
    "time": "15:30",
    "narrative": "Sudden weight fluctuations, irregular cycles, and sudden spikes in systemic inflammation.",
    "risk_profile": {"factors": [{"category": "Endocrine", "factor": "Insulin Resistance", "description": "Borderline HOMA-IR levels.", "severity": "Moderate", "weight": 60}]},
    "acute_config": {
        "hrv": {"base": 25, "noise": 4, "spikes": {3: (20, "depressed"), 4: (18, "depressed")}},
        "rhr": {"base": 78, "noise": 4},
        "temp": {"base": 0.4, "noise": 0.8, "spikes": {1: (-0.5, "erratic"), 3: (1.2, "erratic"), 6: (-0.2, "erratic")}},
        "rr": {"base": 15, "noise": 0.5},
        "walk": {"base": 1.4, "noise": 0.2},
        "steps": {"base": 8500, "noise": 1000},
        "sleep": {"base": 2, "noise": 1}
    },
    "long_config": {
        "rhr": {"base": 75, "noise": 2, "trend": 0},
        "walk": {"base": 1.3, "noise": 0.1, "trend": 0}
    },
    "clinical_brief": {
        "summary": "Erratic baseline wrist temperature and chronically depressed HRV pointing to hormonal and metabolic imbalances.",
        "key_symptoms": ["Irregular cycles", "Weight fluctuations"],
        "severity_assessment": "Moderate",
        "recommended_actions": ["Endocrinology panel (Testosterone, LH/FSH ratio)", "Pelvic ultrasound for ovarian morphology"],
        "cited_sources": ["PMC6789012: Wearable signs of PCOS"],
        "guiding_questions": ["Have you noticed excess hair growth or acne?", "How long have your cycles been irregular?"]
    },
    "deltas": [
        {"metric": "appleSleepingWristTemperature", "acute_avg": 0.4, "longitudinal_avg": 0.0, "delta": 0.4, "unit": "degC_deviation", "clinically_significant": True},
        {"metric": "heartRateVariabilitySDNN", "acute_avg": 22, "longitudinal_avg": 35, "delta": -13, "unit": "ms", "clinically_significant": True}
    ],
    "conditions": [
        {"condition": "Polycystic Ovary Syndrome (PCOS)", "similarity_score": 0.87, "pmcid": "PMC1010101", "title": "Biphasic temperature loss in PCOS", "snippet": "Erratic sleeping wrist temperatures and lack of biphasic patterns indicate anovulatory cycles common in PCOS."}
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
