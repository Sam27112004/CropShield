'use client';

import { FormEvent, useEffect, useState } from 'react';
import ErrorBanner from '@/components/ErrorBanner';
import { advisoryChat, ApiError } from '@/lib/api';

interface Entry {
  language: string;
  question: string;
  answer: string;
}

export default function MultilingualChatbotPage() {
  const historyStorageKey = 'cropshield.mchat.history.v1';
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('कपास में पीला पन दिख रहा है, क्या करें?');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(historyStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Entry[];
      if (Array.isArray(parsed)) {
        setEntries(parsed.slice(0, 20));
      }
    } catch {
      // Ignore malformed local history payload.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(entries.slice(0, 20)));
  }, [entries]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = message.trim();
    if (!question) return;

    setLoading(true);
    setError(null);
    try {
      const response = await advisoryChat({ message: question, language: language.trim() || 'en' });
      setEntries((prev) => [{ language, question, answer: response.reply }, ...prev].slice(0, 15));
      setMessage('');
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="page-hero">
        <p className="section-heading mb-2">Language Assistant</p>
        <h1 className="page-title gradient-text mb-2">Multilingual Chatbot</h1>
        <p className="page-description">Ask in your preferred language using a single advisory backend.</p>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="feed-card p-5">
        <form className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-2" onSubmit={handleSubmit}>
          <input
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            placeholder="en/hi/mr"
            className="control-input"
          />
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask in your language"
            className="control-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-premium disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Ask'}
          </button>
        </form>
      </section>

      <section className="feed-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="section-heading">Responses</p>
          <button
            type="button"
            onClick={() => setEntries([])}
            className="text-xs font-semibold text-foreground-muted hover:text-foreground-main"
          >
            Clear
          </button>
        </div>
        {entries.length === 0 ? <p className="text-sm text-foreground-muted">No messages yet.</p> : null}
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div key={`${entry.language}-${index}`} className="rounded-xl border border-border-glass bg-white/80 px-3 py-2">
              <p className="text-xs text-foreground-dim">Language: {entry.language}</p>
              <p className="text-sm font-semibold text-foreground-main mt-1">Q: {entry.question}</p>
              <p className="text-sm text-foreground-muted mt-1">A: {entry.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
