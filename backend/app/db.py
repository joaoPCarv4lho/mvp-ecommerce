import os
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://mateus:mateus@localhost:5432/mateusgames")
# SQLite in-memory (tests) must share one connection, otherwise each connection sees an empty DB.
engine = (create_async_engine(DATABASE_URL, poolclass=StaticPool, connect_args={"check_same_thread": False})
          if DATABASE_URL.startswith("sqlite") else create_async_engine(DATABASE_URL))
Session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
