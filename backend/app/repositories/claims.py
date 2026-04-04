from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import AnalysisRun, Claim


class ClaimRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        farm_profile_id: int | None,
        farmer_name: str,
        crop_type: str,
        farm_area_hectares: float,
        latitude: float,
        longitude: float,
        damage_date,
    ) -> Claim:
        claim = Claim(
            farm_profile_id=farm_profile_id,
            farmer_name=farmer_name,
            crop_type=crop_type,
            farm_area_hectares=farm_area_hectares,
            latitude=latitude,
            longitude=longitude,
            damage_date=damage_date,
            status="created",
            admin_status="pending_review",
        )
        self.session.add(claim)
        await self.session.flush()
        return claim

    async def list_claims(self, *, limit: int, offset: int) -> list[Claim]:
        stmt: Select[tuple[Claim]] = (
            select(Claim)
            .options(selectinload(Claim.farm_profile))
            .order_by(Claim.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, claim_id: int) -> Claim | None:
        stmt = (
            select(Claim)
            .where(Claim.id == claim_id)
            .options(
                selectinload(Claim.analysis_runs).selectinload(AnalysisRun.metrics),
                selectinload(Claim.analysis_runs).selectinload(AnalysisRun.ai_prediction),
                selectinload(Claim.analysis_runs).selectinload(AnalysisRun.decisions),
                selectinload(Claim.decisions),
                selectinload(Claim.reports),
                selectinload(Claim.farm_profile),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_status(self, claim: Claim, status: str) -> Claim:
        claim.status = status
        await self.session.flush()
        return claim

    async def list_for_admin(
        self,
        *,
        limit: int,
        offset: int,
        admin_status: str | None = None,
    ) -> list[Claim]:
        stmt: Select[tuple[Claim]] = (
            select(Claim)
            .options(
                selectinload(Claim.farm_profile),
                selectinload(Claim.analysis_runs).selectinload(AnalysisRun.metrics),
                selectinload(Claim.analysis_runs).selectinload(AnalysisRun.ai_prediction),
            )
            .order_by(Claim.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if admin_status:
            stmt = stmt.where(Claim.admin_status == admin_status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
