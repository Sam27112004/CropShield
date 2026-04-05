'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Users, Search, MessageCircle, Heart, PlusCircle, Reply, ThumbsUp, Layers, Send } from 'lucide-react';
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
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <Users className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Community Space</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Community Forum</h1>
          <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
            Share issues, request agronomic guidance, and collaborate with regional operators.
          </p>
        </div>
      </div>

      {error ? <ErrorBanner message={error} onRetry={() => loadPosts(query)} /> : null}

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0_4px_24px_rgba(31,52,38,0.04)] flex flex-col md:flex-row items-center gap-4">
        <form
          className="flex-1 w-full flex items-center gap-3 relative"
          onSubmit={(event) => {
            event.preventDefault();
            void loadPosts(query);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search discussion threads..."
              className="w-full bg-gray-50 border border-gray-200 text-sm font-semibold rounded-[16px] pl-11 pr-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#1b241d] hover:bg-gray-800 text-white rounded-[16px] px-5 py-3 text-sm font-bold transition-all shadow-[0_4px_12px_rgba(27,36,29,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? <Search className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>
        
        <div className="h-8 w-px bg-gray-200 hidden md:block" />
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSortBy('newest')}
            className={`flex-1 md:flex-none rounded-[16px] px-4 py-3 text-sm font-bold transition-all ${sortBy === 'newest' ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSortBy('likes')}
            className={`flex-1 md:flex-none rounded-[16px] px-4 py-3 text-sm font-bold transition-all ${sortBy === 'likes' ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
          >
            Popular
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* POSTS LIST */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-400" /> Active Threads
              </h2>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{posts.length} Total</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-2xl bg-gray-50 border border-gray-100" />
                  <div className="h-24 animate-pulse rounded-2xl bg-gray-50 border border-gray-100" />
                </div>
              ) : paginatedPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl h-32">
                   <p className="text-sm font-bold text-gray-400">No threads found.</p>
                </div>
              ) : (
                paginatedPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      setSelectedPostId(post.id);
                      if (!repliesByPost[post.id]) {
                        void loadReplies(post.id);
                      }
                    }}
                    className={`w-full text-left rounded-[20px] p-4 transition-all duration-200 border ${
                      selectedPostId === post.id 
                        ? 'border-primary shadow-[0_8px_20px_rgba(47,133,90,0.1)] bg-primary/[0.02]' 
                        : 'border-gray-100 hover:border-gray-300 bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className={`font-bold line-clamp-1 ${selectedPostId === post.id ? 'text-primary' : 'text-gray-900'}`}>{post.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{post.content}</p>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {post.author}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.like_count}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Page {safePage} / {pageCount}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40 shadow-sm"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                  disabled={safePage >= pageCount}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40 shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SELECTED POST AND REPLIES */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col h-[700px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full blur-[60px] pointer-events-none" />
            
            {selectedPost ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-2 leading-tight">{selectedPost.title}</h2>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {selectedPost.author}</span>
                       <span>•</span>
                       <span>{formatDateTime(selectedPost.created_at)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLikePost(selectedPost.id)}
                    className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-rose-100"
                  >
                    <ThumbsUp className="w-4 h-4" /> {selectedPost.like_count}
                  </button>
                </div>

                <div className="bg-gray-50/50 rounded-[24px] border border-gray-100 p-6 mb-8 relative z-10">
                  <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                </div>

                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 relative z-10">
                  <MessageCircle className="w-4 h-4 text-primary" /> Responses ({selectedReplies.length})
                </h3>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
                  {selectedReplies.length === 0 ? (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-100 rounded-[20px]">
                      <p className="text-sm font-bold text-gray-400">No operators have responded yet.</p>
                    </div>
                  ) : (
                    selectedReplies.map((reply) => (
                      <div key={reply.id} className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                           <span className="text-primary">{reply.author}</span>
                           <span>•</span>
                           <span>{formatDateTime(reply.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{reply.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form className="mt-6 pt-6 border-t border-gray-100 flex gap-3 relative z-10" onSubmit={handleCreateReply}>
                  <div className="relative flex-1">
                    <Reply className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      placeholder="Contribute your guidance..."
                      className="w-full bg-gray-50 border border-gray-200 text-sm font-semibold rounded-[16px] pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner"
                    />
                  </div>
                  <button type="submit" className="flex items-center justify-center gap-2 bg-[#1b241d] hover:bg-gray-800 text-white rounded-[16px] px-6 py-3 text-sm font-bold transition-all shadow-[0_4px_16px_rgba(27,36,29,0.15)]">
                    <Send className="w-4 h-4" /> Reply
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl m-4 relative z-10">
                 <MessageCircle className="w-12 h-12 text-gray-200 mb-4" />
                 <h3 className="text-sm font-bold text-gray-400 mb-2">No Thread Selected</h3>
                 <p className="text-xs text-gray-400 max-w-[250px]">
                   Choose a thread from the panel on the left to read responses and contribute to the discussion.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* NEW POST CTA */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_12px_40px_rgba(31,52,38,0.06)] p-6 lg:p-8 flex flex-col xl:flex-row gap-8 xl:items-start">
         <div className="xl:w-1/3">
           <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
             <PlusCircle className="w-5 h-5 text-primary" /> Start a New Thread
           </h2>
           <p className="text-sm text-gray-500">Need specific advice? Ask the community by outlining your field coordinates or observation payload.</p>
         </div>
         <form className="flex-1 space-y-4" onSubmit={handleCreatePost}>
           <input
             value={title}
             onChange={(event) => setTitle(event.target.value)}
             placeholder="Discussion Title"
             className="w-full bg-gray-50 border border-gray-200 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
           />
           <textarea
             value={content}
             onChange={(event) => setContent(event.target.value)}
             rows={4}
             placeholder="Describe your issue or operational query in detail..."
             className="w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-2xl p-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm resize-none"
           />
           <button type="submit" className="flex items-center justify-center gap-2 bg-[#1b241d] hover:bg-gray-800 text-white rounded-2xl px-6 py-3.5 text-sm font-bold transition-all shadow-[0_8px_24px_rgba(27,36,29,0.2)] ml-auto">
              Broadcast
           </button>
         </form>
      </div>

    </div>
  );
}
