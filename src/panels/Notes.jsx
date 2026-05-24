import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDB, mutateDB, toast, aiSummarize, aiAnalyze } from '../store';
import { Plus, Trash2, FileText, Save, CheckCircle, Clock, Search, Download, Sparkles, List, Bold, Italic, Code } from 'lucide-react';

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Notes() {
  const db = useDB();
  const [selected, setSelected] = useState(db.notes?.[0]?.id || null);
  const [draft, setDraft] = useState({ title: '', content: '', tags: '', subject: '' });
  const [query, setQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [aiLoading, setAiLoading] = useState('');
  const autoSaveTimer = useRef(null);
  const textareaRef = useRef(null);

  const note = db.notes.find(n => n.id === selected);

  useEffect(() => {
    if (note) {
      setDraft({
        title: note.title || '',
        content: note.content || '',
        tags: (note.tags || []).join(', '),
        subject: note.subject || '',
      });
      setSaveStatus('saved');
    }
  }, [selected]);

  useEffect(() => {
    if (!selected || !note) return;
    setSaveStatus('unsaved');
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      mutateDB(d => {
        const n = d.notes.find(x => x.id === selected);
        if (n) {
          n.title = draft.title || 'Untitled';
          n.content = draft.content;
          n.tags = draft.tags.split(',').map(t => t.trim()).filter(Boolean);
          n.subject = draft.subject;
          n.updatedAt = new Date().toISOString();
          n.date = new Date().toISOString().split('T')[0];
        }
      });
      setSaveStatus('saved');
    }, 700);
    return () => clearTimeout(autoSaveTimer.current);
  }, [draft.title, draft.content, draft.tags, draft.subject]);

  const createNote = () => {
    const id = Date.now().toString();
    mutateDB(d => {
      d.notes.unshift({
        id,
        title: 'Untitled note',
        content: '# Untitled note\n\nStart writing here.',
        date: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
        tags: [],
        subject: '',
      });
    }, 'Created note');
    setSelected(id);
  };

  const deleteNote = (id) => {
    mutateDB(d => { d.notes = d.notes.filter(n => n.id !== id); }, 'Deleted note');
    setSelected(db.notes.find(n => n.id !== id)?.id || null);
    toast.success('Note deleted');
  };

  const insertMarkdown = (before, after = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = draft.content.slice(start, end) || 'text';
    const next = `${draft.content.slice(0, start)}${before}${selectedText}${after}${draft.content.slice(end)}`;
    setDraft(d => ({ ...d, content: next }));
    setTimeout(() => el.focus(), 0);
  };

  const runAI = async (action) => {
    if (!draft.content.trim()) {
      toast.error('Write something first');
      return;
    }
    setAiLoading(action);
    const result = action === 'summary'
      ? await aiSummarize(draft.content, 'note revision summary')
      : await aiAnalyze({ note: draft }, 'Generate flashcards from this note. Return 8-12 Q/A pairs in markdown.');
    const header = action === 'summary' ? '\n\n## AI Summary\n' : '\n\n## AI Flashcards\n';
    setDraft(d => ({ ...d, content: `${d.content}${header}${result}` }));
    setAiLoading('');
  };

  const filteredNotes = (db.notes || []).filter(n => {
    const haystack = `${n.title} ${n.content} ${(n.tags || []).join(' ')} ${n.subject || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const status = saveStatus === 'saved'
    ? <span className="text-mint"><CheckCircle size={12} /> Saved</span>
    : <span className="text-faint"><Clock size={12} /> Autosaving</span>;

  return (
    <div className="animate-fade notes-layout">
      <aside className="notes-sidebar">
        <button className="btn btn-primary" onClick={createNote}><Plus size={16} /> New Note</button>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text3)' }} />
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Search notes..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="notes-list">
          {filteredNotes.map(n => (
            <button key={n.id} className={`note-list-item ${selected === n.id ? 'active' : ''}`} onClick={() => setSelected(n.id)}>
              <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
              <span className="text-faint" style={{ fontSize: '0.7rem' }}>{n.date}</span>
              {(n.tags || []).length > 0 && <span className="text-faint" style={{ fontSize: '0.68rem' }}>{n.tags.join(', ')}</span>}
              <Trash2 size={14} className="note-delete" onClick={e => { e.stopPropagation(); deleteNote(n.id); }} />
            </button>
          ))}
        </div>
      </aside>

      <main className="notes-editor card">
        {note ? (
          <>
            <div className="notes-topbar">
              <input className="notes-title-input" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Untitled note" />
              <div className="notes-save-status">{status}</div>
            </div>

            <div className="notes-meta-row">
              <input className="input input-sm" placeholder="Subject" value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} />
              <input className="input input-sm" placeholder="Tags: dsa, exam, lab" value={draft.tags} onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))} />
            </div>

            <div className="notes-toolbar">
              <button className="btn btn-secondary btn-sm" onClick={() => insertMarkdown('**', '**')} title="Bold"><Bold size={14} /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => insertMarkdown('*', '*')} title="Italic"><Italic size={14} /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => insertMarkdown('\n- ', '')} title="List"><List size={14} /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => insertMarkdown('`\n', '\n`')} title="Code"><Code size={14} /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => runAI('summary')} disabled={!!aiLoading}><Sparkles size={14} /> {aiLoading === 'summary' ? 'Summarizing...' : 'Summarize'}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => runAI('flashcards')} disabled={!!aiLoading}><Sparkles size={14} /> {aiLoading === 'flashcards' ? 'Generating...' : 'Flashcards'}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => downloadText(`${draft.title || 'note'}.md`, draft.content)}><Download size={14} /> Export</button>
            </div>

            <div className="notes-split">
              <textarea ref={textareaRef} className="notes-textarea" value={draft.content} onChange={e => setDraft(d => ({ ...d, content: e.target.value }))} />
              <div className="notes-preview markdown-lite">
                <ReactMarkdown>{draft.content || 'Nothing to preview yet.'}</ReactMarkdown>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            <div>
              <FileText size={48} style={{ marginBottom: 16, color: 'var(--violet)' }} />
              <div>No note selected</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
