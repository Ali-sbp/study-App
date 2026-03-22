import pytest
from fastapi import HTTPException
from app.auth import verify_clerk_token

@pytest.mark.asyncio
async def test_verify_clerk_token_invalid():
    with pytest.raises(HTTPException) as exc_info:
        await verify_clerk_token("invalid.token.here")
    assert exc_info.value.status_code == 401
