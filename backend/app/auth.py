from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import httpx
from app.config import get_settings

security = HTTPBearer()

async def verify_clerk_token(token: str) -> str:
    """Verify a Clerk JWT and return the user's Clerk ID (sub claim)."""
    settings = get_settings()
    try:
        unverified_claims = jwt.get_unverified_claims(token)
        issuer = unverified_claims.get("iss", "")
        if not issuer:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing issuer")

        # Validate issuer against configured allowlist to prevent SSRF
        if settings.clerk_jwt_issuer and issuer != settings.clerk_jwt_issuer:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: untrusted issuer")

        try:
            async with httpx.AsyncClient() as client:
                jwks_response = await client.get(f"{issuer}/.well-known/jwks.json")
                jwks_response.raise_for_status()
                jwks = jwks_response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth service unavailable")
        except httpx.HTTPStatusError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed to fetch JWKS")

        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if not key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Key not found")

        payload = jwt.decode(token, key, algorithms=["RS256"])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return user_id

    except HTTPException:
        raise
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    return await verify_clerk_token(credentials.credentials)


async def get_admin_user(user_id: str = Depends(get_current_user)) -> str:
    settings = get_settings()
    if user_id not in settings.admin_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user_id
