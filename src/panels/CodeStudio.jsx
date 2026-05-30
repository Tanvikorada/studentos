import { useState, useRef, useEffect } from 'react';
import { useDB, mutateDB, toast, aiAnalyze } from '../store';
import { Plus, Trash2, Copy, Code, Sparkles, Bug, Wand2, Play, Terminal as TerminalIcon, Search, Tag, MessageSquare, ChevronDown, ChevronUp, FileCode, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGS = ['python', 'javascript', 'java', 'cpp', 'sql', 'bash', 'html', 'css', 'typescript', 'rust'];
const TEMPLATES = {
  'Two pointers': { lang: 'python', tags: ['DSA', 'Arrays'], code: 'def solve(arr):\n    left, right = 0, len(arr) - 1\n    while left < right:\n        # move pointers based on condition\n        left += 1\n        right -= 1\n    return None\n' },
  'Binary search': { lang: 'python', tags: ['DSA', 'Search'], code: 'def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        if arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n' },
  'Graph BFS': { lang: 'python', tags: ['DSA', 'Graphs'], code: 'from collections import deque\n\ndef bfs(graph, start):\n    seen = {start}\n    q = deque([start])\n    order = []\n    while q:\n        node = q.popleft()\n        order.append(node)\n        for nei in graph[node]:\n            if nei not in seen:\n                seen.add(nei)\n                q.append(nei)\n    return order\n' },
};

function colorize(line, lang) {
  const kw = { python: ['def','class','import','from','return','if','else','elif','for','while','True','False','None','in','and','or','not','lambda','with','as','try','except','pass','break','continue'], javascript: ['const','let','var','function','return','if','else','for','while','class','import','export','default','new','this','true','false','null','undefined','async','await','=>'], sql: ['SELECT','FROM','WHERE','JOIN','ON','GROUP','ORDER','BY','HAVING','INSERT','UPDATE','DELETE','CREATE','TABLE','INDEX','AND','OR','NOT','IN','LIKE','AS','INNER','LEFT','RIGHT'] };
  const keywords = kw[lang] || kw.javascript;
  let result = line
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color:#34d399">$1$2$1</span>')
    .replace(/\/\/.*$/g, '<span style="color:#64748b">$&</span>')
    .replace(/#.*$/g, '<span style="color:#64748b">$&</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f59e0b">$1</span>');
  keywords.forEach(kw => {
    result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<span style="color:#a78bfa;font-weight:600">$1</span>`);
  });
  return result;
}

function CodeEditor({ code, lang, onChange, readOnly }) {
  const lines = code.split('\n');
  
  return (
    <div className="mono" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'auto', background: '#0a0a0f', fontSize: '0.85rem', lineHeight: 1.6, position: 'relative' }}>
      {/* Line Numbers */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', borderRight: '1px solid rgba(255,255,255,0.05)', userSelect: 'none', background: '#0f0f16', minWidth: 48, alignItems: 'flex-end', color: '#4b5563' }}>
        {lines.map((_, i) => (
          <div key={i} style={{ padding: '0 12px', height: '1.6em' }}>{i + 1}</div>
        ))}
      </div>
      
      {/* Syntax Highlighted Backdrop */}
      <div style={{ position: 'relative', flex: 1 }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '12px 16px', pointerEvents: 'none', whiteSpace: 'pre', color: '#e2e8f0' }}>
          {lines.map((line, i) => (
            <div key={i} style={{ height: '1.6em' }} dangerouslySetInnerHTML={{ __html: colorize(line, lang) || ' ' }} />
          ))}
        </div>
        
        {/* Actual Textarea */}
        <textarea
          value={code}
          onChange={e => onChange?.(e.target.value)}
          readOnly={readOnly}
          spellCheck="false"
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '12px 16px',
            background: 'transparent', color: 'transparent', caretColor: '#e2e8f0', resize: 'none', border: 'none', outline: 'none',
            whiteSpace: 'pre', overflow: 'hidden', fontSize: 'inherit', lineHeight: 'inherit', fontFamily: 'inherit'
          }}
        />
      </div>
    </div>
  );
}

export default function CodeStudio() {
  const db = useDB();
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', lang: 'python', code: '', tags: [] });
  const [search, setSearch] = useState('');
  
  // Terminal / Execution State
  const [runOutput, setRunOutput] = useState('');
  const [runMetrics, setRunMetrics] = useState(null); // { time, status }
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // AI State
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [targetLang, setTargetLang] = useState('rust');

  const snippets = db.codeSnippets || [];
  const snippet = snippets.find(s => s.id === selected);

  // Filter snippets
  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    (s.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    s.lang.toLowerCase().includes(search.toLowerCase())
  );

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
    setDraft({ title: snippet.title, lang: snippet.lang, code: snippet.code, tags: snippet.tags || [] });
    setEditing(true);
  };

  const useTemplate = (name) => {
    const t = TEMPLATES[name];
    setAdding(true);
    setEditing(false);
    setDraft({ title: name, lang: t.lang, code: t.code, tags: t.tags || [] });
  };

  // AI Execution Functions
  const runAI = async (mode) => {
    const current = adding || editing ? draft : snippet;
    setTerminalOpen(true);
    setAiLoading(mode);
    setRunOutput('');
    setRunMetrics(null);

    try {
      let promptStr = '';
      if (mode === 'explain') promptStr = 'Explain this code clearly. Break down the logic, analyze time/space complexity, and identify any clever tricks.';
      if (mode === 'review') promptStr = 'Act as a Senior Engineer. Perform a strict code review. Find edge cases, bugs, performance bottlenecks, and suggest exact modern refactoring improvements.';
      if (mode === 'translate') promptStr = `Translate this code exactly into ${targetLang}. Only return the new code wrapped in a codeblock, with brief comments if necessary.`;
      if (mode === 'generate') {
        if (!aiPrompt) { toast.error('Enter a prompt first'); setAiLoading(''); return; }
        promptStr = `Write complete ${draft.lang} code for: "${aiPrompt}". Only return the code and very brief comments.`;
      }
      
      const result = await aiAnalyze(
        { language: current?.lang || draft.lang, code: current?.code || '', prompt: mode === 'generate' ? aiPrompt : current?.title }, 
        promptStr,
        db.settings?.aiProvider === 'openai'
      );
      
      if (mode === 'generate') {
        // Try to extract codeblock
        const match = result.match(/```[\w]*\n([\s\S]*?)```/);
        const code = match ? match[1].trim() : result.trim();
        setDraft(d => ({ ...d, code }));
        toast.success('Code generated!');
        setTerminalOpen(false);
      } else if (mode === 'translate') {
         setAiResult(result);
         toast.success(`Translated to ${targetLang}`);
      } else {
         setAiResult(result);
      }
    } catch (e) {
      toast.error('AI Request failed');
      setAiResult(`Error: ${e.message}`);
    }
    setAiLoading('');
    setAiPrompt('');
  };

  // Code Execution Functions
  const runCode = async () => {
    const current = adding || editing ? draft : snippet;
    if (!current?.code) { toast.error('Add or select code first'); return; }
    
    setTerminalOpen(true);
    setRunOutput('Initiating execution...');
    setIsExecuting(true);
    setRunMetrics(null);
    setAiResult(''); // Clear AI view when running code
    
    const startTime = performance.now();

    if (current.lang === 'javascript') {
      const originalLog = console.log;
      const originalError = console.error;
      try {
        const logs = [];
        console.log = (...args) => logs.push({ type: 'out', msg: args.map(String).join(' ') });
        console.error = (...args) => logs.push({ type: 'err', msg: args.map(String).join(' ') });
        
        // Local JS execution
        const result = Function(`"use strict";\n${current.code}`)();
        if (result !== undefined) logs.push({ type: 'out', msg: `=> ${String(result)}` });
        
        const time = (performance.now() - startTime).toFixed(2);
        setRunOutput(logs.map(l => l.msg).join('\n') || 'Completed with no output');
        setRunMetrics({ time, status: 'success' });
      } catch (err) {
        const time = (performance.now() - startTime).toFixed(2);
        setRunOutput(`Runtime Error: ${err.message}`);
        setRunMetrics({ time, status: 'error' });
      } finally {
        console.log = originalLog;
        console.error = originalError;
        setIsExecuting(false);
      }
      return;
    }

    // Piston API Execution
    const pistonLangMap = {
      python: { lang: 'python', ver: '3.10.0' },
      java: { lang: 'java', ver: '15.0.2' },
      cpp: { lang: 'c++', ver: '10.2.0' },
      sql: { lang: 'sqlite3', ver: '3.36.0' },
      bash: { lang: 'bash', ver: '5.2.0' },
      typescript: { lang: 'typescript', ver: '5.0.3' },
      rust: { lang: 'rust', ver: '1.68.2' },
    };

    const target = pistonLangMap[current.lang];
    if (!target) {
      setIsExecuting(false);
      setRunOutput(`${current.lang} cannot be executed in this environment.`);
      setRunMetrics({ time: '0.00', status: 'error' });
      return;
    }

    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: target.lang, version: target.ver, files: [{ content: current.code }] })
      });
      const data = await res.json();
      const time = (performance.now() - startTime).toFixed(2);
      
      if (data.run) {
        const out = [];
        if (data.run.stdout) out.push(data.run.stdout);
        if (data.run.stderr) out.push(`[STDERR]\n${data.run.stderr}`);
        
        setRunOutput(out.join('\n') || 'Completed with no output');
        setRunMetrics({ time, status: data.run.code === 0 ? 'success' : 'error' });
      } else if (data.message) {
        setRunOutput(`API Error: ${data.message}`);
        setRunMetrics({ time, status: 'error' });
      }
    } catch (err) {
      const time = (performance.now() - startTime).toFixed(2);
      setRunOutput(`Network/Execution failed: ${err.message}`);
      setRunMetrics({ time, status: 'error' });
    }
    setIsExecuting(false);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', gap: 0, height: 'calc(100vh - var(--header-h) - 48px)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      
      {/* Explorer Sidebar */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface2)', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCode size={16} className="text-violet" /> Explorer
            </h2>
            <button className="btn btn-primary btn-icon" onClick={() => { setAdding(true); setEditing(false); setDraft({ title: '', lang: 'python', code: '', tags: [] }); }}>
              <Plus size={16} />
            </button>
          </div>
          
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input 
              className="input input-sm" 
              placeholder="Search snippets or tags..." 
              style={{ paddingLeft: 32, borderRadius: 20 }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredSnippets.length === 0 && <div className="text-muted" style={{ padding: 20, textAlign: 'center', fontSize: '0.8rem' }}>No snippets found</div>}
          
          {filteredSnippets.map(s => (
            <div key={s.id} onClick={() => { setSelected(s.id); setEditing(false); setAdding(false); setTerminalOpen(false); setAiResult(''); }}
              style={{ 
                padding: '12px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                background: selected === s.id ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                border: `1px solid ${selected === s.id ? 'rgba(139, 92, 246, 0.3)' : 'transparent'}`,
              }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: selected === s.id ? 'var(--violet2)' : 'var(--text)', marginBottom: 4 }}>{s.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{s.lang}</span>
                {s.tags?.map(t => <span key={t} className="text-faint" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 2 }}><Tag size={10} />{t}</span>)}
              </div>
            </div>
          ))}

          {/* Templates Section */}
          <div style={{ marginTop: 24, padding: '0 8px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Templates</div>
            {Object.keys(TEMPLATES).map(name => (
              <button key={name} className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 4, justifyContent: 'flex-start', fontSize: '0.8rem' }} onClick={() => useTemplate(name)}>
                <Code size={14} /> {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main IDE Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#050508' }}>
        
        {/* Editor Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#0a0a0f', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {adding || editing ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
              <input className="input input-sm" placeholder="Snippet Title" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={{ maxWidth: 200, background: '#13131c' }} />
              <select className="input input-sm" value={draft.lang} onChange={e => setDraft(d => ({ ...d, lang: e.target.value }))} style={{ width: 120, background: '#13131c' }}>
                {LANGS.map(l => <option key={l}>{l}</option>)}
              </select>
              <input className="input input-sm" placeholder="Tags (comma separated)" value={draft.tags.join(', ')} onChange={e => setDraft(d => ({ ...d, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} style={{ flex: 1, maxWidth: 250, background: '#13131c' }} />
            </div>
          ) : snippet ? (
             <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
               <Code size={18} className="text-violet" />
               <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f3f4f6' }}>{snippet.title}</span>
               <span className="badge badge-violet">{snippet.lang}</span>
               {snippet.tags?.map(t => <span key={t} className="badge badge-gray" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Tag size={10} />{t}</span>)}
             </div>
          ) : <div />}

          <div style={{ display: 'flex', gap: 8 }}>
            {(adding || editing) ? (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => { setAdding(false); setEditing(false); }} style={{ background: '#1a1a24' }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={adding ? saveNew : saveEdit}>Save Snippet</button>
              </>
            ) : snippet ? (
              <>
                <button className="btn btn-secondary btn-sm" onClick={copy} style={{ background: '#1a1a24', color: '#e2e8f0', borderColor: 'transparent' }}><Copy size={14} /> Copy</button>
                <button className="btn btn-secondary btn-sm" onClick={startEdit} style={{ background: '#1a1a24', color: '#e2e8f0', borderColor: 'transparent' }}>Edit</button>
                <button className="btn btn-secondary btn-sm" onClick={() => del(selected)} style={{ background: '#1a1a24', color: 'var(--red)', borderColor: 'transparent' }}><Trash2 size={14} /></button>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                <button className="btn btn-mint btn-sm" onClick={runCode} disabled={isExecuting}><Play size={14} /> Run</button>
              </>
            ) : null}
          </div>
        </div>

        {/* AI Action Bar (Inline Generation) */}
        {(adding || editing) && (
          <div style={{ padding: '8px 20px', background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.2)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <Sparkles size={16} className="text-violet" />
            <input className="input input-sm" style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: 'none', color: '#f3f4f6' }} placeholder="Ask AI to generate code (e.g. 'Write a fast inverse square root in C++')" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAI('generate')} />
            <button className="btn btn-primary btn-sm" onClick={() => runAI('generate')} disabled={!!aiLoading || !aiPrompt}>Generate</button>
          </div>
        )}

        {/* Editor Window */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {adding || editing ? (
            <CodeEditor code={draft.code} lang={draft.lang} onChange={c => setDraft(d => ({ ...d, code: c }))} />
          ) : snippet ? (
            <CodeEditor code={snippet.code} lang={snippet.lang} readOnly />
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Code size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <h3 style={{ margin: '0 0 8px', color: '#e2e8f0' }}>Select a snippet to start coding</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Or create a new one from the Explorer sidebar.</p>
            </div>
          )}
        </div>

        {/* Resizable Terminal / AI Drawer */}
        <AnimatePresence>
          {terminalOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 320, opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: '#111118', display: 'flex', flexDirection: 'column' }}
            >
              {/* Drawer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className={`btn btn-ghost btn-sm ${!aiResult ? 'active text-mint' : 'text-faint'}`} onClick={() => setAiResult('')} style={{ fontSize: '0.8rem' }}>
                    <TerminalIcon size={14} /> Output
                  </button>
                  <button className={`btn btn-ghost btn-sm ${aiResult ? 'active text-violet' : 'text-faint'}`} onClick={() => { if(!aiResult) runAI('explain'); }} style={{ fontSize: '0.8rem' }}>
                    <Sparkles size={14} /> AI Assistant
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Action buttons inside drawer */}
                  {snippet && !editing && !adding && (
                    <div style={{ display: 'flex', gap: 6, marginRight: 16 }}>
                       <button className="btn btn-secondary btn-sm" onClick={() => runAI('review')} disabled={!!aiLoading} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#1a1a24', border: 'none' }}><Bug size={12} /> Review</button>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1a1a24', padding: '2px', borderRadius: 6 }}>
                         <select className="input input-sm" value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ padding: '2px 8px', height: 24, fontSize: '0.75rem', background: 'transparent', border: 'none' }}>
                           {LANGS.map(l => <option key={l}>{l}</option>)}
                         </select>
                         <button className="btn btn-primary btn-sm" onClick={() => runAI('translate')} disabled={!!aiLoading} style={{ padding: '2px 8px', height: 24, fontSize: '0.7rem' }}>Translate</button>
                       </div>
                    </div>
                  )}

                  {runMetrics && !aiResult && (
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Clock size={12} /> {runMetrics.time}ms</span>
                      {runMetrics.status === 'success' ? <span style={{ color: 'var(--mint)', display: 'flex', gap: 4, alignItems: 'center' }}><CheckCircle2 size={12} /> Success</span> : <span style={{ color: 'var(--red)', display: 'flex', gap: 4, alignItems: 'center' }}><XCircle size={12} /> Error</span>}
                    </div>
                  )}
                  <button className="btn btn-ghost btn-icon" onClick={() => setTerminalOpen(false)} style={{ color: '#94a3b8' }}><ChevronDown size={16} /></button>
                </div>
              </div>

              {/* Drawer Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {aiLoading ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#a78bfa', fontSize: '0.9rem' }}>
                    <Sparkles size={16} className="animate-spin" /> AI is {aiLoading}...
                  </div>
                ) : aiResult ? (
                  <div className="markdown-lite" style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 900 }}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{aiResult}</p>
                  </div>
                ) : (
                  <pre className="mono" style={{ margin: 0, color: runMetrics?.status === 'error' ? '#f87171' : '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {isExecuting ? 'Running...' : runOutput || 'No output.'}
                  </pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Minimized Terminal Bar */}
        {!terminalOpen && (adding || editing || snippet) && (
          <div style={{ background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setTerminalOpen(true)}>
             <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
               <TerminalIcon size={14} /> Open Terminal & AI Panel
             </div>
             <ChevronUp size={14} color="#94a3b8" />
          </div>
        )}
      </div>
    </div>
  );
}
