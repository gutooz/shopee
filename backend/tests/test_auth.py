import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_seller(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "name": "Seller One",
        "email": "seller_one@test.com",
        "password": "password123",
        "role": "seller",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == "seller"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "name": "Dup User",
        "email": "dup@test.com",
        "password": "password123",
        "role": "seller",
    }
    await client.post("/api/v1/auth/register", json=payload)
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "name": "Login User",
        "email": "login@test.com",
        "password": "password123",
        "role": "seller",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "login@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "name": "Wrong Pass User",
        "email": "wrongpass@test.com",
        "password": "correctpassword",
        "role": "seller",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "wrongpass@test.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, seller_headers: dict):
    resp = await client.get("/api/v1/auth/me", headers=seller_headers)
    assert resp.status_code == 200
    assert "email" in resp.json()


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Refresh User",
        "email": "refresh@test.com",
        "password": "password123",
        "role": "seller",
    })
    refresh_token = reg.json()["refresh_token"]
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_invalid_token(client: AsyncClient):
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert resp.status_code == 401
