import { useState, useEffect, useRef } from 'react';
import { Send, Loader as Loader2, Lightbulb, Search, Trash2, User, Sparkle } from 'lucide-react';
import { sendChatMessage } from '../lib/api';
import { supabase, type ChatMessage } from '../lib/supabase';

const seedMessages: { sender: 'lumen'; text: string }[] = [
  {
    sender: 'lumen',
    text: "I'm Lumen, your Socratic tutor. Ask me anything — I'll guide you to the answer through questions, not lectures.",
  },
];

export default function Tutor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      } else {
        // Seed welcome message
        for (const m of seedMessages) {
          const { data: inserted } = await supabase
            .from('chat_messages')
            .insert({ sender: m.sender, text: m.text })
            .select('*')
            .maybeSingle();
          if (inserted) setMessages((prev) => [...prev, inserted as ChatMessage]);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setError(null);

    const tempUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: userText,
      action_taken: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUser]);

    const { data: savedUser } = await supabase
      .from('chat_messages')
      .insert({ sender: 'user', text: userText })
      .select('*')
      .maybeSingle();
    if (savedUser) {
      setMessages((prev) => prev.map((m) => (m.id === tempUser.id ? (savedUser as ChatMessage) : m)));
    }

    setLoading(true);
    try {
      const history = [...messages, tempUser].map((m) => ({ sender: m.sender, text: m.text }));
      const res = await sendChatMessage({ messages: history, useSearch });
      const lumenMsg: ChatMessage = {
        id: `temp-lumen-${Date.now()}`,
        sender: 'lumen',
        text: res.text,
        action_taken: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, lumenMsg]);

      const { data: savedLumen } = await supabase
        .from('chat_messages')
        .insert({ sender: 'lumen', text: res.text })
        .select('*')
        .maybeSingle();
      if (savedLumen) {
        setMessages((prev) => prev.map((m) => (m.id === lumenMsg.id ? (savedLumen as ChatMessage) : m)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setMessages([]);
    // Re-seed welcome
    for (const m of seedMessages) {
      const { data: inserted } = await supabase
        .from('chat_messages')
        .insert({ sender: m.sender, text: m.text })
        .select('*')
        .maybeSingle();
      if (inserted) setMessages((prev) => [...prev, inserted as ChatMessage]);
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-screen pt-16 md:pt-0">
      {/* Header */}
      <div className="glass border-b border-white/5 px-4 md:px-10 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-lumen-500/30 to-lumen-700/20 flex items-center justify-center lumen-breathe">
            <Lightbulb className="w-5 h-5 text-lumen-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink-100">Lumen Tutor</h1>
            <p className="text-[10px] text-ink-500 font-mono uppercase tracking-widest">Socratic dialogue</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseSearch((s) => !s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              useSearch
                ? 'bg-lumen-500/15 border border-lumen-500/30 text-lumen-300'
                : 'bg-ink-800 border border-white/5 text-ink-400 hover:text-ink-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Search
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg bg-ink-800 border border-white/5 text-ink-400 hover:text-coral transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="flex items-center gap-3 fade-in">
              <div className="w-8 h-8 rounded-lg bg-lumen-500/15 flex items-center justify-center flex-shrink-0">
                <Sparkle className="w-4 h-4 text-lumen-400 lumen-pulse" />
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-lumen-400/60 lumen-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="glass border-t border-white/5 px-4 md:px-10 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Lumen anything…"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-ink-800/60 border border-white/5 text-ink-100 placeholder-ink-500 focus:outline-none focus:border-lumen-500/30 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-xl bg-lumen-500/15 border border-lumen-500/30 text-lumen-400 flex items-center justify-center hover:bg-lumen-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {useSearch && (
            <p className="text-[10px] text-lumen-400/60 mt-2 font-mono uppercase tracking-widest">
              Web search enabled — responses include grounding sources
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage; key?: string }) {
  const isUser = msg.sender === 'user';
  return (
    <div className={`flex items-start gap-3 float-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-ink-700' : 'bg-lumen-500/15'
      }`}>
        {isUser ? <User className="w-4 h-4 text-ink-300" /> : <Lightbulb className="w-4 h-4 text-lumen-400" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
        isUser
          ? 'bg-ink-700/60 border border-white/5 rounded-tr-sm'
          : 'glass rounded-tl-sm'
      }`}>
        <p className="text-sm text-ink-100 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
      </div>
    </div>
  );
}
