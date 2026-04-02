import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.auth import get_current_user
from app.models.lecture import Lecture, UserLecture
from app.config import get_settings

router = APIRouter(prefix="/lectures", tags=["lectures"])


@router.get("")
async def list_lectures(
    file_type: str | None = None,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Lecture).where(
        or_(Lecture.is_default == True, Lecture.created_by == user_id)
    )
    if file_type in ("lecture", "practice"):
        query = query.where(Lecture.file_type == file_type)
    result = await db.execute(query)
    lectures = result.scalars().all()
    return [
        {
            "id": str(l.id),
            "title": l.title,
            "filename": l.filename,
            "file_type": l.file_type,
            "is_default": l.is_default,
            "created_at": l.created_at.isoformat(),
        }
        for l in lectures
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_lecture(
    title: str = Form(...),
    file: UploadFile = File(...),
    file_type: str = Form("lecture"),
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
    if file_type not in ("lecture", "practice"):
        raise HTTPException(status_code=422, detail="file_type must be 'lecture' or 'practice'")

    lecture = Lecture(
        title=title,
        filename=file.filename,
        file_type=file_type,
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


@router.delete("/{lecture_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lecture(
    lecture_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    if user_id not in settings.admin_ids:
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    await db.delete(lecture)
    await db.commit()


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

    practice_content = user_lecture.practice_content if user_lecture else None

    return {
        "id": str(lecture.id),
        "title": lecture.title,
        "filename": lecture.filename,
        "content": content,
        "practice_content": practice_content,
        "is_user_copy": user_lecture is not None,
    }


@router.put("/{lecture_id}/content")
async def save_lecture_content(
    lecture_id: uuid.UUID,
    body: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify user has access
    result = await db.execute(
        select(Lecture).where(
            Lecture.id == lecture_id,
            or_(Lecture.is_default == True, Lecture.created_by == user_id),
        )
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    if "content" not in body:
        raise HTTPException(status_code=422, detail="'content' field is required")
    content = body["content"]

    # Upsert user_lectures row
    user_copy_result = await db.execute(
        select(UserLecture).where(
            UserLecture.user_id == user_id,
            UserLecture.lecture_id == lecture_id,
        )
    )
    user_lecture = user_copy_result.scalar_one_or_none()
    if user_lecture:
        user_lecture.content = content
        await db.commit()
    else:
        try:
            user_lecture = UserLecture(
                user_id=user_id,
                lecture_id=lecture_id,
                content=content,
            )
            db.add(user_lecture)
            await db.commit()
        except IntegrityError:
            await db.rollback()
            user_copy_result2 = await db.execute(
                select(UserLecture).where(
                    UserLecture.user_id == user_id,
                    UserLecture.lecture_id == lecture_id,
                )
            )
            user_lecture = user_copy_result2.scalar_one()
            user_lecture.content = content
            await db.commit()
    return {"is_user_copy": True}


@router.put("/{lecture_id}/practice")
async def save_practice_content(
    lecture_id: uuid.UUID,
    body: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lecture).where(
            Lecture.id == lecture_id,
            or_(Lecture.is_default == True, Lecture.created_by == user_id),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Lecture not found")

    content = body.get("content", "")

    user_copy_result = await db.execute(
        select(UserLecture).where(
            UserLecture.user_id == user_id,
            UserLecture.lecture_id == lecture_id,
        )
    )
    user_lecture = user_copy_result.scalar_one_or_none()
    if user_lecture:
        user_lecture.practice_content = content
        await db.commit()
    else:
        from sqlalchemy.exc import IntegrityError
        try:
            user_lecture = UserLecture(
                user_id=user_id,
                lecture_id=lecture_id,
                content="",
                practice_content=content,
            )
            db.add(user_lecture)
            await db.commit()
        except IntegrityError:
            await db.rollback()
            res2 = await db.execute(
                select(UserLecture).where(
                    UserLecture.user_id == user_id,
                    UserLecture.lecture_id == lecture_id,
                )
            )
            ul = res2.scalar_one()
            ul.practice_content = content
            await db.commit()
    return {"ok": True}
