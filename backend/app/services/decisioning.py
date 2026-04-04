from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class DecisionResult:
    decision: str
    confidence: float
    rationale: str


class DecisionService:
    def evaluate_claim(self, ndvi_drop: float, ai_damage_probability: float, damaged_area_percentage: float) -> DecisionResult:
        severe_signal = ndvi_drop > 30.0 and ai_damage_probability > 0.6
        partial_signal = 10.0 <= ndvi_drop <= 30.0 or 25.0 <= damaged_area_percentage <= 60.0

        if severe_signal:
            confidence = min(0.99, 0.55 + (ndvi_drop / 100.0) + ai_damage_probability / 3.0)
            return DecisionResult(
                decision="Approved",
                confidence=confidence,
                rationale="NDVI drop exceeds 30% and AI damage probability is above 0.60.",
            )

        if partial_signal:
            confidence = min(0.9, 0.45 + (max(ndvi_drop, damaged_area_percentage) / 200.0) + ai_damage_probability / 5.0)
            return DecisionResult(
                decision="Partial Damage",
                confidence=confidence,
                rationale="Moderate NDVI loss or moderate damaged area detected, suitable for partial settlement.",
            )

        confidence = max(0.5, 0.8 - (ndvi_drop / 100.0) + (1.0 - ai_damage_probability) / 5.0)
        return DecisionResult(
            decision="Rejected",
            confidence=confidence,
            rationale="Damage indicators remain below claim settlement thresholds.",
        )
