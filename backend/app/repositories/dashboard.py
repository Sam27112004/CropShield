from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Claim, Decision, IndexMetric


class DashboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def summary(self) -> dict[str, float | int]:
        total_stmt = select(func.count(Claim.id))
        approved_stmt = select(func.count(Claim.id)).where(Claim.admin_status == "approved")
        avg_damage_stmt = select(func.avg(IndexMetric.damage_percentage))
        avg_decision_conf_stmt = select(func.avg(Decision.confidence))

        total = (await self.session.execute(total_stmt)).scalar_one() or 0
        approved = (await self.session.execute(approved_stmt)).scalar_one() or 0
        avg_damage = (await self.session.execute(avg_damage_stmt)).scalar_one()
        avg_conf = (await self.session.execute(avg_decision_conf_stmt)).scalar_one()
        return {
            "total_claims": int(total),
            "approved_claims": int(approved),
            "average_damage_percentage": float(avg_damage or 0.0),
            "average_decision_confidence": float(avg_conf or 0.0),
        }
