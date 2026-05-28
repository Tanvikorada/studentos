import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useDB, mutateDB, callAI, buildStudentContext, toast } from '../store';
import { Send, Bot, Trash2, Sparkles, Save, ImagePlus } from 'lucide-react';

const THREADS = [
  { id: 'general', label: 'General' },
  { id: 'academics', label: 'Subjects' },
  { id: 'exams', label: 'Exam Prep' },
  { id: 'career', label: 'Career' },
];

const QUICK_PROMPTS = [
  'Explain this concept clearly with an example',
  'Generate a 10-question quiz from this topic',
  'Summarize my recent notes into revision bullets',
  'Create a 7-day study plan',
  'Solve this problem step by step',
];

function MarkdownText({ text }) {
  return (
    <div className="markdown-lite">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AIChat({ compact = false }) {
  const db = useDB();
  const theme = db.settings?.theme || 'chatgpt-style';
  const [thread, setThread] = useState('general');
  const [messages, setMessages] = useState(() => db.chatThreads?.general || db.chatHistory || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setMessages(db.chatThreads?.[thread] || []);
  }, [thread, db.chatThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveThreads = (threadId, finalMessages) => {
    mutateDB(d => {
      if (!d.chatThreads) d.chatThreads = {};
      d.chatThreads[threadId] = finalMessages;
      d.chatHistory = d.chatThreads.general || [];
    }, 'Sent AI chat message');
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if ((!msg && !attachment) || loading) return;

    setInput('');
    const userContent = attachment
      ? `${msg || 'Analyze this attachment.'}\n\n[Attached image/file as data URL]\n${attachment.dataUrl.slice(0, 4000)}`
      : msg;
    const userMsg = { role: 'user', content: userContent, display: attachment ? `${msg || 'Analyze this attachment.'}\n\nAttached: ${attachment.name}` : msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setAttachment(null);
    setLoading(true);

    const context = buildStudentContext(db);
    const systemPrompt = `You are StudentOS AI, an academic operating-system copilot for a college student.
Use the provided student context to make answers personal and actionable. Do not invent grades, deadlines, attendance, or skills.
Current thread: ${thread}.
Student context JSON: ${JSON.stringify(context)}

Format with clear markdown. Be concise when the user asks a small question and detailed when planning, tutoring, or analyzing.`;

    const reply = await callAI(newMessages.map(m => ({ role: m.role, content: m.content })), systemPrompt);
    const aiMsg = { role: 'assistant', content: reply };
    const finalMessages = [...newMessages, aiMsg];
    setMessages(finalMessages);
    saveThreads(thread, finalMessages);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    mutateDB(d => {
      if (!d.chatThreads) d.chatThreads = {};
      d.chatThreads[thread] = [];
      if (thread === 'general') d.chatHistory = [];
    });
  };

  const saveToNotes = (content) => {
    mutateDB(d => {
      d.notes.unshift({
        id: Date.now().toString(),
        title: `AI Note - ${new Date().toLocaleDateString()}`,
        content,
        date: new Date().toLocaleDateString(),
        updatedAt: new Date().toISOString(),
        tags: ['ai'],
        subject: thread === 'general' ? '' : thread,
      });
    }, 'Saved AI response to notes');
    toast.success('Saved to Notes');
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Keep uploads under 1.5MB for browser AI analysis');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setAttachment({ name: file.name, dataUrl });
  };

  return (
    <div className={`chat-container ${compact ? 'compact' : ''} ${theme} animate-fade`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        {!compact && (
          <div className="thread-tabs">
            {THREADS.map(t => (
              <button key={t.id} className={`thread-tab ${thread === t.id ? 'active' : ''}`} onClick={() => setThread(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          {!compact && (
            <button className="btn btn-secondary btn-sm" onClick={() => {
              mutateDB(d => {
                if (!d.settings) d.settings = {};
                d.settings.aiProvider = d.settings.aiProvider === 'openai' ? 'groq' : 'openai';
              });
            }}>
              {db.settings?.aiProvider === 'openai' ? '🧠 GPT-4o' : '⚡ LLaMA 3.3'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={clearChat}>
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {!compact && (
        <div className="quick-prompt-row">
          {QUICK_PROMPTS.map(prompt => (
            <button key={prompt} className="btn btn-secondary btn-sm" onClick={() => send(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', paddingTop: compact ? 20 : 40 }}>
            <div style={{ width: compact ? 48 : 64, height: compact ? 48 : 64, background: 'linear-gradient(135deg,var(--violet),var(--mint))', borderRadius: compact ? 12 : 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={compact ? 20 : 28} color="#fff" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: compact ? '1.05rem' : '1.25rem', marginBottom: 6 }}>AI Study Assistant</h2>
            <p className="text-muted" style={{ fontSize: compact ? '0.78rem' : '0.875rem', marginBottom: compact ? 16 : 24 }}>
              Context-aware tutoring, planning, coding help, and exam prep
            </p>
          </motion.div>
        )}

        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
            {m.role === 'assistant' && (
              <div className="chat-ai-header" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="ai-avatar-box">
                  <Bot size={12} color="#fff" />
                </div>
                <span className="ai-name-label">StudentOS</span>
              </div>
            )}
            {m.role === 'user' && (
              <div className="chat-user-header" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
                <span className="user-name-label">You</span>
              </div>
            )}
            <div className={`chat-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
              {m.role === 'user' ? (m.display || m.content) : <MarkdownText text={m.content} />}
            </div>
            {m.role === 'assistant' && (
              <button className="btn btn-ghost btn-sm" onClick={() => saveToNotes(m.content)} style={{ padding: '4px 8px' }}>
                <Save size={12} /> Save to Notes
              </button>
            )}
          </motion.div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg,var(--violet),var(--mint))', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={12} color="#fff" />
            </div>
            <div className="chat-bubble ai" style={{ display: 'flex', gap: 4, padding: '12px 16px' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)' }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {attachment && (
        <div className="attachment-pill">
          <span>{attachment.name}</span>
          <button onClick={() => setAttachment(null)}>Remove</button>
        </div>
      )}

      <div className="chat-input-bar">
        <input ref={fileRef} type="file" accept="image/*,.txt,.md" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
        <button className="btn btn-secondary btn-icon" onClick={() => fileRef.current?.click()} title="Attach image or text">
          <ImagePlus size={18} />
        </button>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Ask anything... (add your Groq API key in Settings)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button className="btn btn-primary btn-icon" onClick={() => send()} disabled={(!input.trim() && !attachment) || loading}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
