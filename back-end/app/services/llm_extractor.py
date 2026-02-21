"""LLM-based clinical brief extraction using GPT-4o with structured output."""

from langchain_openai import ChatOpenAI
from pydantic import BaseModel
from app.config import settings


class ClinicalBriefOutput(BaseModel):
    summary: str
    key_symptoms: list[str]
    severity_assessment: str
    recommended_actions: list[str]


SYSTEM_PROMPT = """You are a clinical data analyst specializing in women's health.
Given a patient's narrative description of their symptoms along with their biometric data summary,
produce a structured clinical brief.
Focus on:
1. Objective symptom identification from the narrative
2. Correlation between reported symptoms and biometric anomalies
3. Severity assessment based on delta between acute and baseline metrics
4. Evidence-based recommended diagnostic actions
Be clinical, precise, and advocacy-oriented. This brief will be presented to a physician
to combat potential dismissal of the patient's pain experience."""


async def extract_clinical_brief(
    narrative: str, biometric_summary: str
) -> ClinicalBriefOutput:
    """Call GPT-4o with structured output to produce a clinical brief."""
    llm = ChatOpenAI(
        model="gpt-4o",
        api_key=settings.OPENAI_API_KEY,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(
        ClinicalBriefOutput, strict=True
    )

    user_message = (
        f"## Patient Narrative\n{narrative}\n\n"
        f"## Biometric Data Summary\n{biometric_summary}\n\n"
        "Produce the clinical brief."
    )

    result = await structured_llm.ainvoke(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
    )
    return result
