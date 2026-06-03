import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_seller_dashboard(client: AsyncClient, seller_headers: dict):
    resp = await client.get("/api/v1/dashboard/seller", headers=seller_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "kpis" in data
    assert "chart_orders_30d" in data
    kpis = data["kpis"]
    assert "orders_today" in kpis
    assert "orders_month" in kpis
    assert "suppliers_active" in kpis
    assert "products_active" in kpis
    assert "fees_month" in kpis


@pytest.mark.asyncio
async def test_admin_dashboard(client: AsyncClient, admin_headers: dict):
    resp = await client.get("/api/v1/dashboard/admin", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "kpis" in data
    kpis = data["kpis"]
    assert "total_sellers" in kpis
    assert "total_orders" in kpis
    assert "total_revenue" in kpis


@pytest.mark.asyncio
async def test_seller_cannot_access_admin_dashboard(client: AsyncClient, seller_headers: dict):
    resp = await client.get("/api/v1/dashboard/admin", headers=seller_headers)
    assert resp.status_code == 403
