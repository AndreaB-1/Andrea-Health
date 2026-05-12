import pytest
from httpx import AsyncClient


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post("/api/auth/login", json={"username": "testuser", "password": "testpass"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.mark.asyncio
async def test_stats_empty(client: AsyncClient):
    headers = await _auth_header(client)
    resp = await client.get("/api/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["tracked_days"] == 0
    assert data["avg_calories"] == 0


@pytest.mark.asyncio
async def test_stats_with_meals(client: AsyncClient):
    headers = await _auth_header(client)
    await client.post("/api/entries", json={
        "raw_text": "Pasta", "type": "meal", "calories": 500, "protein": 20, "carbs": 80, "fat": 5
    }, headers=headers)
    resp = await client.get("/api/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["tracked_days"] >= 1


@pytest.mark.asyncio
async def test_daily_stats(client: AsyncClient):
    headers = await _auth_header(client)
    await client.post("/api/entries", json={"raw_text": "Colazione", "type": "meal", "calories": 400}, headers=headers)
    resp = await client.get("/api/stats/daily", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
