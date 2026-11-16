import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Eye,
  HelpCircle,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Field, Input, PageSpinner, Textarea, Toggle } from '../../components/ui/Field';
import { AdminHeader, Pagination, SearchBox, StatCard, TableEmpty, TableShell, Td, Th } from '../../components/admin/ui';
import { cn, formatDate } from '../../lib/format';

const TABS = [
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'settings', label: 'Assistant settings', icon: Settings2 },
];

const emptyFaq = { question: '', answer: '', keywords: '', isActive: true };

export default function AdminChatbot() {
  usePageTitle('Admin chatbot');
  const [tab, setTab] = useState('conversations');

  const statusState = useFetch('/admin/chatbot/status');
  const status = statusState.data;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const url = useMemo(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    return `/admin/chatbot/conversations?${params.toString()}`;
  }, [page, search]);

  const conversationsState = useFetch(url, { deps: [url], enabled: tab === 'conversations' });
  const conversations = conversationsState.data?.conversations || [];

  const settingsState = useFetch('/admin/settings', { enabled: tab === 'faqs' || tab === 'settings' });
  const settings = settingsState.data?.settings;
  const faqs = settings?.faqs || [];

  const [chatbotForm, setChatbotForm] = useState({ enabled: true, logConversations: true, welcomeMessage: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!settings?.chatbot) return;
    setChatbotForm({
      enabled: settings.chatbot.enabled !== false,
      logConversations: settings.chatbot.logConversations !== false,
      welcomeMessage: settings.chatbot.welcomeMessage || '',
    });
  }, [settings]);

  const [viewing, setViewing] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [deleteConversationTarget, setDeleteConversationTarget] = useState(null);

  const [faqOpen, setFaqOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState(emptyFaq);
  const [savingFaq, setSavingFaq] = useState(false);
  const [deleteFaqTarget, setDeleteFaqTarget] = useState(null);

  const openConversation = async (item) => {
    setViewing(item);
    setConversation(null);
    setLoadingConversation(true);
    try {
      const { data } = await api.get(`/admin/chatbot/conversations/${item._id}`);
      setConversation(data.conversation);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingConversation(false);
    }
  };

  const removeConversation = async () => {
    try {
      await api.delete(`/admin/chatbot/conversations/${deleteConversationTarget._id}`);
      toast.success('Conversation deleted');
      setDeleteConversationTarget(null);
      if (viewing?._id === deleteConversationTarget._id) setViewing(null);
      conversationsState.reload();
      statusState.reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveChatbotSettings = async (event) => {
    event.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const { data } = await api.put('/admin/settings', { ...settings, chatbot: chatbotForm });
      settingsState.setData({ settings: data.settings });
      toast.success('Assistant settings saved');
      statusState.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const openFaqCreate = () => {
    setEditingFaq(null);
    setFaqForm(emptyFaq);
    setFaqOpen(true);
  };

  const openFaqEdit = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      keywords: (faq.keywords || []).join(', '),
      isActive: faq.isActive !== false,
    });
    setFaqOpen(true);
  };

  const submitFaq = async (event) => {
    event.preventDefault();
    if (faqForm.question.trim().length < 4) return toast.error('Write a clear question.');
    if (faqForm.answer.trim().length < 4) return toast.error('Write an answer.');
    setSavingFaq(true);
    try {
      const payload = {
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim(),
        keywords: faqForm.keywords.split(',').map((entry) => entry.trim()).filter(Boolean),
        isActive: faqForm.isActive,
      };
      const { data } = editingFaq
        ? await api.put(`/admin/faqs/${editingFaq._id}`, payload)
        : await api.post('/admin/faqs', payload);
      settingsState.setData({ settings: { ...settings, faqs: data.faqs } });
      toast.success(editingFaq ? 'FAQ updated' : 'FAQ added');
      setFaqOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingFaq(false);
    }
  };

  const toggleFaq = async (faq) => {
    setBusy(faq._id);
    try {
      const { data } = await api.put(`/admin/faqs/${faq._id}`, { isActive: faq.isActive === false });
      settingsState.setData({ settings: { ...settings, faqs: data.faqs } });
      toast.success(`${faq.question.slice(0, 28)}… ${faq.isActive === false ? 'enabled' : 'hidden'}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy('');
    }
  };

  const removeFaq = async () => {
    try {
      const { data } = await api.delete(`/admin/faqs/${deleteFaqTarget._id}`);
      settingsState.setData({ settings: { ...settings, faqs: data.faqs } });
      toast.success('FAQ deleted');
      setDeleteFaqTarget(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="AI assistant"
        title="Chatbot"
        description="Monitor conversations, manage the FAQ knowledge base and control how Zara behaves across the storefront."
      >
        <Button onClick={() => statusState.reload()} size="sm" variant="outline">
          <RefreshCw size={14} /> Refresh
        </Button>
      </AdminHeader>

      <section className="relative overflow-hidden rounded-3xl bg-ink-950 p-5 text-cream-50 shadow-card sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 shadow-glow">
              <Bot size={22} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold">Zara · AI support</h2>
                <span
                  className={cn(
                    'chip text-[10px]',
                    status?.aiConfigured ? 'bg-emerald-400/15 text-emerald-300' : 'bg-accent-400/15 text-accent-300'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', status?.aiConfigured ? 'bg-emerald-400' : 'bg-accent-400')} />
                  {status?.aiConfigured ? 'LLM connected' : 'FAQ fallback mode'}
                </span>
              </div>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-cream-200/70">
                {status?.aiConfigured
                  ? `Generative replies are enabled with model ${status.model}. Prices, deals and order statuses are always pulled from the live database.`
                  : 'No LLM key is configured, so Zara answers from your FAQ knowledge base and live restaurant data. Add OPENAI_API_KEY to server/.env to enable generative answers — keys never reach the browser.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:shrink-0">
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-center">
              <p className="font-display text-xl font-bold">{status?.totalConversations ?? '—'}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cream-200/60">Conversations</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-center">
              <p className="font-display text-xl font-bold">{status?.totalMessages ?? '—'}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cream-200/60">Messages</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold transition',
                tab === entry.id ? 'bg-ink-900 text-cream-50 shadow-soft' : 'border border-ink-900/10 bg-white text-ink-500 hover:border-ink-900/25'
              )}
            >
              <Icon size={13} /> {entry.label}
            </button>
          );
        })}
      </div>

      {tab === 'conversations' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/[0.06] bg-white p-3 shadow-soft sm:flex-row sm:items-center">
            <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by session ID…" className="flex-1" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Newest first</p>
          </div>

          <TableShell>
            <thead>
              <tr>
                <Th>Session</Th>
                <Th>Preview</Th>
                <Th>Provider</Th>
                <Th>Messages</Th>
                <Th>Last activity</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {conversationsState.loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <Td colSpan={6}>
                      <div className="skeleton h-9 w-full" />
                    </Td>
                  </tr>
                ))
              ) : conversations.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  title="No conversations yet"
                  description="Chats appear here when logging is enabled and a customer messages Zara."
                />
              ) : (
                conversations.map((item) => (
                  <tr key={item._id} className="transition hover:bg-cream-50/60">
                    <Td>
                      <p className="font-mono text-[10px] font-bold text-ink-800">{item.sessionId}</p>
                      <p className="text-[10px] text-ink-400">{formatDate(item.createdAt, { time: false })}</p>
                    </Td>
                    <Td className="max-w-[260px]">
                      <p className="truncate text-[11px] text-ink-600">{item.preview || 'No user message yet'}</p>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'chip text-[9px]',
                          item.provider === 'openai' ? 'bg-emerald-50 text-emerald-700' : 'bg-accent-50 text-accent-700'
                        )}
                      >
                        {item.provider === 'openai' ? 'LLM' : 'FAQ'}
                      </span>
                    </Td>
                    <Td className="text-[11px] text-ink-600">{item.messageCount}</Td>
                    <Td className="text-[10px] text-ink-500">{formatDate(item.lastMessageAt || item.updatedAt)}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openConversation(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-cream-100 hover:text-ink-900"
                          aria-label="View conversation"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConversationTarget(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-brand-600"
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableShell>

          <div className="flex justify-end">
            <Pagination
              page={page}
              pages={conversationsState.data?.pages || 0}
              total={conversationsState.data?.total}
              onChange={setPage}
            />
          </div>
        </div>
      )}

      {tab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/[0.06] bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-ink-800">{faqs.length} FAQs in the knowledge base</p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                {status?.aiConfigured
                  ? 'FAQs are shared with the LLM as ground truth and answer directly in fallback mode.'
                  : 'Without an LLM key, Zara matches these keywords to answer customers.'}
              </p>
            </div>
            <Button onClick={openFaqCreate} size="sm" disabled={!settings}>
              <Plus size={14} /> Add FAQ
            </Button>
          </div>

          {settingsState.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink-900/15 bg-white px-6 py-14 text-center">
              <Sparkles className="mx-auto h-9 w-9 text-ink-300" />
              <p className="mt-3 font-display text-base font-bold text-ink-900">No FAQs yet</p>
              <p className="mt-1 text-xs text-ink-500">Add common questions so Zara can answer even without an AI key.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {faqs.map((faq) => (
                <article key={faq._id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-ink-900">{faq.question}</p>
                      <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-ink-500">{faq.answer}</p>
                    </div>
                    <span
                      className={cn(
                        'chip shrink-0 text-[9px]',
                        faq.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'
                      )}
                    >
                      {faq.isActive !== false ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  {faq.keywords?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {faq.keywords.map((keyword) => (
                        <span key={keyword} className="rounded-full bg-cream-100 px-2 py-0.5 text-[9px] font-semibold text-ink-500">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-ink-900/[0.06] pt-3">
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq)}
                      disabled={busy === faq._id}
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold text-ink-500 transition hover:bg-cream-100 hover:text-ink-900 disabled:opacity-40"
                    >
                      {faq.isActive !== false ? 'Hide' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openFaqEdit(faq)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 transition hover:bg-cream-100 hover:text-ink-900"
                      aria-label="Edit FAQ"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteFaqTarget(faq)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-brand-600"
                      aria-label="Delete FAQ"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {settingsState.loading ? (
            <div className="skeleton h-72 w-full rounded-2xl" />
          ) : (
            <form onSubmit={saveChatbotSettings} className="card p-5">
              <h2 className="font-display text-base font-bold text-ink-900">Assistant behaviour</h2>
              <p className="mt-1 text-[11px] text-ink-400">
                These settings affect the floating chat widget on every customer page. Save is instant.
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-cream-50 p-4">
                  <Toggle
                    id="chat-enabled"
                    checked={chatbotForm.enabled}
                    onChange={(checked) => setChatbotForm((prev) => ({ ...prev, enabled: checked }))}
                    label="Chat widget enabled"
                    description="Hide the widget entirely without deleting conversation history."
                  />
                </div>
                <div className="rounded-2xl bg-cream-50 p-4">
                  <Toggle
                    id="chat-logging"
                    checked={chatbotForm.logConversations}
                    onChange={(checked) => setChatbotForm((prev) => ({ ...prev, logConversations: checked }))}
                    label="Log conversations"
                    description="Store chats for quality review. Disable for maximum customer privacy."
                  />
                </div>
                <Field label="Welcome message" htmlFor="chat-welcome" hint="Max 300 characters. Shown when the chat opens.">
                  <Textarea
                    id="chat-welcome"
                    rows={3}
                    maxLength={300}
                    value={chatbotForm.welcomeMessage}
                    onChange={(event) => setChatbotForm((prev) => ({ ...prev, welcomeMessage: event.target.value }))}
                    placeholder="Hi, I'm Zara from Zee Foods! Ask me about our menu, deals, delivery or order tracking."
                  />
                </Field>
                <div className="flex justify-end border-t border-ink-900/[0.06] pt-4">
                  <Button type="submit" loading={savingSettings}>
                    Save assistant settings
                  </Button>
                </div>
              </div>
            </form>
          )}

          <aside className="space-y-4">
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink-900">
                <CheckCircle2 size={15} className="text-emerald-600" /> Grounding & safety
              </h3>
              <ul className="mt-3 space-y-2.5 text-[11px] leading-relaxed text-ink-500">
                <li>Prices, deals and order statuses come from MongoDB on every reply.</li>
                <li>API keys live only in server environment variables.</li>
                <li>Rate limiting protects the chat endpoint from abuse.</li>
                <li>Without a key, the FAQ fallback keeps the widget functional.</li>
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="font-display text-sm font-bold text-ink-900">Enable the LLM</h3>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
                Add these to <code className="rounded bg-cream-100 px-1 py-0.5 text-[10px]">server/.env</code> and restart the API:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-950 p-3 text-[10px] leading-relaxed text-cream-100">
{`OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini`}
              </pre>
              <p className="mt-2 text-[10px] text-ink-400">Current provider: {status?.aiConfigured ? `LLM (${status.model})` : 'FAQ fallback'}</p>
            </div>
            <div className="card p-5">
              <StatCard icon={Bot} label="Model" value={status?.model || 'Fallback'} hint={status?.aiConfigured ? 'OpenAI-compatible' : 'No API key configured'} accent={status?.aiConfigured ? 'emerald' : 'accent'} />
            </div>
          </aside>
        </div>
      )}

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        size="lg"
        title={`Conversation · ${viewing?.sessionId || ''}`}
        description={viewing ? `Started ${formatDate(viewing.createdAt)}` : ''}
      >
        {loadingConversation ? (
          <PageSpinner label="Loading messages…" />
        ) : (
          <div className="space-y-3">
            {conversation?.messages?.map((message, index) => (
              <div key={index} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed',
                    message.role === 'user' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-ink-900/[0.06] bg-cream-50 text-ink-700'
                  )}
                >
                  {message.content}
                  <span className={cn('mt-1 block text-right text-[9px]', message.role === 'user' ? 'text-white/60' : 'text-ink-300')}>
                    {formatDate(message.at || message.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {!conversation?.messages?.length && <p className="text-center text-xs text-ink-400">No messages in this conversation.</p>}
          </div>
        )}
      </Modal>

      <Modal
        open={faqOpen}
        onClose={() => !savingFaq && setFaqOpen(false)}
        title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
        description="Answers should be short, factual and reflect current Zee Foods policy."
      >
        <form onSubmit={submitFaq} className="space-y-4">
          <Field label="Question" htmlFor="faq-question">
            <Input
              id="faq-question"
              value={faqForm.question}
              onChange={(event) => setFaqForm((prev) => ({ ...prev, question: event.target.value }))}
              placeholder="Do you deliver to my area?"
            />
          </Field>
          <Field label="Answer" htmlFor="faq-answer">
            <Textarea
              id="faq-answer"
              rows={4}
              value={faqForm.answer}
              onChange={(event) => setFaqForm((prev) => ({ ...prev, answer: event.target.value }))}
              placeholder="We deliver across Lahore within 35 minutes…"
            />
          </Field>
          <Field label="Keywords" htmlFor="faq-keywords" hint="Comma separated trigger words for fallback matching.">
            <Input
              id="faq-keywords"
              value={faqForm.keywords}
              onChange={(event) => setFaqForm((prev) => ({ ...prev, keywords: event.target.value }))}
              placeholder="delivery, area, how long, charges"
            />
          </Field>
          <div className="rounded-2xl bg-cream-50 p-4">
            <Toggle
              id="faq-active"
              checked={faqForm.isActive}
              onChange={(checked) => setFaqForm((prev) => ({ ...prev, isActive: checked }))}
              label="Active"
              description="Inactive FAQs are excluded from the chatbot knowledge base."
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-ink-900/[0.06] pt-4">
            <Button variant="outline" onClick={() => setFaqOpen(false)} disabled={savingFaq}>
              Cancel
            </Button>
            <Button type="submit" loading={savingFaq}>
              {editingFaq ? 'Save FAQ' : 'Add FAQ'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteConversationTarget)}
        onClose={() => setDeleteConversationTarget(null)}
        onConfirm={removeConversation}
        title="Delete this conversation?"
        description="The transcript is permanently removed from logs."
        confirmLabel="Delete conversation"
      />

      <ConfirmDialog
        open={Boolean(deleteFaqTarget)}
        onClose={() => setDeleteFaqTarget(null)}
        onConfirm={removeFaq}
        title="Delete this FAQ?"
        description="Zara will no longer answer with this entry."
        confirmLabel="Delete FAQ"
      />
    </div>
  );
}
