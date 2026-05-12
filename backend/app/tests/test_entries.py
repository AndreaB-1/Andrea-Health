import pytest
from httpx import AsyncClient


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post("/api/auth/login", json={"username": "testuser", "password": "testpass"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.mark.asyncio
async def test_create_entry(client: AsyncClient):
    headers = await _auth_header(client)
    resp = await client.post(
        "/api/entries",
        json={"raw_text": "Ho mangiato pasta al pomodoro", "type": "meal"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["raw_text"] == "Ho mangiato pasta al pomodoro"
    assert data["type"] == "meal"


@pytest.mark.asyncio
async def test_list_entries(client: AsyncClient):
    headers = await _auth_header(client)
    await client.post("/api/entries", json={"raw_text": "Colazione", "type": "meal"}, headers=headers)
    await client.post("/api/entries", json={"raw_text": "Pranzo", "type": "meal"}, headers=headers)
    resp = await client.get("/api/entries", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_delete_entry(client: AsyncClient):
    headers = await _auth_header(client)
    create = await client.post("/api/entries", json={"raw_text": "Test", "type": "note"}, headers=headers)
    entry_id = create.json()["id"]
    resp = await client.delete(f"/api/entries/{entry_id}", headers=headers)
    assert resp.status_code == 200
    list_resp = await client.get("/api/entries", headers=headers)
    assert len(list_resp.json()) == 0
