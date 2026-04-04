from __future__ import annotations

import asyncio
import json
from typing import Any

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.repositories.dashboard import DashboardRepository


class DashboardService:
    CACHE_KEY = "dashboard:summary:v1"

    def __init__(self, session: AsyncSession, redis_client: Redis | None = None) -> None:
        self.session = session
        self.redis = redis_client
        self.repo = DashboardRepository(session)
        self.settings = get_settings()

    async def get_summary(self) -> dict[str, Any]:
        if self.redis is not None:
            try:
                cached = await asyncio.wait_for(self.redis.get(self.CACHE_KEY), timeout=2)
                if cached:
                    return json.loads(cached.decode("utf-8"))
            except Exception:
                pass

        summary = await self.repo.summary()
        if self.redis is not None:
            ttl = self.settings.dashboard_cache_ttl_seconds
            try:
                await asyncio.wait_for(
                    self.redis.setex(self.CACHE_KEY, ttl, json.dumps(summary).encode("utf-8")),
                    timeout=2,
                )
            except Exception:
                pass
        return summary

    async def invalidate_summary_cache(self) -> None:
        if self.redis is not None:
            try:
                await asyncio.wait_for(self.redis.delete(self.CACHE_KEY), timeout=2)
            except Exception:
                pass
