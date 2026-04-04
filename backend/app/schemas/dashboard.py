from __future__ import annotations

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_claims: int
    approved_claims: int
    average_damage_percentage: float
    average_decision_confidence: float
