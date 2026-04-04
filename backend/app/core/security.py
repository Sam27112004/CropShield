from __future__ import annotations

from fastapi import Header


async def optional_request_id(x_request_id: str | None = Header(default=None)) -> str | None:
    return x_request_id
