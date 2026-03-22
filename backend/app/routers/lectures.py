import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.auth import get_current_user
from app.models.lecture import Lecture, UserLecture
from app.config import get_settings

router = APIRouter(prefix="/lectures", tags=["lectures"])


@router.get("")
async def list_lectures(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lecture).where(
            or_(Lecture.is_default == True, Lecture.created_by == user_id)
        )
    )
    lectures = result.scalars().all()
    return [
        {
            "id": str(l.id),
            "title": l.title,
            "filename": l.filename,
            "is_default": l.is_default,
            "created_at": l.created_at.isoformat(),
        }
        for l in lectures
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_lecture(
    title: str = Form(...),
    file: UploadFile = File(...),
    is_default: bool = Form(False),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    effective_is_default = is_default and user_id in settings.admin_ids

    raw = await file.read()
    try:
        decoded_content = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=422, detail="File must be valid UTF-8 text")
    lecture = Lecture(
        title=title,
        filename=file.filename,
        original_content=decoded_content,
        is_default=effective_is_default,
        created_by=user_id,
    )
    db.add(lecture)
    await db.commit()
    await db.refresh(lecture)
    return {
        "id": str(lecture.id),
        "title": lecture.title,
        "filename": lecture.filename,
        "is_default": lecture.is_default,
    }


@router.get("/{lecture_id}/content")
async def get_lecture_content(
    lecture_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lecture).where(
            Lecture.id == lecture_id,
            or_(Lecture.is_default == True, Lecture.created_by == user_id),
        )
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    user_copy_result = await db.execute(
        select(UserLecture).where(
            UserLecture.user_id == user_id,
            UserLecture.lecture_id == lecture_id,
        )
    )
    user_lecture = user_copy_result.scalar_one_or_none()
    content = user_lecture.content if user_lecture else lecture.original_content

    return {
        "id": str(lecture.id),
        "title": lecture.title,
        "filename": lecture.filename,
        "content": content,
        "is_user_copy": user_lecture is not None,
    }
