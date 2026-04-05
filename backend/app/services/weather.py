from __future__ import annotations

from datetime import datetime, timedelta, timezone


class WeatherServiceAdapter:
    async def current(self, *, location: str) -> dict[str, object]:
        return {
            "location": location,
            "temperature_c": 29.2,
            "condition": "Partly cloudy",
            "humidity_percent": 62,
            "wind_kph": 13.4,
            "observed_at": datetime.now(tz=timezone.utc),
        }

    async def forecast(self, *, location: str, days: int) -> dict[str, object]:
        forecast_days: list[dict[str, object]] = []
        for offset in range(days):
            day = datetime.now(tz=timezone.utc).date() + timedelta(days=offset)
            forecast_days.append(
                {
                    "date": day.isoformat(),
                    "min_temp_c": 22.0 + (offset * 0.2),
                    "max_temp_c": 31.0 + (offset * 0.3),
                    "condition": "Partly cloudy" if offset % 2 == 0 else "Clear",
                }
            )
        return {"location": location, "days": forecast_days}

    async def alerts(self, *, location: str) -> dict[str, object]:
        return {
            "location": location,
            "alerts": [
                {
                    "title": "Heat advisory",
                    "severity": "moderate",
                    "description": "High daytime temperatures expected. Increase irrigation checks.",
                }
            ],
        }
