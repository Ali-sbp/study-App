import pytest

@pytest.mark.asyncio
async def test_get_history_empty(client, db):
    await client.post("/users/me")
    upload = await client.post(
        "/lectures",
        data={"title": "L1"},
        files={"file": ("l1.hs", b"x\n", "text/plain")},
    )
    lecture_id = upload.json()["id"]
    response = await client.get(f"/chat/{lecture_id}/history")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_save_and_get_history(client, db):
    await client.post("/users/me")
    upload = await client.post(
        "/lectures",
        data={"title": "L1"},
        files={"file": ("l1.hs", b"x\n", "text/plain")},
    )
    lecture_id = upload.json()["id"]

    await client.post(f"/chat/{lecture_id}/messages", json={"role": "user", "content": "Hello"})
    await client.post(f"/chat/{lecture_id}/messages", json={"role": "assistant", "content": "Hi!"})

    response = await client.get(f"/chat/{lecture_id}/history")
    assert response.status_code == 200
    messages = response.json()
    assert len(messages) == 2
    roles = [m["role"] for m in messages]
    assert "user" in roles
    assert "assistant" in roles
    # Verify ordering: user message was sent first
    assert roles.index("user") < roles.index("assistant")

@pytest.mark.asyncio
async def test_clear_history(client, db):
    await client.post("/users/me")
    upload = await client.post(
        "/lectures",
        data={"title": "L1"},
        files={"file": ("l1.hs", b"x\n", "text/plain")},
    )
    lecture_id = upload.json()["id"]
    await client.post(f"/chat/{lecture_id}/messages", json={"role": "user", "content": "Hello"})
    await client.delete(f"/chat/{lecture_id}/history")
    response = await client.get(f"/chat/{lecture_id}/history")
    assert response.json() == []
