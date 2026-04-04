from __future__ import annotations

from pydantic import BaseModel, Field


class AdvisoryChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: str = Field(default="en", min_length=2, max_length=10)


class AdvisoryChatResponse(BaseModel):
    provider: str
    reply: str
    fallback_used: bool = False
