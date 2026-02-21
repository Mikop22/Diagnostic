"""GET /api/v1/paper/{pmcid} — proxy PDF from NCBI PubMed Central."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import httpx

router = APIRouter(prefix="/api/v1", tags=["papers"])


@router.get("/paper/{pmcid}")
async def proxy_paper(pmcid: str):
    """Stream a PDF from NCBI PMC for the given PMCID."""
    url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/pdf/"

    async def stream_pdf():
        async with httpx.AsyncClient(follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"NCBI returned {response.status_code}",
                    )
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    yield chunk

    return StreamingResponse(
        stream_pdf(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={pmcid}.pdf"},
    )
