"""GET /api/v1/paper/{pmcid} — proxy PDF from Europe PMC."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import httpx

router = APIRouter(prefix="/api/v1", tags=["papers"])


@router.get("/paper/{pmcid}")
async def proxy_paper(pmcid: str):
    """Stream a PDF from Europe PMC for the given PMCID.

    Uses the Europe PMC renderer which returns actual application/pdf
    content, unlike the NCBI URL which returns HTML pages.
    """
    url = f"https://europepmc.org/backend/ptpmcrender.fcgi?accid={pmcid}&blobtype=pdf"

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        # Pre-check: HEAD request to verify the PDF exists before streaming
        head = await client.head(url)
        if head.status_code != 200:
            raise HTTPException(
                status_code=head.status_code,
                detail=f"PDF not available for {pmcid}",
            )

        content_type = head.headers.get("content-type", "")
        if "pdf" not in content_type:
            raise HTTPException(
                status_code=404,
                detail=f"No PDF found for {pmcid} (got {content_type})",
            )

    # Stream the actual PDF with a new client (previous one closed after HEAD)
    async def stream_pdf():
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            async with client.stream("GET", url) as response:
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    yield chunk

    return StreamingResponse(
        stream_pdf(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={pmcid}.pdf"},
    )
