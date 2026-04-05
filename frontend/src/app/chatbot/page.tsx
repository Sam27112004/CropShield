'use client';

import { FormEvent, useEffect, useState } from 'react';
import ErrorBanner from '@/components/ErrorBanner';
import { advisoryChat, ApiError } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatbotPage() {
  const historyStorageKey = 'cropshield.chatbot.history.v1';
  const [input, setInput] = useState('How can I reduce crop stress this week?');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(historyStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Message[];
      if (Array.isArray(parsed)) {
        setMessages(parsed.slice(-30));
      }
    } catch {
      // Ignore malformed local history payload.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text }]);

    try {
      const response = await advisoryChat({ message: text, language: 'en' });
      setMessages((prev) => [...prev, { role: 'assistant', text: response.reply }]);
      setInput('');
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Chatbot</h1>
        <p className="text-foreground-muted">Interactive assistant for general agronomy questions.</p>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold">Conversation</p>
          <button
            type="button"
            onClick={() => setMessages([])}
            className="text-xs font-semibold text-foreground-muted hover:text-foreground-main"
          >
            Clear
          </button>
        </div>
        <div className="max-h-[420px] overflow-auto space-y-3 mb-4 pr-1">
          {messages.length === 0 ? <p className="text-sm text-foreground-muted">No messages yet.</p> : null}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'bg-primary/10 text-foreground-main' : 'border border-primary/10 text-foreground-muted'}`}
            >
              <p className="font-semibold mb-1">{message.role === 'user' ? 'You' : 'Assistant'}</p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask your question"
            className="flex-1 rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </section>
    </div>
  );
}
