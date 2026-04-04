from __future__ import annotations

from datetime import datetime, timezone


class ForumServiceAdapter:
    _posts: list[dict[str, object]] = []
    _replies_by_post: dict[int, list[dict[str, object]]] = {}
    _post_seq: int = 0
    _reply_seq: int = 0

    async def list_posts(self) -> dict[str, object]:
        sorted_posts = sorted(self._posts, key=lambda item: item["created_at"], reverse=True)
        return {"items": sorted_posts}

    async def create_post(self, *, title: str, content: str, author: str) -> dict[str, object]:
        self.__class__._post_seq += 1
        post = {
            "id": self._post_seq,
            "title": title,
            "content": content,
            "author": author,
            "like_count": 0,
            "created_at": datetime.now(tz=timezone.utc),
        }
        self._posts.append(post)
        self._replies_by_post.setdefault(post["id"], [])
        return post

    async def list_replies(self, *, post_id: int) -> dict[str, object]:
        return {"items": list(self._replies_by_post.get(post_id, []))}

    async def create_reply(self, *, post_id: int, content: str, author: str) -> dict[str, object]:
        self.__class__._reply_seq += 1
        reply = {
            "id": self._reply_seq,
            "post_id": post_id,
            "content": content,
            "author": author,
            "created_at": datetime.now(tz=timezone.utc),
        }
        self._replies_by_post.setdefault(post_id, []).append(reply)
        return reply

    async def like_post(self, *, post_id: int) -> dict[str, object] | None:
        for post in self._posts:
            if post["id"] == post_id:
                post["like_count"] = int(post["like_count"]) + 1
                return post
        return None

    async def search_posts(self, *, query: str) -> dict[str, object]:
        needle = query.lower().strip()
        if not needle:
            return {"query": query, "items": []}
        matches = [
            post
            for post in self._posts
            if needle in str(post["title"]).lower() or needle in str(post["content"]).lower()
        ]
        return {"query": query, "items": matches}
