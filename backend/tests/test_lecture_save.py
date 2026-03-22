import pytest

@pytest.mark.asyncio
async def test_save_lecture_content(client, db):
    await client.post("/users/me")
    upload = await client.post(
        "/lectures",
        data={"title": "Lecture 1"},
        files={"file": ("l1.hs", b"module L1 where\n", "text/plain")},
    )
    lecture_id = upload.json()["id"]

    response = await client.put(
        f"/lectures/{lecture_id}/content",
        json={"content": "module L1 where\n-- my note\n"},
    )
    assert response.status_code == 200
    assert response.json()["is_user_copy"] is True

@pytest.mark.asyncio
async def test_save_then_get_returns_user_copy(client, db):
    await client.post("/users/me")
    upload = await client.post(
        "/lectures",
        data={"title": "Lecture 1"},
        files={"file": ("l1.hs", b"original\n", "text/plain")},
    )
    lecture_id = upload.json()["id"]

    await client.put(
        f"/lectures/{lecture_id}/content",
        json={"content": "annotated\n"},
    )

    get = await client.get(f"/lectures/{lecture_id}/content")
    assert get.json()["content"] == "annotated\n"
    assert get.json()["is_user_copy"] is True

@pytest.mark.asyncio
async def test_cannot_save_inaccessible_lecture(client, db):
    """User cannot annotate a lecture they don't own and that isn't default."""
    # The test client always authenticates as MOCK_USER_ID.
    # We insert a lecture directly owned by a different user to simulate
    # a lecture not accessible to the current user.
    from app.models.lecture import Lecture
    from app.models.user import User
    from sqlalchemy import insert

    # First create the other user
    other_user = User(clerk_id="other_user_clerk_id")
    db.add(other_user)
    await db.commit()

    other_lecture = Lecture(
        title="Other",
        filename="other.hs",
        original_content="x\n",
        is_default=False,
        created_by="other_user_clerk_id",
    )
    db.add(other_lecture)
    await db.commit()
    await db.refresh(other_lecture)

    response = await client.put(
        f"/lectures/{other_lecture.id}/content",
        json={"content": "hacked\n"},
    )
    assert response.status_code == 404
