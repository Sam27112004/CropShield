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
