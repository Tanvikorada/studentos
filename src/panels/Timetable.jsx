import StyledText from '../components/StyledText';
import { useState } from 'react';
import { useDB, mutateDB, toast, aiAnalyze } from '../store';
import { Plus, Trash2, Sparkles, Clock, MapPin, User } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];

function findGaps(slots) {
  const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const end = sorted[i].end || sorted[i].time;
    const next = sorted[i + 1].time;
    if (end < next) gaps.push({ start: end, end: next });
  }
  return gaps;
}

export default function Timetable() {
  const db = useDB();
  const [adding, setAdding] = useState(null);
  const [form, setForm] = useState({ time: '09:00', end: '10:00', subject: '', room: '', professor: '' });
  const [suggestion, setSuggestion] = useState('');
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const nowTime = new Date().toTimeString().slice(0, 5);
  const timetable = db.timetable || {};
  const todaySlots = [...(timetable[today] || [])].sort((a, b) => a.time.localeCompare(b.time));
  const allSubs = [...new Set(Object.values(timetable).flat().map(s => s.subject))];
  const subColor = (sub) => COLORS[Math.max(0, allSubs.indexOf(sub)) % COLORS.length];

  const addSlot = () => {
    if (!form.subject) { toast.error('Subject required'); return; }
    mutateDB(d => {
      if (!d.timetable) d.timetable = {};
      if (!d.timetable[adding]) d.timetable[adding] = [];
      d.timetable[adding].push({ ...form });
      d.timetable[adding].sort((a, b) => a.time.localeCompare(b.time));
    }, `Added ${form.subject} to ${adding}`);
    setAdding(null);
    setForm({ time: '09:00', end: '10:00', subject: '', room: '', professor: '' });
    toast.success('Class added');
  };

  const deleteSlot = (day, idx) => {
    mutateDB(d => { d.timetable[day].splice(idx, 1); }, 'Removed class');
  };

  const askOptimizer = async () => {
    setSuggestionLoading(true);
    const result = await aiAnalyze({ timetable, today, tasks: db.tasks, gpa: db.gpa }, 'When should I study today? Use free periods and academic priorities. Recommend 2-3 focused blocks.');
    setSuggestion(result);
    setSuggestionLoading(false);
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <StyledText text="Weekly Timetable" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-violet">Today: {today}</span>
          <button className="btn btn-secondary btn-sm" onClick={askOptimizer} disabled={suggestionLoading}>
            <Sparkles size={14} /> {suggestionLoading ? 'Optimizing...' : 'Study slots'}
          </button>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="section-title"><Clock size={16} /> Today</div>
          {todaySlots.length === 0 ? <div className="empty-state" style={{ padding: 18 }}>No classes today</div> : todaySlots.map(slot => {
            const live = slot.time <= nowTime && (slot.end || slot.time) >= nowTime;
            return (
              <div key={`${slot.time}-${slot.subject}`} className={`today-class-row ${live ? 'live' : ''}`}>
                <div>
                  <div style={{ fontWeight: 800 }}>{slot.subject}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{slot.time} - {slot.end || '??'}{live ? ' - live now' : ''}</div>
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'right' }}>
                  {slot.room && <div><MapPin size={11} /> {slot.room}</div>}
                  {slot.professor && <div><User size={11} /> {slot.professor}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="section-title"><Sparkles size={16} /> Free Period Finder</div>
          {findGaps(todaySlots).length === 0 ? <p className="text-muted">No clear gaps between today classes.</p> : findGaps(todaySlots).map(gap => (
            <div key={`${gap.start}-${gap.end}`} className="free-gap-row">
              <span>{gap.start} - {gap.end}</span>
              <span className="badge badge-mint">Study block</span>
            </div>
          ))}
          {suggestion && <p className="text-muted" style={{ marginTop: 14, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{suggestion}</p>}
        </div>
      </div>

      <div className="timetable-grid">
        {DAYS.map(day => (
          <div key={day} className="card" style={{ border: day === today ? '1px solid rgba(124,58,237,0.4)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: day === today ? 'var(--violet2)' : 'var(--text)' }}>{day}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setAdding(day)}><Plus size={14} /></button>
            </div>

            {(timetable[day] || []).length === 0 ? (
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textAlign: 'center', padding: '8px 0' }}>No classes</div>
            ) : (
              (timetable[day] || []).map((slot, i) => (
                <div key={`${slot.time}-${i}`} className="timetable-slot" style={{ borderLeft: `3px solid ${subColor(slot.subject)}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{slot.subject}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{slot.time}{slot.end ? `-${slot.end}` : ''}</div>
                    {(slot.room || slot.professor) && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>
                        {slot.room}{slot.room && slot.professor ? ' - ' : ''}{slot.professor}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteSlot(day, i)} style={{ color: 'var(--red)', opacity: 0.4, flexShrink: 0 }}><Trash2 size={11} /></button>
                </div>
              ))
            )}

            {adding === day && (
              <div className="timetable-form">
                <div className="grid-2" style={{ gap: 6 }}>
                  <input className="input input-sm" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  <input className="input input-sm" type="time" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
                </div>
                <input className="input input-sm" placeholder="Subject name" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} autoFocus />
                <input className="input input-sm" placeholder="Room" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                <input className="input input-sm" placeholder="Professor" value={form.professor} onChange={e => setForm(f => ({ ...f, professor: e.target.value }))} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={addSlot}>Add</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setAdding(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
