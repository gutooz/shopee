import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_supplier(client: AsyncClient, seller_headers: dict):
    resp = await client.post(
        "/api/v1/suppliers/",
        json={
            "name": "Fornecedor A",
            "email": "fornecedor@test.com",
            "phone": "11999999999",
            "address": "Rua Teste 123",
        },
        headers=seller_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Fornecedor A"
    assert data["active"] is True


@pytest.mark.asyncio
async def test_list_suppliers(client: AsyncClient, seller_headers: dict):
    resp = await client.get("/api/v1/suppliers/", headers=seller_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_update_supplier(client: AsyncClient, seller_headers: dict):
    create_resp = await client.post(
        "/api/v1/suppliers/",
        json={"name": "Fornecedor B"},
        headers=seller_headers,
    )
    supplier_id = create_resp.json()["id"]

    resp = await client.put(
        f"/api/v1/suppliers/{supplier_id}",
        json={"name": "Fornecedor B Updated", "active": False},
        headers=seller_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Fornecedor B Updated"


@pytest.mark.asyncio
async def test_delete_supplier(client: AsyncClient, seller_headers: dict):
    create_resp = await client.post(
        "/api/v1/suppliers/",
        json={"name": "Fornecedor Delete"},
        headers=seller_headers,
    )
    supplier_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/v1/suppliers/{supplier_id}",
        headers=seller_headers,
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_supplier_isolation(client: AsyncClient):
    # Create two sellers
    s1 = await client.post("/api/v1/auth/register", json={
        "name": "Seller Iso 1", "email": "iso1@test.com",
        "password": "password123", "role": "seller",
    })
    s2 = await client.post("/api/v1/auth/register", json={
        "name": "Seller Iso 2", "email": "iso2@test.com",
        "password": "password123", "role": "seller",
    })
    headers1 = {"Authorization": f"Bearer {s1.json()['access_token']}"}
    headers2 = {"Authorization": f"Bearer {s2.json()['access_token']}"}

    # Seller 1 creates supplier
    create_resp = await client.post(
        "/api/v1/suppliers/",
        json={"name": "Seller1 Supplier"},
        headers=headers1,
    )
    supplier_id = create_resp.json()["id"]

    # Seller 2 tries to access it — should be forbidden
    resp = await client.get(
        f"/api/v1/suppliers/{supplier_id}",
        headers=headers2,
    )
    assert resp.status_code == 403
