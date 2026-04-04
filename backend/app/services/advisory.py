from __future__ import annotations


class AdvisoryServiceAdapter:
    async def chat(self, *, message: str, language: str) -> dict[str, object]:
        normalized_language = language.lower().strip() or "en"
        reply = (
            "Please monitor moisture levels and inspect leaf color before the next irrigation cycle. "
            "If you share crop type and recent weather, I can provide a tighter recommendation."
        )
        return {
            "provider": "fallback",
            "reply": reply if normalized_language == "en" else reply,
            "fallback_used": True,
        }

    async def predict_crop(
        self,
        *,
        crop_type: str,
        soil_type: str,
        rainfall_mm: float,
        temperature_c: float,
    ) -> dict[str, object]:
        soil_factor = 1.05 if soil_type.lower() in {"loam", "clay loam"} else 0.92
        rainfall_factor = min(max(rainfall_mm / 900.0, 0.65), 1.25)
        temp_factor = 1.0 - (abs(temperature_c - 28.0) * 0.01)
        expected_yield = max(1.1, 3.8 * soil_factor * rainfall_factor * max(temp_factor, 0.75))

        if expected_yield >= 4.0:
            risk = "low"
            recommendation = "Maintain current crop schedule and continue preventive scouting."
        elif expected_yield >= 2.8:
            risk = "moderate"
            recommendation = "Monitor field moisture and nutrient schedule weekly to avoid stress dips."
        else:
            risk = "high"
            recommendation = "Use contingency irrigation and review crop protection plan immediately."

        return {
            "expected_yield_tph": round(expected_yield, 2),
            "risk_level": risk,
            "recommendation": f"For {crop_type}: {recommendation}",
        }
