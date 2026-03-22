import pytest

@pytest.mark.asyncio
async def test_list_lectures_empty(client, db):
    response = await client.get("/lectures")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_upload_lecture(client, db):
    await client.post("/users/me")
    response = await client.post(
        "/lectures",
        data={"title": "Lecture 1"},
        files={"file": ("lecture1.hs", b"module Lecture1 where\n", "text/plain")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Lecture 1"
    assert data["filename"] == "lecture1.hs"
    assert data["is_default"] is False

@pytest.mark.asyncio
async def test_list_lectures_returns_user_uploads(client, db):
    await client.post("/users/me")
    await client.post(
        "/lectures",
        data={"title": "Lecture 1"},
        files={"file": ("lecture1.hs", b"module Lecture1 where\n", "text/plain")},
    )
    response = await client.get("/lectures")
    assert response.status_code == 200
    assert len(response.json()) == 1

@pytest.mark.asyncio
async def test_get_lecture_content(client, db):
    await client.post("/users/me")
    upload = await client.post(
        "/lectures",
        data={"title": "Lecture 1"},
        files={"file": ("lecture1.hs", b"module Lecture1 where\n", "text/plain")},
    )
    lecture_id = upload.json()["id"]
    response = await client.get(f"/lectures/{lecture_id}/content")
    assert response.status_code == 200
    assert response.json()["content"] == "module Lecture1 where\n"
