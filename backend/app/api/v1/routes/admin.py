from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep
from app.schemas.admin import (
    AdminClaimItem,
    AdminClaimListResponse,
    AdminClaimReviewRequest,
    AdminClaimReviewResponse,
)
from app.services.admin import AdminService, classify_risk
from app.services.farms import FarmService
from app.utils.domain_helpers import extent_to_polygon_lat_lon

router = APIRouter(prefix="/admin", tags=["admin"])


def _to_admin_item(claim) -> AdminClaimItem:
    farm = claim.farm_profile
    extent = None
    polygon = None
    owner_names: list[str] = []
    area_values: list[str] = []
    screenshot_data_url = None
    if farm is not None:
        extent = [
            float(farm.extent_min_x),
            float(farm.extent_min_y),
            float(farm.extent_max_x),
            float(farm.extent_max_y),
        ]
        polygon = farm.extent_polygon_json or extent_to_polygon_lat_lon(extent)
        owner_names = farm.owner_names_json or []
        area_values = farm.area_values_json or []
        screenshot_data_url = FarmService.screenshot_to_data_url(farm.screenshot_path)

    latest_analysis = claim.analysis_runs[0] if claim.analysis_runs else None
    latest_damage = None
    latest_ai_prob = None
    risk_label = None
    if latest_analysis and latest_analysis.metrics:
        latest_damage = float(latest_analysis.metrics.damage_percentage)
        risk_label = classify_risk(latest_damage)
    if latest_analysis and latest_analysis.ai_prediction:
        latest_ai_prob = float(latest_analysis.ai_prediction.damage_probability)

    return AdminClaimItem(
        claim_id=claim.id,
        farm_profile_id=claim.farm_profile_id,
        farmer_name=claim.farmer_name,
        crop_type=claim.crop_type,
        damage_date=claim.damage_date,
        status=claim.status,
        admin_status=claim.admin_status,
        recommended_insurance_amount=float(claim.recommended_insurance_amount) if claim.recommended_insurance_amount else None,
        reviewed_by=claim.reviewed_by,
        reviewed_at=claim.reviewed_at,
        pmfby_reference_url=claim.pmfby_reference_url,
        extent=extent,
        polygon=polygon,
        owner_names=owner_names,
        area_values=area_values,
        screenshot_data_url=screenshot_data_url,
        latest_damage_percentage=latest_damage,
        latest_ai_damage_probability=latest_ai_prob,
        latest_risk_label=risk_label,
    )


@router.get("/claims", response_model=AdminClaimListResponse)
async def list_admin_claims(
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    admin_status: str | None = Query(default=None),
    session: AsyncSession = Depends(db_session_dep),
) -> AdminClaimListResponse:
    service = AdminService(session)
    claims = await service.list_claims(limit=limit, offset=offset, admin_status=admin_status)
    return AdminClaimListResponse(items=[_to_admin_item(item) for item in claims], limit=limit, offset=offset)


@router.patch("/claims/{claim_id}/review", response_model=AdminClaimReviewResponse)
async def review_claim(
    claim_id: int,
    payload: AdminClaimReviewRequest,
    session: AsyncSession = Depends(db_session_dep),
) -> AdminClaimReviewResponse:
    service = AdminService(session)
    claim = await service.review_claim(claim_id=claim_id, payload=payload)
    return AdminClaimReviewResponse(
        claim_id=claim.id,
        admin_status=claim.admin_status,
        reviewed_by=claim.reviewed_by or payload.reviewed_by,
        admin_notes=claim.admin_notes,
        recommended_insurance_amount=float(claim.recommended_insurance_amount) if claim.recommended_insurance_amount else None,
        pmfby_reference_url=claim.pmfby_reference_url,
        reviewed_at=claim.reviewed_at,
    )
