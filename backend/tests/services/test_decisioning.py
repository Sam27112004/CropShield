from __future__ import annotations

from app.services.decisioning import DecisionService


def test_decision_engine_preserves_approved_threshold() -> None:
    service = DecisionService()
    result = service.evaluate_claim(ndvi_drop=42.0, ai_damage_probability=0.72, damaged_area_percentage=70.0)
    assert result.decision == "Approved"


def test_decision_engine_preserves_partial_threshold() -> None:
    service = DecisionService()
    result = service.evaluate_claim(ndvi_drop=18.0, ai_damage_probability=0.4, damaged_area_percentage=40.0)
    assert result.decision == "Partial Damage"


def test_decision_engine_rejects_weak_signals() -> None:
    service = DecisionService()
    result = service.evaluate_claim(ndvi_drop=5.0, ai_damage_probability=0.2, damaged_area_percentage=10.0)
    assert result.decision == "Rejected"
