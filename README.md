# Diagnostic

Diagnostic aims to combat systemic disparities for underrepresented groups in healthcare. It merges natural language processing (NLP) with multi-modal physiological data from Apple Watch (Heart Rate Variability, Resting Heart Rate, Mobility metrics) to produce a clinical dashboard with in context research for physicians.

<img width="2056" height="1234" alt="Screenshot 2026-03-02 at 4 08 06 PM" src="https://github.com/user-attachments/assets/cc176ad6-ca53-4e3a-a760-abab8d8b5523" />

<img width="2056" height="1234" alt="Screenshot 2026-03-02 at 4 08 24 PM" src="https://github.com/user-attachments/assets/556db304-f42d-4c28-87e2-c23bea112cd3" />

<img width="2056" height="1234" alt="Screenshot 2026-03-02 at 4 08 47 PM" src="https://github.com/user-attachments/assets/9fbec4e2-0a69-48f4-b38a-bb0170983888" />











## Table of Contents

1. [How It Works — End-to-End](#how-it-works--end-to-end)
2. [Architecture Overview](#architecture-overview)
3. [Backend Deep Dive](#backend-deep-dive)
4. [Frontend Deep Dive](#frontend-deep-dive)
5. [Patient Intake Flow](#patient-intake-flow)
6. [XRPL Integration](#xrpl-integration)
7. [Shared API Contract](#shared-api-contract)
8. [Data Models](#data-models)
9. [The Mock Payload](#the-mock-payload)
10. [Design System — Liquid Glass](#design-system--liquid-glass)
11. [Getting Started](#getting-started)
12. [Deployment](#deployment)
13. [Project Structure](#project-structure)
14. [Testing](#testing)

---

## How It Works — End-to-End

The platform operates as a **Retrieval-Augmented Generation (RAG) diagnostic pipeline**. Here is the complete data flow from patient input to physician dashboard:

### Step 1: Patient Data Ingestion

A patient's Apple Watch continuously collects biometric data (HRV, resting heart rate, wrist temperature, respiratory rate, walking asymmetry, step count, sleep disruptions). This data is paired with a free-text narrative where the patient describes their symptoms in their own words. Together, these form a `PatientPayload`:

```
PatientPayload
├── patient_id
├── patient_narrative      ← free-text symptom description
├── risk_profile           ← genetic/demographic/comorbidity factors
└── data
    ├── acute_7_day        ← daily biometric readings for the past 7 days
    └── longitudinal_6_month ← weekly averages over the past 26 weeks
```

### Step 2: Biometric Delta Computation

The backend computes **deltas** — the mathematical difference between the patient's acute (recent) state and their own historical baseline. This transforms raw numbers into clinically meaningful deviations:

- **Shared metrics** (resting heart rate, walking asymmetry): The 7-day daily average is compared against the 26-week longitudinal average.
- **Acute-only metrics** (HRV, respiratory rate, step count, sleep disruptions, wrist temperature): The 7-day window is split into baseline (first 3 days) vs. acute (last 4 days).

Each delta is checked against clinically significant thresholds (e.g., resting heart rate jump > 5 bpm, step count drop > 3000 steps).

### Step 3: PubMedBERT Embedding

The patient's narrative and the computed biometric summary are concatenated and encoded into a **768-dimensional embedding vector** using `lokeshch19/ModernPubMedBERT` (a domain-specific BERT model pre-trained on biomedical literature). This places the patient's clinical presentation into medical semantic space.

### Step 4: MongoDB Atlas Hybrid Search

The embedding vector is used to query a MongoDB Atlas collection of medical conditions via **hybrid search**:

- **`$vectorSearch`**: Semantic similarity against pre-computed condition embeddings (cosine similarity).
- **`$search` (BM25)**: Traditional keyword matching against condition names, paper titles, and clinical snippets.
- **`$rankFusion`**: Reciprocal Rank Fusion merges both result sets, producing better matches than either method alone.

The top 5 matching conditions are returned, each with a condition name, a PubMed paper reference (PMCID), a clinical snippet, and a similarity score.

### Step 5: RAG-Augmented LLM Extraction

The top 3 condition matches are formatted as **retrieval context** and passed alongside the patient narrative, biometric summary, and demographic risk profile to GPT (via LangChain). The LLM is prompted to:

1. Identify objective symptoms from the narrative.
2. Correlate symptoms with biometric anomalies.
3. Assess severity based on deltas.
4. Recommend diagnostic actions weighted by demographic/genetic risk factors.
5. Generate 5 targeted guiding questions for the physician.
6. **Cite the retrieved medical literature** in its analysis.


