from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.schemas.advisory import AdvisoryChatRequest, AdvisoryChatResponse, CropPredictRequest, CropPredictResponse
from app.schemas.auth import AuthenticatedUser
from app.services.advisory import AdvisoryServiceAdapter

router = APIRouter(prefix="/advisory", tags=["advisory"])


@router.post("/chat", response_model=AdvisoryChatResponse)
async def chat_advisory(
    payload: AdvisoryChatRequest,
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AdvisoryChatResponse:
    if not settings.enable_advisory_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Advisory module disabled")
    service = AdvisoryServiceAdapter()
    response = await service.chat(message=payload.message, language=payload.language)
    return AdvisoryChatResponse(**response)


@router.post("/crop-predict", response_model=CropPredictResponse)
async def crop_predict(
    payload: CropPredictRequest,
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> CropPredictResponse:
    if not settings.enable_advisory_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Advisory module disabled")
    service = AdvisoryServiceAdapter()
    response = await service.predict_crop(
        crop_type=payload.crop_type,
        soil_type=payload.soil_type,
        rainfall_mm=payload.rainfall_mm,
        temperature_c=payload.temperature_c,
    )
    return CropPredictResponse(**response)
