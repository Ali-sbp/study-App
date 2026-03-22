import pytest

@pytest.mark.asyncio
async def test_upsert_user_creates_new(client, db):
    response = await client.post("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["clerk_id"] == "user_test123"
    assert data["plan"] == "free"

@pytest.mark.asyncio
async def test_upsert_user_idempotent(client, db):
    await client.post("/users/me")
    response = await client.post("/users/me")
    assert response.status_code == 200
    assert response.json()["clerk_id"] == "user_test123"
