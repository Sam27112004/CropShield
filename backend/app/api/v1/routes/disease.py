from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.disease import DiseaseDetectRequest, DiseaseDetectResponse
from app.services.disease import DiseaseServiceAdapter

router = APIRouter(prefix="/disease", tags=["disease"])


@router.post("/detect", response_model=DiseaseDetectResponse)
async def detect_disease(
    payload: DiseaseDetectRequest,
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> DiseaseDetectResponse:
    if not settings.enable_disease_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Disease module disabled")

    service = DiseaseServiceAdapter()
    response = await service.detect(image_name=payload.image_name, crop_type=payload.crop_type)
    return DiseaseDetectResponse(**response)
