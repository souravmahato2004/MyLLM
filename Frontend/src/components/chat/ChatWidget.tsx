import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { streamChatMessage, type ChatMessage } from '../../services/chatService';

const makeId = () => Math.random().toString(36).slice(2);

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm the NavQuill assistant. Ask me anything.",
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest content in view as tokens stream in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen, isStreaming]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setMessages((prev) => [...prev, { id: makeId(), role: 'user', content: text }]);
    setInput('');
    setIsStreaming(true);

    const assistantId = makeId();
    let started = false;

    try {
      await streamChatMessage(text, (delta) => {
        if (!started) {
          // First token: create the assistant bubble and start the cursor.
          started = true;
          setTypingId(assistantId);
          setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: delta }]);
        } else {
          // Subsequent tokens: append to the same bubble.
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m))
          );
        }
      });

      if (!started) {
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '(no response)' }]);
      }
    } catch {
      setMessages((prev) => {
        if (started) {
          return prev.map((m) => (m.id === assistantId ? { ...m, content: `${m.content} ⚠️` } : m));
        }
        return [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '⚠️ Sorry, I could not reach the AI service. Please try again.',
          },
        ];
      });
    } finally {
      setTypingId(null);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
          style={{ height: 'min(560px, 70vh)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-violet-600 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">NavQuill Assistant</p>
                <p className="text-xs text-violet-100">Powered by your GPT-2</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition hover:bg-white/20"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F5F3EE] px-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-violet-600 text-white'
                      : 'rounded-bl-sm border border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  {m.content}
                  {m.id === typingId && <span className="ml-0.5 inline-block animate-pulse">▌</span>}
                </div>
              </div>
            ))}

            {/* Waiting for the first token (model is still computing). */}
            {isStreaming && typingId === null && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-4 py-2 text-sm text-stone-500">
                  <Loader2 size={14} className="animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-stone-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type a message…"
                className="max-h-28 flex-1 resize-none rounded-2xl border border-stone-200 bg-[#F5F3EE] px-4 py-2 text-sm text-stone-700 outline-none focus:border-violet-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating launcher button (bottom-right) */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition hover:scale-105 hover:bg-violet-700"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
