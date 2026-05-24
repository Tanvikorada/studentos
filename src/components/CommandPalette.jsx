import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, MessageSquare, FileText, CheckSquare, Calculator, Calendar, Code, Timer, User, FileCode, Briefcase, Award, GitBranch, Globe, Mic, TrendingUp, Settings, BookOpen, BarChart3 } from 'lucide-react';

const ALL_PANELS = [
  { id: 'dashboard', label: 'Dashboard', group: 'Overview', icon: LayoutDashboard },
  { id: 'chat', label: 'AI Chat', group: 'Academics', icon: MessageSquare },
  { id: 'notes', label: 'Notes', group: 'Academics', icon: FileText },
  { id: 'tasks', label: 'Tasks & Schedule', group: 'Academics', icon: CheckSquare },
  { id: 'gpa', label: 'GPA Calculator', group: 'Academics', icon: Calculator },
  { id: 'attendance', label: 'Attendance Tracker', group: 'Academics', icon: BarChart3 },
  { id: 'timetable', label: 'Timetable', group: 'Academics', icon: Calendar },
  { id: 'code', label: 'Code Studio', group: 'Academics', icon: Code },
  { id: 'focus', label: 'Focus Timer', group: 'Academics', icon: Timer },
  { id: 'profile', label: 'Profile', group: 'Career', icon: User },
  { id: 'resume', label: 'Resume Builder', group: 'Career', icon: FileCode },
  { id: 'projects', label: 'Projects', group: 'Career', icon: Briefcase },
  { id: 'internships', label: 'Internships', group: 'Career', icon: Briefcase },
  { id: 'certs', label: 'Certs & Skills', group: 'Career', icon: Award },
  { id: 'github', label: 'GitHub Tracker', group: 'Career', icon: GitBranch },
  { id: 'portfolio', label: 'Portfolio Preview', group: 'Career', icon: Globe },
  { id: 'interview', label: 'Mock Interview', group: 'Career', icon: Mic },
  { id: 'trends', label: 'Market Trends', group: 'Career', icon: TrendingUp },
  { id: 'settings', label: 'Settings', group: 'Other', icon: Settings },
];

export default function CommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const filtered = query
    ? ALL_PANELS.filter(p => p.label.toLowerCase().includes(query.toLowerCase()) || p.group.toLowerCase().includes(query.toLowerCase()))
    : ALL_PANELS;

  useEffect(() => {
    if (open) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    const h = (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') { if (filtered[selected]) { onNavigate(filtered[selected].id); onClose(); } }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, filtered, selected, onNavigate, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="cmd-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}>
          <motion.div className="cmd-box" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <Search size={18} style={{ color: 'var(--text3)', flexShrink: 0 }} />
              <input ref={inputRef} className="cmd-input" style={{ padding: 0, flex: 1, background: 'none', border: 'none', fontSize: '0.9rem' }}
                placeholder="Search panels, notes, tasks..." value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }} />
              <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--surface3)', borderRadius: 4, color: 'var(--text3)' }}>ESC</span>
            </div>
            <div className="cmd-results">
              {filtered.map((item, i) => (
                <div key={item.id} className={`cmd-item ${i === selected ? 'selected' : ''}`}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  onMouseEnter={() => setSelected(i)}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', flexShrink: 0 }}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{item.group}</div>
                  </div>
                  {i === selected && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text3)' }}>↵ Enter</span>}
                </div>
              ))}
              {filtered.length === 0 && <div className="empty-state" style={{ padding: '24px' }}>No results for "{query}"</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
