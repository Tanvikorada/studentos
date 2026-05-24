import { useState } from 'react';
import { useDB, mutateDB, toast, aiAnalyze } from '../store';
import { Plus, Trash2, Copy, Code, Sparkles, Bug, Wand2, Play, Terminal } from 'lucide-react';

const LANGS = ['python', 'javascript', 'java', 'cpp', 'sql', 'bash', 'html', 'css', 'typescript', 'rust'];
const TEMPLATES = {
  'Two pointers': { lang: 'python', code: 'def solve(arr):\n    left, right = 0, len(arr) - 1\n    while left < right:\n        # move pointers based on condition\n        left += 1\n        right -= 1\n    return None\n' },
  'Binary search': { lang: 'python', code: 'def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        if arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n' },
  'Graph BFS': { lang: 'python', code: 'from collections import deque\n\ndef bfs(graph, start):\n    seen = {start}\n    q = deque([start])\n    order = []\n    while q:\n        node = q.popleft()\n        order.append(node)\n        for nei in graph[node]:\n            if nei not in seen:\n                seen.add(nei)\n                q.append(nei)\n    return order\n' },
};

// Simple token colorizer
function Highlighted({ code, lang }) {
  const lines = code.split('\n');
  return (
    <pre className="mono" style={{ margin: 0, overflow: 'auto', fontSize: '0.82rem', lineHeight: 1.7, color: '#e2e8f0' }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex' }}>
          <span style={{ color: 'var(--text3)', minWidth: 32, userSelect: 'none', paddingRight: 16, textAlign: 'right' }}>{i + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: colorize(line, lang) }} />
        </div>
      ))}
    </pre>
  );
}

function colorize(line, lang) {
  // Basic keyword highlighting
  const kw = { python: ['def','class','import','from','return','if','else','elif','for','while','True','False','None','in','and','or','not','lambda','with','as','try','except','pass','break','continue'], javascript: ['const','let','var','function','return','if','else','for','while','class','import','export','default','new','this','true','false','null','undefined','async','await','=>'], sql: ['SELECT','FROM','WHERE','JOIN','ON','GROUP','ORDER','BY','HAVING','INSERT','UPDATE','DELETE','CREATE','TABLE','INDEX','AND','OR','NOT','IN','LIKE','AS','INNER','LEFT','RIGHT'] };
  const keywords = kw[lang] || kw.javascript;
  let result = line
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color:#34d399">$1$2$1</span>')
    .replace(/\/\/.*$/g, '<span style="color:#64748b">$&</span>')
    .replace(/#.*$/g, '<span style="color:#64748b">$&</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f59e0b">$1</span>');
  keywords.forEach(kw => {
    result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span style="color:#9d5ff5;font-weight:600">$1</span>');
  });
  return result;
}

export default function CodeStudio() {
  const db = useDB();
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', lang: 'python', code: '' });
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState('');
  const [runOutput, setRunOutput] = useState('');

  const snippets = db.codeSnippets || [];
  const snippet = snippets.find(s => s.id === selected);

  const saveNew = () => {
    if (!draft.title) { toast.error('Title required'); return; }
    const id = Date.now().toString();
    mutateDB(d => {
      if (!d.codeSnippets) d.codeSnippets = [];
      d.codeSnippets.push({ id, ...draft });
    }, `Added snippet: ${draft.title}`);
    setSelected(id); setAdding(false);
    toast.success('Snippet saved');
  };

  const saveEdit = () => {
    mutateDB(d => {
      const s = d.codeSnippets.find(x => x.id === selected);
      if (s) Object.assign(s, draft);
    }, `Updated snippet`);
    setEditing(false); toast.success('Updated');
  };

  const del = (id) => {
    mutateDB(d => { d.codeSnippets = d.codeSnippets.filter(x => x.id !== id); }, 'Deleted snippet');
    setSelected(snippets.find(s => s.id !== id)?.id || null);
    toast.success('Deleted');
  };

  const copy = () => {
    navigator.clipboard.writeText(snippet?.code || '');
    toast.success('Copied to clipboard!');
  };

  const startEdit = () => {
    if (!snippet) return;
    setDraft({ title: snippet.title, lang: snippet.lang, code: snippet.code });
    setEditing(true);
  };

  const runAI = async (mode) => {
    const current = adding || editing ? draft : snippet;
    if (!current?.code && mode !== 'practice') {
      toast.error('Add or select code first');
      return;
    }
    setAiLoading(mode);
    const prompts = {
      explain: 'Explain this code clearly. Include time complexity and key ideas.',
      debug: 'Find bugs, edge cases, and likely runtime issues in this code. Suggest fixes.',
      improve: 'Improve this code for readability, performance, and comments. Return concise recommendations and a revised snippet if useful.',
      practice: `Generate one ${draft.lang || snippet?.lang || 'python'} coding practice problem based on this topic/language. Include difficulty, statement, constraints, examples, and hints.`,
    };
    const result = await aiAnalyze({ language: current?.lang || draft.lang, code: current?.code || '', title: current?.title || draft.title }, prompts[mode]);
    setAiResult(result);
    setAiLoading('');
  };

  const useTemplate = (name) => {
    const t = TEMPLATES[name];
    setAdding(true);
    setEditing(false);
    setDraft({ title: name, lang: t.lang, code: t.code });
  };

  const runCode = async () => {
    const current = adding || editing ? draft : snippet;
    if (!current?.code) { toast.error('Add or select code first'); return; }
    setRunOutput('Running...');
    if (current.lang === 'javascript') {
      const originalLog = console.log;
      try {
        const logs = [];
        console.log = (...args) => logs.push(args.map(String).join(' '));
        // Local JS execution is for trusted personal snippets only.
        const result = Function(`"use strict";\n${current.code}`)();
        setRunOutput([...logs, result !== undefined ? `=> ${String(result)}` : ''].filter(Boolean).join('\n') || 'Completed with no output');
      } catch (err) {
        setRunOutput(`Error: ${err.message}`);
      } finally {
        console.log = originalLog;
      }
      return;
    }
    setRunOutput('Run support for this language needs a Judge0 API key/server proxy. JavaScript snippets run locally in the browser.');
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', gap: 20, height: 'calc(100vh - var(--header-h) - 48px)' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setAdding(true); setEditing(false); setDraft({ title: '', lang: 'python', code: '' }); }}>
          <Plus size={16} /> New Snippet
        </button>
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: 8 }}>Templates</div>
          {Object.keys(TEMPLATES).map(name => (
            <button key={name} className="btn btn-secondary btn-sm" style={{ width: '100%', marginBottom: 6, justifyContent: 'flex-start' }} onClick={() => useTemplate(name)}>
              <Code size={12} /> {name}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {snippets.map(s => (
            <div key={s.id} onClick={() => { setSelected(s.id); setEditing(false); setAdding(false); }}
              style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selected === s.id ? 'rgba(124,58,237,0.15)' : 'transparent', border: `1px solid ${selected === s.id ? 'rgba(124,58,237,0.3)' : 'transparent'}`, transition: 'all 0.15s' }}>
              <div style={{ fontWeight: 500, fontSize: '0.8rem', color: selected === s.id ? 'var(--violet2)' : 'var(--text)' }}>{s.title}</div>
              <span className="badge badge-gray" style={{ marginTop: 4 }}>{s.lang}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor / viewer */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {(adding || editing) ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div><label className="label">Title</label><input className="input" placeholder="Snippet name" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} autoFocus /></div>
              <div><label className="label">Language</label>
                <select className="input" value={draft.lang} onChange={e => setDraft(d => ({ ...d, lang: e.target.value }))}>
                  {LANGS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <label className="label">Code</label>
            <textarea className="input mono" style={{ flex: 1, resize: 'none', fontSize: '0.82rem', lineHeight: 1.7 }}
              placeholder="// Write your code here..." value={draft.code} onChange={e => setDraft(d => ({ ...d, code: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={adding ? saveNew : saveEdit}>Save</button>
              <button className="btn btn-secondary" onClick={() => runAI('improve')} disabled={!!aiLoading}><Wand2 size={14} /> Improve</button>
              <button className="btn btn-secondary" onClick={runCode}><Play size={14} /> Run</button>
              <button className="btn btn-secondary" onClick={() => { setAdding(false); setEditing(false); }}>Cancel</button>
            </div>
          </div>
        ) : snippet ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Code size={16} style={{ color: 'var(--violet2)' }} />
                <span style={{ fontWeight: 600 }}>{snippet.title}</span>
                <span className="badge badge-violet">{snippet.lang}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={copy}><Copy size={12} /> Copy</button>
                <button className="btn btn-secondary btn-sm" onClick={() => runAI('explain')} disabled={!!aiLoading}><Sparkles size={12} /> Explain</button>
                <button className="btn btn-secondary btn-sm" onClick={() => runAI('debug')} disabled={!!aiLoading}><Bug size={12} /> Debug</button>
                <button className="btn btn-secondary btn-sm" onClick={runCode}><Play size={12} /> Run</button>
                <button className="btn btn-secondary btn-sm" onClick={startEdit}>Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => del(selected)} style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>
              </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: aiResult ? '1.2fr 0.8fr' : '1fr', minHeight: 0 }}>
              <div style={{ overflowY: 'auto', padding: 20, background: '#0d0d18' }}>
                <Highlighted code={snippet.code} lang={snippet.lang} />
              </div>
              {aiResult && (
                <div className="markdown-lite" style={{ overflowY: 'auto', padding: 20, borderLeft: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <strong>AI Code Assistant</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAiResult('')}>Close</button>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{aiLoading ? 'Thinking...' : aiResult}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Code size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            Select or create a snippet
          </div>
        )}
      </div>
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card">
          <div className="section-title"><Sparkles size={16} /> Practice</div>
          <button className="btn btn-secondary btn-sm" onClick={() => runAI('practice')} disabled={!!aiLoading}>
            <Play size={14} /> Generate problem
          </button>
          <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 12 }}>Uses your selected language or snippet topic to create a focused DSA practice prompt.</p>
        </div>
        <div className="card">
          <div className="section-title"><Terminal size={16} /> Output</div>
          <pre className="mono" style={{ whiteSpace: 'pre-wrap', fontSize: '0.78rem', color: 'var(--text2)' }}>{runOutput || 'Run a JavaScript snippet to see output here.'}</pre>
        </div>
        {aiResult && !snippet && (
          <div className="card markdown-lite" style={{ overflowY: 'auto' }}>
            <strong>AI Output</strong>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{aiResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
