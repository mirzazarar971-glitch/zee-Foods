import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Headset, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import api from '../../lib/api';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../lib/format';

const SESSION_KEY = 'zf_chat_session';
const HISTORY_KEY = 'zf_chat_history';

const createSessionId = () =>
  `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const QUICK_PROMPTS = ["Show me today's deals", "What's popular?", 'Delivery time & charges', 'Track my order'];

const timeOf = (value) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

export default function ChatWidget() {
  const { settings } = useSettings();
  const welcome =
    settings.chatbot?.welcomeMessage ||
    "Hi, I'm Zara from Zee Foods! Ask me about our menu, deals, delivery or order tracking.";

  const [open, setOpen] = useState(false);
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = createSessionId();
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  });
  const [messages, setMessages] = useState(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(HISTORY_KEY));
      if (Array.isArray(stored) && stored.length) return stored;
    } catch {
      /* ignore corrupt history */
    }
    return [{ role: 'assistant', content: welcome, at: Date.now() }];
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40)));
  }, [messages]);

  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === 'assistant' ? [{ role: 'assistant', content: welcome, at: prev[0].at }] : prev
    );
  }, [welcome]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(timer);
  }, [open, messages, sending]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    const history = messages.slice(-10).map(({ role, content: body }) => ({ role, content: body }));
    setMessages((prev) => [...prev, { role: 'user', content, at: Date.now() }]);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post('/chatbot/message', { sessionId, message: content, history });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, at: Date.now(), provider: data.provider },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            error.message ||
            'Sorry, I could not reach the kitchen just now. Please try again or call us directly.',
          at: Date.now(),
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const showQuickPrompts = messages.filter((message) => message.role === 'user').length === 0;

  if (settings.chatbot?.enabled === false) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close chat with Zara' : 'Chat with Zara, our assistant'}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow transition hover:scale-105 hover:bg-brand-700 sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-70" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-400">
              <Sparkles size={9} className="text-ink-950" />
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-3 z-[60] flex w-[min(calc(100vw-1.5rem),400px)] flex-col overflow-hidden rounded-3xl border border-ink-900/10 bg-cream-50 shadow-2xl sm:right-6"
            style={{ height: 'min(590px, calc(100vh - 150px))' }}
            aria-label="Zee Foods support chat"
          >
            <div className="relative overflow-hidden bg-ink-950 px-4 py-4">
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand-600/40 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
                  <Sparkles size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">Zara · Zee Foods</p>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online now · AI assistant
                  </p>
                </div>
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-8 w-8 place-items-center rounded-full text-cream-100/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Chat with a human on WhatsApp"
                  title="Talk to a human"
                >
                  <Headset size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full text-cream-100/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div ref={listRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto px-3.5 py-4" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={`${message.at}-${index}`}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {message.role === 'assistant' && (
                    <span className="mr-2 mt-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                      Z
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
                      message.role === 'user'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : message.error
                          ? 'rounded-bl-md border border-rose-200 bg-rose-50 text-rose-700'
                          : 'rounded-bl-md border border-ink-900/[0.06] bg-white text-ink-700'
                    )}
                  >
                    {message.content}
                    <span
                      className={cn(
                        'mt-1 block text-right text-[9px] font-medium',
                        message.role === 'user' ? 'text-white/60' : 'text-ink-300'
                      )}
                    >
                      {timeOf(message.at)}
                    </span>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-end gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                    Z
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-ink-900/[0.06] bg-white px-4 py-3">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-ink-400"
                        style={{ animationDelay: `${dot * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {showQuickPrompts && !sending && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <p className="pt-1 text-center text-[10px] text-ink-300">
                Need a person?{' '}
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline-offset-2 hover:underline">
                  WhatsApp our team
                </a>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="border-t border-ink-900/[0.06] bg-white p-3">
              <div className="flex items-end gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  Message Zara
                </label>
                <input
                  id="chat-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about menu, deals, delivery…"
                  maxLength={800}
                  className="min-w-0 flex-1 rounded-full border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-2 text-center text-[9px] text-ink-300">
                Zara answers from our live menu & order data. Prices and offers are subject to availability.
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
