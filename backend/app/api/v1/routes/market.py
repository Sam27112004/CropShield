from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.market import CommodityListResponse, FinancialSummaryResponse, MandiDataResponse, TrendingCommoditiesResponse
from app.services.market import MarketServiceAdapter

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/commodities", response_model=CommodityListResponse)
async def get_commodities(
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> CommodityListResponse:
    if not settings.enable_market_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market module disabled")
    service = MarketServiceAdapter()
    payload = await service.commodities()
    return CommodityListResponse(**payload)


@router.get("/trending", response_model=TrendingCommoditiesResponse)
async def get_trending(
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> TrendingCommoditiesResponse:
    if not settings.enable_market_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market module disabled")
    service = MarketServiceAdapter()
    payload = await service.trending()
    return TrendingCommoditiesResponse(**payload)


@router.get("/mandi-data", response_model=MandiDataResponse)
async def get_mandi_data(
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> MandiDataResponse:
    if not settings.enable_market_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market module disabled")
    service = MarketServiceAdapter()
    payload = await service.mandi_data()
    return MandiDataResponse(**payload)


@router.get("/financial-summary", response_model=FinancialSummaryResponse)
async def get_financial_summary(
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> FinancialSummaryResponse:
    if not settings.enable_market_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market module disabled")
    service = MarketServiceAdapter()
    payload = await service.financial_summary()
    return FinancialSummaryResponse(**payload)
