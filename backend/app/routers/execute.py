from fastapi import APIRouter, Depends, HTTPException, Request
import httpx
from app.auth import get_current_user

router = APIRouter(tags=["execute"])

HASKELL_RUNNER_URL = "http://haskell-runner:8080"


@router.post("/execute")
async def execute_code(
    body: dict,
    user_id: str = Depends(get_current_user),
):
    code = body.get("code", "")
    if not code.strip():
        raise HTTPException(status_code=422, detail="No code provided")

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{HASKELL_RUNNER_URL}/execute",
                json={"code": code},
                timeout=20.0,
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Haskell runner is unavailable")

        if not res.is_success:
            raise HTTPException(status_code=502, detail=f"Runner error: {res.text}")

        data = res.json()

    stdout = data.get("stdout") or None
    stderr = data.get("stderr") or None
    exit_code = data.get("exit_code", 1)
    status = "Accepted" if exit_code == 0 else "Runtime Error"

    return {
        "stdout": stdout,
        "stderr": stderr,
        "compile_output": None,
        "status": status,
    }


@router.post("/ghci")
async def ghci_eval(
    body: dict,
    user_id: str = Depends(get_current_user),
):
    expr = body.get("expr", "").strip()
    if not expr:
        raise HTTPException(status_code=422, detail="No expression provided")

    code = body.get("code", "")

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{HASKELL_RUNNER_URL}/ghci",
                json={"code": code, "expr": expr},
                timeout=20.0,
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Haskell runner is unavailable")

        if not res.is_success:
            raise HTTPException(status_code=502, detail=f"Runner error: {res.text}")

        return res.json()


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    # Stub — full logic added when PAYMENTS_ENABLED=true
    return {"received": True}
