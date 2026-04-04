'use client';

import { FormEvent, useEffect, useState } from 'react';
import ErrorBanner from '@/components/ErrorBanner';
import {
  ApiError,
  createForumPost,
  createForumReply,
  likeForumPost,
  listForumPosts,
  listForumReplies,
  searchForumPosts,
} from '@/lib/api';
import type { ForumPost, ForumReply } from '@/types/api';

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function ForumPage() {
  const pageSize = 8;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [repliesByPost, setRepliesByPost] = useState<Record<number, ForumReply[]>>({});
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');

  async function loadPosts(search?: string) {
    setLoading(true);
    setError(null);
    try {
      const response = search && search.trim().length > 0 ? await searchForumPosts(search.trim()) : await listForumPosts();
      setPosts(response.items);
      setPage(1);
      if (response.items.length === 0) {
        setSelectedPostId(null);
      } else if (!response.items.some((item) => item.id === selectedPostId)) {
        setSelectedPostId(response.items[0].id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReplies(postId: number) {
    try {
      const response = await listForumReplies(postId);
      setRepliesByPost((prev) => ({ ...prev, [postId]: response.items }));
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(message);
    }
  }

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setError(null);
    try {
      await createForumPost({ title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      await loadPosts(query);
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(message);
    }
  }

  async function handleLikePost(postId: number) {
    try {
      const updated = await likeForumPost(postId);
      setPosts((prev) => prev.map((item) => (item.id === postId ? updated : item)));
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(message);
    }
  }

  async function handleCreateReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPostId) {
      setError('Select a post before adding a reply.');
      return;
    }
    if (!replyContent.trim()) {
      setError('Reply content is required.');
      return;
    }
    try {
      await createForumReply(selectedPostId, { content: replyContent.trim() });
      setReplyContent('');
      await loadReplies(selectedPostId);
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(message);
    }
  }

  const selectedPost = posts.find((item) => item.id === selectedPostId) ?? null;
  const selectedReplies = selectedPostId ? repliesByPost[selectedPostId] ?? [] : [];
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'likes') {
      if (b.like_count === a.like_count) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.like_count - a.like_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const pageCount = Math.max(1, Math.ceil(sortedPosts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginatedPosts = sortedPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold gradient-text">Community Forum</h1>
        <p className="text-foreground-muted">Share issues, ask for guidance, and collaborate with other users.</p>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => loadPosts(query)} /> : null}

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <form
          className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-start"
          onSubmit={(event) => {
            event.preventDefault();
            void loadPosts(query);
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts"
            className="rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="text-sm text-foreground-muted self-center">{posts.length} post(s)</div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground-muted">Sort:</span>
          <button
            type="button"
            onClick={() => setSortBy('newest')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${sortBy === 'newest' ? 'border-primary/40 bg-primary/5 text-foreground-main' : 'border-primary/20 text-foreground-muted hover:bg-primary/5'}`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSortBy('likes')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${sortBy === 'likes' ? 'border-primary/40 bg-primary/5 text-foreground-main' : 'border-primary/20 text-foreground-muted hover:bg-primary/5'}`}
          >
            Most Liked
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-primary/10 xl:col-span-2">
          <h2 className="text-lg font-bold text-foreground-main mb-4">Posts</h2>
          <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
            {loading ? (
              <div className="space-y-2">
                <div className="h-16 animate-pulse rounded-xl bg-primary/10" />
                <div className="h-16 animate-pulse rounded-xl bg-primary/10" />
                <div className="h-16 animate-pulse rounded-xl bg-primary/10" />
              </div>
            ) : null}
            {paginatedPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => {
                  setSelectedPostId(post.id);
                  if (!repliesByPost[post.id]) {
                    void loadReplies(post.id);
                  }
                }}
                className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                  selectedPostId === post.id ? 'border-primary/40 bg-primary/5' : 'border-primary/10 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground-main">{post.title}</p>
                  <span className="text-xs text-foreground-muted">{formatDateTime(post.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-foreground-muted line-clamp-2">{post.content}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-foreground-dim">
                  <span>by {post.author}</span>
                  <span>{post.like_count} likes</span>
                </div>
              </button>
            ))}
            {!loading && paginatedPosts.length === 0 ? (
              <p className="text-sm text-foreground-dim">No posts found.</p>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-foreground-muted">Page {safePage} of {pageCount}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="rounded-xl border border-primary/20 px-3 py-1.5 text-xs font-semibold text-foreground-main disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={safePage >= pageCount}
                className="rounded-xl border border-primary/20 px-3 py-1.5 text-xs font-semibold text-foreground-main disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-primary/10">
          <h2 className="text-lg font-bold text-foreground-main mb-4">New Post</h2>
          <form className="space-y-3" onSubmit={handleCreatePost}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              placeholder="Describe your issue or question"
              className="w-full rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white">
              Post
            </button>
          </form>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-foreground-main">Selected Discussion</h2>
          {selectedPost ? (
            <button
              type="button"
              onClick={() => void handleLikePost(selectedPost.id)}
              className="rounded-xl border border-primary/20 px-3 py-1.5 text-sm font-semibold text-foreground-main hover:bg-primary/5"
            >
              Like ({selectedPost.like_count})
            </button>
          ) : null}
        </div>

        {selectedPost ? (
          <div className="mb-4">
            <p className="font-semibold text-foreground-main">{selectedPost.title}</p>
            <p className="text-sm text-foreground-muted mt-1">{selectedPost.content}</p>
          </div>
        ) : (
          <p className="text-sm text-foreground-dim">Select a post to view replies.</p>
        )}

        {selectedPost ? (
          <>
            <div className="space-y-2 mb-4">
              {selectedReplies.map((reply) => (
                <div key={reply.id} className="rounded-xl border border-primary/10 px-3 py-2">
                  <p className="text-sm text-foreground-main">{reply.content}</p>
                  <p className="text-xs text-foreground-dim mt-1">{reply.author} • {formatDateTime(reply.created_at)}</p>
                </div>
              ))}
              {selectedReplies.length === 0 ? (
                <p className="text-sm text-foreground-dim">No replies yet.</p>
              ) : null}
            </div>

            <form className="flex flex-col md:flex-row gap-3" onSubmit={handleCreateReply}>
              <input
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="Add a reply"
                className="flex-1 rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white">
                Reply
              </button>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}
