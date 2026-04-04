from __future__ import annotations

from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep, redis_dep
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_summary(
    session: AsyncSession = Depends(db_session_dep),
    redis_client: Redis = Depends(redis_dep),
) -> DashboardSummaryResponse:
    service = DashboardService(session, redis_client=redis_client)
    summary = await service.get_summary()
    return DashboardSummaryResponse(**summary)
