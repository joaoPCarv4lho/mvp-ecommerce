import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app, lifespan


@pytest.fixture
async def client():
    async with lifespan(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            yield c
