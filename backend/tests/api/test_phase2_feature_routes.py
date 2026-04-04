from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_weather_market_and_advisory_routes_return_200(client, admin_headers) -> None:
    weather_resp = await client.get("/api/v1/weather/current?location=Pune", headers=admin_headers)
    assert weather_resp.status_code == 200
    weather_body = weather_resp.json()
    assert weather_body["location"] == "Pune"
    assert isinstance(weather_body["temperature_c"], float)

    market_resp = await client.get("/api/v1/market/commodities", headers=admin_headers)
    assert market_resp.status_code == 200
    market_body = market_resp.json()
    assert len(market_body["items"]) >= 1

    advisory_resp = await client.post(
        "/api/v1/advisory/chat",
        json={"message": "How should I irrigate wheat this week?", "language": "en"},
        headers=admin_headers,
    )
    assert advisory_resp.status_code == 200
    advisory_body = advisory_resp.json()
    assert advisory_body["provider"] == "fallback"


@pytest.mark.asyncio
async def test_forum_routes_create_and_search_posts(client, farmer_headers) -> None:
    create_resp = await client.post(
        "/api/v1/forum/posts",
        json={"title": "Pest issue in tomato", "content": "Leaves have spots after rain."},
        headers=farmer_headers,
    )
    assert create_resp.status_code == 200
    created = create_resp.json()
    post_id = created["id"]

    list_resp = await client.get("/api/v1/forum/posts", headers=farmer_headers)
    assert list_resp.status_code == 200
    assert any(item["id"] == post_id for item in list_resp.json()["items"])

    reply_resp = await client.post(
        f"/api/v1/forum/posts/{post_id}/replies",
        json={"content": "Try checking drainage and apply preventive spray."},
        headers=farmer_headers,
    )
    assert reply_resp.status_code == 200

    search_resp = await client.get("/api/v1/forum/search?query=tomato", headers=farmer_headers)
    assert search_resp.status_code == 200
    assert search_resp.json()["query"] == "tomato"


@pytest.mark.asyncio
async def test_forum_reply_to_missing_post_returns_404(client, farmer_headers) -> None:
    reply_resp = await client.post(
        "/api/v1/forum/posts/999999/replies",
        json={"content": "Any updates?"},
        headers=farmer_headers,
    )
    assert reply_resp.status_code == 404


@pytest.mark.asyncio
async def test_new_phase2_routes_require_auth(client) -> None:
    weather_resp = await client.get("/api/v1/weather/current")
    market_resp = await client.get("/api/v1/market/commodities")
    advisory_resp = await client.post("/api/v1/advisory/chat", json={"message": "x", "language": "en"})
    forum_resp = await client.get("/api/v1/forum/posts")

    assert weather_resp.status_code == 401
    assert market_resp.status_code == 401
    assert advisory_resp.status_code == 401
    assert forum_resp.status_code == 401
