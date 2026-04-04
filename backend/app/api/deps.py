from __future__ import annotations

from collections.abc import AsyncGenerator

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.utils.cache import get_redis_client


async def db_session_dep() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


async def redis_dep() -> Redis:
    return get_redis_client()
