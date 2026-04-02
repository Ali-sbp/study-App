import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import get_current_user
from app.models.file import UserFile
from app.models.lecture import Lecture
from sqlalchemy import or_

router = APIRouter(prefix="/lectures", tags=["files"])


def _file_dict(f: UserFile, file_type: str | None = None) -> dict:
    return {
        "id": str(f.id),
        "name": f.name,
        "content": f.content,
        "source_id": str(f.source_id) if f.source_id else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
        "file_type": file_type,
    }


async def _check_lecture_access(lecture_id: uuid.UUID, user_id: str, db: AsyncSession):
    result = await db.execute(
        select(Lecture).where(
            Lecture.id == lecture_id,
            or_(Lecture.is_default == True, Lecture.created_by == user_id),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Lecture not found")


# IMPORTANT: literal-path routes must come before /{lecture_id} param routes
@router.get("/my-files")
async def list_my_files(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all custom files (not forks) this user has created across any lecture."""
    result = await db.execute(
        select(UserFile)
        .where(UserFile.user_id == user_id, UserFile.source_id.is_(None))
        .order_by(UserFile.updated_at.desc())
    )
    return [_file_dict(f) for f in result.scalars().all()]


@router.delete("/my-files/{file_id}")
async def delete_my_file(
    file_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete any user-owned file directly by ID (no lecture_id needed)."""
    result = await db.execute(
        select(UserFile).where(UserFile.id == file_id, UserFile.user_id == user_id)
    )
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    await db.delete(f)
    await db.commit()
    return {"ok": True}


@router.get("/my-copies")
async def list_personal_copies(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all personal forks this user has made of any admin file, with file_type from source."""
    result = await db.execute(
        select(UserFile, Lecture.file_type)
        .join(Lecture, UserFile.source_id == Lecture.id, isouter=True)
        .where(UserFile.user_id == user_id, UserFile.source_id.isnot(None))
        .order_by(UserFile.updated_at.desc())
    )
    return [_file_dict(f, file_type) for f, file_type in result.all()]


@router.post("/{lecture_id}/fork", status_code=200)
async def fork_lecture(
    lecture_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Idempotent: create a personal copy of a lecture/practice file, or return existing."""
    # Return existing fork if already created
    existing = await db.execute(
        select(UserFile).where(
            UserFile.user_id == user_id,
            UserFile.source_id == lecture_id,
        )
    )
    existing = existing.scalar_one_or_none()
    if existing:
        return _file_dict(existing)

    # Fetch source content
    lecture = await db.get(Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    fork = UserFile(
        user_id=user_id,
        lecture_id=lecture_id,
        source_id=lecture_id,
        name=lecture.title,
        content=lecture.original_content or "",
    )
    db.add(fork)
    await db.commit()
    await db.refresh(fork)
    return _file_dict(fork)


@router.get("/{lecture_id}/files")
async def list_files(
    lecture_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_lecture_access(lecture_id, user_id, db)
    result = await db.execute(
        select(UserFile)
        .where(
            UserFile.user_id == user_id,
            UserFile.lecture_id == lecture_id,
            UserFile.source_id.is_(None),  # exclude personal forks
        )
        .order_by(UserFile.created_at)
    )
    return [_file_dict(f) for f in result.scalars().all()]


@router.post("/{lecture_id}/files", status_code=201)
async def create_file(
    lecture_id: uuid.UUID,
    body: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_lecture_access(lecture_id, user_id, db)
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=422, detail="name is required")
    if len(name) > 100:
        raise HTTPException(status_code=422, detail="name too long (max 100)")

    f = UserFile(user_id=user_id, lecture_id=lecture_id, name=name, content=f"-- {name}\n")
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return _file_dict(f)


@router.put("/{lecture_id}/files/{file_id}")
async def update_file(
    lecture_id: uuid.UUID,
    file_id: uuid.UUID,
    body: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserFile).where(UserFile.id == file_id, UserFile.user_id == user_id)
    )
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    if "content" in body:
        f.content = body["content"]
    if "name" in body:
        name = (body["name"] or "").strip()
        if name:
            f.name = name
    await db.commit()
    await db.refresh(f)
    return _file_dict(f)


@router.delete("/{lecture_id}/files/{file_id}")
async def delete_file(
    lecture_id: uuid.UUID,
    file_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserFile).where(UserFile.id == file_id, UserFile.user_id == user_id)
    )
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    await db.delete(f)
    await db.commit()
    return {"ok": True}
