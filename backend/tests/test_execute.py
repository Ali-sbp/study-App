import pytest
from unittest.mock import patch, AsyncMock, MagicMock

@pytest.mark.asyncio
async def test_execute_returns_output(client):
    # Judge0 with wait=true returns result directly in the POST response
    mock_result = {
        "stdout": "[1,2,3]\n",
        "stderr": None,
        "compile_output": None,
        "status": {"description": "Accepted"},
    }
    with patch("app.routers.execute.get_settings") as mock_settings, \
         patch("app.routers.execute.httpx.AsyncClient") as MockClient:
        mock_settings.return_value.judge0_api_url = "https://judge0-ce.p.rapidapi.com"
        mock_settings.return_value.judge0_api_key = "test-key"

        mock_instance = AsyncMock()
        MockClient.return_value.__aenter__.return_value = mock_instance
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_response = MagicMock()
        mock_response.json.return_value = mock_result
        mock_instance.post = AsyncMock(return_value=mock_response)

        response = await client.post(
            "/execute",
            json={"code": "main = print [1,2,3]", "language_id": 12},
        )
    assert response.status_code == 200
    data = response.json()
    assert "stdout" in data

@pytest.mark.asyncio
async def test_stripe_webhook_stub(client):
    response = await client.post("/webhooks/stripe", content=b"{}")
    assert response.status_code == 200
