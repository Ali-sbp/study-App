from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me")
async def upsert_user(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.clerk_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        try:
            user = User(clerk_id=user_id)
            db.add(user)
            await db.commit()
            await db.refresh(user)
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(User).where(User.clerk_id == user_id))
            user = result.scalar_one()
    return {"clerk_id": user.clerk_id, "plan": user.plan}
