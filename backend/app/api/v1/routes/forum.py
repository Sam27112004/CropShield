from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep
from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.forum import (
    ForumPostCreateRequest,
    ForumPostListResponse,
    ForumPostResponse,
    ForumReplyCreateRequest,
    ForumReplyListResponse,
    ForumReplyResponse,
    ForumSearchResponse,
)
from app.services.forum import ForumServiceAdapter

router = APIRouter(prefix="/forum", tags=["forum"])


@router.get("/posts", response_model=ForumPostListResponse)
async def list_forum_posts(
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(db_session_dep),
) -> ForumPostListResponse:
    if not settings.enable_forum_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Forum module disabled")
    service = ForumServiceAdapter(session)
    response = await service.list_posts()
    return ForumPostListResponse(**response)


@router.post("/posts", response_model=ForumPostResponse)
async def create_forum_post(
    payload: ForumPostCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(db_session_dep),
) -> ForumPostResponse:
    if not settings.enable_forum_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Forum module disabled")
    service = ForumServiceAdapter(session)
    response = await service.create_post(
        title=payload.title,
        content=payload.content,
        author=current_user.sub,
    )
    return ForumPostResponse.model_validate(response)


@router.get("/posts/{post_id}/replies", response_model=ForumReplyListResponse)
async def list_forum_replies(
    post_id: int,
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(db_session_dep),
) -> ForumReplyListResponse:
    if not settings.enable_forum_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Forum module disabled")
    service = ForumServiceAdapter(session)
    response = await service.list_replies(post_id=post_id)
    return ForumReplyListResponse(**response)


@router.post("/posts/{post_id}/replies", response_model=ForumReplyResponse)
async def create_forum_reply(
    post_id: int,
    payload: ForumReplyCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(db_session_dep),
) -> ForumReplyResponse:
    if not settings.enable_forum_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Forum module disabled")
    service = ForumServiceAdapter(session)
    try:
        response = await service.create_reply(post_id=post_id, content=payload.content, author=current_user.sub)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forum post not found") from exc
    return ForumReplyResponse.model_validate(response)


@router.post("/posts/{post_id}/like", response_model=ForumPostResponse)
async def like_forum_post(
    post_id: int,
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(db_session_dep),
) -> ForumPostResponse:
    if not settings.enable_forum_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Forum module disabled")
    service = ForumServiceAdapter(session)
    response = await service.like_post(post_id=post_id)
    if response is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forum post not found")
    return ForumPostResponse.model_validate(response)


@router.get("/search", response_model=ForumSearchResponse)
async def search_forum_posts(
    query: str = Query(min_length=1),
    _: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(db_session_dep),
) -> ForumSearchResponse:
    if not settings.enable_forum_module:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Forum module disabled")
    service = ForumServiceAdapter(session)
    response = await service.search_posts(query=query)
    return ForumSearchResponse(**response)
