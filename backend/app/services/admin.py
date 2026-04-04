from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.claims import ClaimRepository
from app.schemas.admin import AdminClaimReviewRequest


def classify_risk(damage_percentage: float) -> str:
    if damage_percentage >= 40.0:
        return "High possible crop damage"
    if damage_percentage >= 20.0:
        return "Moderate possible crop damage"
    return "Low possible crop damage"


class AdminService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.claims = ClaimRepository(session)

    async def list_claims(self, *, limit: int, offset: int, admin_status: str | None):
        return await self.claims.list_for_admin(limit=limit, offset=offset, admin_status=admin_status)

    async def review_claim(self, *, claim_id: int, payload: AdminClaimReviewRequest):
        claim = await self.claims.get_by_id(claim_id)
        if claim is None:
            raise NotFoundError(f"Claim '{claim_id}' was not found.")

        claim.admin_status = payload.admin_status
        claim.reviewed_by = payload.reviewed_by
        claim.admin_notes = payload.admin_notes
        claim.recommended_insurance_amount = payload.recommended_insurance_amount
        claim.reviewed_at = datetime.now(tz=timezone.utc)

        if payload.admin_status == "approved":
            claim.status = "approved_by_admin"
        elif payload.admin_status == "rejected":
            claim.status = "rejected_by_admin"
        elif payload.admin_status == "needs_more_info":
            claim.status = "needs_more_info"
        else:
            claim.status = "pending_admin_review"

        await self.session.commit()
        await self.session.refresh(claim)
        return claim
