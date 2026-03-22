import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_
from app.database import get_db
from app.auth import get_current_user
from app.models.chat import ChatMessage
from app.models.lecture import Lecture

router = APIRouter(prefix="/chat", tags=["chat"])


async def _get_accessible_lecture(lecture_id: uuid.UUID, user_id: str, db: AsyncSession) -> Lecture:
    """Fetch lecture and verify user has access (is_default OR created_by)."""
    result = await db.execute(
        select(Lecture).where(
            Lecture.id == lecture_id,
            or_(Lecture.is_default == True, Lecture.created_by == user_id),
        )
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.get("/{lecture_id}/history")
async def get_history(
    lecture_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_accessible_lecture(lecture_id, user_id, db)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id, ChatMessage.lecture_id == lecture_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in messages]


@router.post("/{lecture_id}/messages", status_code=201)
async def save_message(
    lecture_id: uuid.UUID,
    body: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_accessible_lecture(lecture_id, user_id, db)
    role = body.get("role")
    if "content" not in body:
        raise HTTPException(status_code=422, detail="'content' field is required")
    content = body["content"]
    if role not in ("user", "assistant"):
        raise HTTPException(status_code=422, detail="role must be 'user' or 'assistant'")

    msg = ChatMessage(user_id=user_id, lecture_id=lecture_id, role=role, content=content)
    db.add(msg)
    await db.commit()
    return {"ok": True}


@router.delete("/{lecture_id}/history")
async def clear_history(
    lecture_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_accessible_lecture(lecture_id, user_id, db)
    await db.execute(
        delete(ChatMessage).where(
            ChatMessage.user_id == user_id,
            ChatMessage.lecture_id == lecture_id,
        )
    )
    await db.commit()
    return {"ok": True}
