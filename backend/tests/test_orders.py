import pytest
from httpx import AsyncClient


async def setup_supplier_and_product(client, headers):
    supplier = await client.post(
        "/api/v1/suppliers/",
        json={"name": "Supplier For Orders"},
        headers=headers,
    )
    supplier_id = supplier.json()["id"]

    product = await client.post(
        "/api/v1/products/",
        json={
            "supplier_id": supplier_id,
            "name": "Product A",
            "price": 50.0,
        },
        headers=headers,
    )
    product_id = product.json()["id"]
    return supplier_id, product_id


@pytest.mark.asyncio
async def test_create_order(client: AsyncClient, seller_headers: dict):
    supplier_id, product_id = await setup_supplier_and_product(client, seller_headers)

    resp = await client.post(
        "/api/v1/orders/",
        json={
            "supplier_id": supplier_id,
            "items": [{"product_id": product_id, "quantity": 2, "price": 50.0}],
        },
        headers=seller_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["total_value"] == 100.0


@pytest.mark.asyncio
async def test_billing_created_with_order(client: AsyncClient, seller_headers: dict):
    supplier_id, product_id = await setup_supplier_and_product(client, seller_headers)

    await client.post(
        "/api/v1/orders/",
        json={
            "supplier_id": supplier_id,
            "items": [
                {"product_id": product_id, "quantity": 3, "price": 50.0},
            ],
        },
        headers=seller_headers,
    )

    resp = await client.get("/api/v1/billing/", headers=seller_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    # 3 items × R$2 = R$6
    fees = [b["fee_value"] for b in data["items"]]
    assert any(f == 6.0 for f in fees)


@pytest.mark.asyncio
async def test_list_orders(client: AsyncClient, seller_headers: dict):
    resp = await client.get("/api/v1/orders/", headers=seller_headers)
    assert resp.status_code == 200
    assert "items" in resp.json()


@pytest.mark.asyncio
async def test_update_tracking(client: AsyncClient, seller_headers: dict):
    supplier_id, product_id = await setup_supplier_and_product(client, seller_headers)

    order_resp = await client.post(
        "/api/v1/orders/",
        json={
            "supplier_id": supplier_id,
            "items": [{"product_id": product_id, "quantity": 1, "price": 30.0}],
        },
        headers=seller_headers,
    )
    order_id = order_resp.json()["id"]

    resp = await client.patch(
        f"/api/v1/orders/{order_id}/tracking",
        json={"tracking_code": "BR123456789BR"},
        headers=seller_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["tracking_code"] == "BR123456789BR"
    assert data["status"] == "shipped"


@pytest.mark.asyncio
async def test_billing_fee_calculation(client: AsyncClient, seller_headers: dict):
    supplier_id, product_id = await setup_supplier_and_product(client, seller_headers)

    # 5 items total → R$10 fee
    await client.post(
        "/api/v1/orders/",
        json={
            "supplier_id": supplier_id,
            "items": [
                {"product_id": product_id, "quantity": 2, "price": 10.0},
                {"product_id": product_id, "quantity": 3, "price": 20.0},
            ],
        },
        headers=seller_headers,
    )

    resp = await client.get("/api/v1/billing/", headers=seller_headers)
    data = resp.json()
    order_billing = next(
        (b for b in data["items"] if b["quantity_items"] == 5), None
    )
    assert order_billing is not None
    assert order_billing["fee_value"] == 10.0
