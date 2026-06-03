import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.database import db_instance
from app.config import settings


TEST_DB_NAME = "supplierhub_test"


@pytest_asyncio.fixture(scope="session")
async def test_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[TEST_DB_NAME]
    db_instance.client = client
    db_instance.db = db
    yield db
    await client.drop_database(TEST_DB_NAME)
    client.close()


@pytest_asyncio.fixture
async def client(test_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def seller_token(client):
    register_resp = await client.post("/api/v1/auth/register", json={
        "name": "Test Seller",
        "email": "seller@test.com",
        "password": "testpassword123",
        "role": "seller",
    })
    data = register_resp.json()
    return data["access_token"]


@pytest_asyncio.fixture
async def admin_token(client):
    register_resp = await client.post("/api/v1/auth/register", json={
        "name": "Test Admin",
        "email": "admin@test.com",
        "password": "testpassword123",
        "role": "admin",
    })
    data = register_resp.json()
    return data["access_token"]


@pytest.fixture
def seller_headers(seller_token):
    return {"Authorization": f"Bearer {seller_token}"}


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
