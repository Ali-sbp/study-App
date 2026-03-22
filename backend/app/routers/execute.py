from fastapi import APIRouter, Depends, HTTPException, Request
import httpx
from app.auth import get_current_user
from app.config import get_settings

router = APIRouter(tags=["execute"])

HASKELL_LANGUAGE_ID = 12   # Judge0 CE language ID for Haskell


@router.post("/execute")
async def execute_code(
    body: dict,
    user_id: str = Depends(get_current_user),
):
    settings = get_settings()
    if not settings.judge0_api_url or not settings.judge0_api_key:
        raise HTTPException(status_code=503, detail="Code execution not configured")

    code = body.get("code", "")
    language_id = body.get("language_id", HASKELL_LANGUAGE_ID)
    if language_id != HASKELL_LANGUAGE_ID:
        raise HTTPException(status_code=422, detail=f"Only language_id {HASKELL_LANGUAGE_ID} (Haskell) is supported")

    headers = {
        "X-RapidAPI-Key": settings.judge0_api_key,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        # Submit
        submit = await client.post(
            f"{settings.judge0_api_url}/submissions?base64_encoded=false&wait=true",
            json={"source_code": code, "language_id": language_id},
            headers=headers,
            timeout=30.0,
        )
        result = submit.json()

    return {
        "stdout": result.get("stdout"),
        "stderr": result.get("stderr"),
        "compile_output": result.get("compile_output"),
        "status": result.get("status", {}).get("description"),
    }


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    # Stub — full logic added when PAYMENTS_ENABLED=true
    return {"received": True}
