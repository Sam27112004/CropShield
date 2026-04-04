from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.claims import ClaimRepository
from app.repositories.farms import FarmRepository
from app.schemas.claim import ClaimCreateRequest


class ClaimService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ClaimRepository(session)
        self.farms = FarmRepository(session)

    async def create_claim(self, payload: ClaimCreateRequest):
        farm_profile_id = payload.farm_profile_id
        farmer_name = payload.farmer_name
        area_hectares = payload.farm_area_hectares
        latitude = payload.latitude
        longitude = payload.longitude

        if farm_profile_id is not None:
            farm = await self.farms.get_by_id(farm_profile_id)
            if farm is None:
                raise NotFoundError(f"Farm profile '{farm_profile_id}' was not found.")
            farmer_name = farmer_name or farm.farmer_name
            area_hectares = float(farm.farm_area_hectares)
            latitude = float(farm.centroid_latitude)
            longitude = float(farm.centroid_longitude)

        claim = await self.repo.create(
            farm_profile_id=farm_profile_id,
            farmer_name=str(farmer_name),
            crop_type=payload.crop_type,
            farm_area_hectares=float(area_hectares),
            latitude=float(latitude),
            longitude=float(longitude),
            damage_date=payload.damage_date,
        )
        await self.session.commit()
        await self.session.refresh(claim)
        return claim

    async def list_claims(self, *, limit: int, offset: int):
        claims = await self.repo.list_claims(limit=limit, offset=offset)
        return claims

    async def get_claim_or_404(self, claim_id: int):
        claim = await self.repo.get_by_id(claim_id)
        if claim is None:
            raise NotFoundError(f"Claim '{claim_id}' was not found.")
        return claim
