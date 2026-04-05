from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.weather import WeatherAlertsResponse, WeatherCurrentResponse, WeatherForecastResponse
from app.services.weather import WeatherServiceAdapter

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=WeatherCurrentResponse)
async def get_current_weather(
    location: str = Query(default="Unknown"),
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> WeatherCurrentResponse:
    if not settings.enable_weather_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Weather module disabled")
    service = WeatherServiceAdapter()
    payload = await service.current(location=location)
    return WeatherCurrentResponse(**payload)


@router.get("/forecast", response_model=WeatherForecastResponse)
async def get_forecast_weather(
    location: str = Query(default="Unknown"),
    days: int = Query(default=5, ge=1, le=10),
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> WeatherForecastResponse:
    if not settings.enable_weather_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Weather module disabled")
    service = WeatherServiceAdapter()
    payload = await service.forecast(location=location, days=days)
    return WeatherForecastResponse(**payload)


@router.get("/alerts", response_model=WeatherAlertsResponse)
async def get_weather_alerts(
    location: str = Query(default="Unknown"),
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> WeatherAlertsResponse:
    if not settings.enable_weather_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Weather module disabled")
    service = WeatherServiceAdapter()
    payload = await service.alerts(location=location)
    return WeatherAlertsResponse(**payload)
