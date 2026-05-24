import StyledText from '../components/StyledText';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDB, mutateDB, calcAttendance, toast, aiAnalyze } from '../store';
import { Plus, Trash2, CheckCircle, XCircle, Sparkles, CalendarDays, BarChart3 } from 'lucide-react';

export default function Attendance() {
  const db = useDB();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ subject: '', req: 75 });
  const [advisor, setAdvisor] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const addSubject = () => {
    if (!form.subject) { toast.error('Subject name required'); return; }
    mutateDB(d => {
      d.attendance.push({ id: Date.now().toString(), subject: form.subject, req: parseInt(form.req), records: [] });
    }, `Added subject: ${form.subject}`);
    setAdding(false); setForm({ subject: '', req: 75 });
    toast.success('Subject added');
  };

  const logRecord = (id, status) => {
    const today = new Date().toISOString().split('T')[0];
    mutateDB(d => {
      const sub = d.attendance.find(x => x.id === id);
      if (!sub) return;
      const exists = sub.records.find(r => r.date === today);
      if (exists) { exists.status = status; }
      else { sub.records.push({ date: today, status }); }
    }, `Logged attendance`);
  };

  const quickMarkAll = (status) => {
    const today = new Date().toISOString().split('T')[0];
    mutateDB(d => {
      d.attendance.forEach(sub => {
        const exists = sub.records.find(r => r.date === today);
        if (exists) exists.status = status;
        else sub.records.push({ date: today, status });
      });
    }, `Marked all ${status === 'p' ? 'present' : 'absent'}`);
    toast.success(status === 'p' ? 'Marked all present' : 'Marked all absent');
  };

  const askAdvisor = async () => {
    setAdvisorLoading(true);
    const result = await aiAnalyze({ attendance: db.attendance }, 'Review attendance risks. Warn about subjects near threshold, tell me which classes I must not miss, and summarize recovery plan.');
    setAdvisor(result);
    setAdvisorLoading(false);
  };

  const deleteSubject = (id) => {
    mutateDB(d => { d.attendance = d.attendance.filter(x => x.id !== id); }, 'Deleted subject');
    toast.success('Subject removed');
  };

  const getStatusColor = (pct, req) => {
    if (pct >= req) return 'var(--mint2)';
    if (pct >= req - 5) return 'var(--amber)';
    return 'var(--red)';
  };

  const classesNeeded = (records, req) => {
    const total = records.length;
    const present = records.filter(r => r.status === 'p').length;
    const pct = total > 0 ? (present / total) * 100 : 0;
    if (pct >= req) {
      // how many can miss
      let canMiss = 0;
      while (true) {
        const newPct = (present / (total + canMiss + 1)) * 100;
        if (newPct < req) break;
        canMiss++;
        if (canMiss > 100) break;
      }
      return { type: 'safe', count: canMiss };
    } else {
      let need = 0;
      while (true) {
        need++;
        const newPct = ((present + need) / (total + need)) * 100;
        if (newPct >= req) break;
        if (need > 200) break;
      }
      return { type: 'danger', count: need };
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const allRecords = db.attendance.flatMap(s => (s.records || []).map(r => ({ ...r, subject: s.subject })));
  const presentCount = allRecords.filter(r => r.status === 'p').length;
  const avgPct = allRecords.length ? Math.round((presentCount / allRecords.length) * 100) : 100;
  const riskySubjects = db.attendance.filter(s => calcAttendance(s.records).pct < (s.req || 75) + 5);
  const calendarDays = Array.from({ length: 21 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (20 - i));
    const date = d.toISOString().split('T')[0];
    const records = allRecords.filter(r => r.date === date);
    const present = records.filter(r => r.status === 'p').length;
    return { date, total: records.length, present };
  });

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <StyledText text="Attendance Tracker" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => quickMarkAll('p')}><CheckCircle size={16} /> Mark All Present</button>
          <button className="btn btn-secondary" onClick={() => quickMarkAll('a')}><XCircle size={16} /> Mark All Absent</button>
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add Subject</button>
        </div>
      </div>

      <div className="grid-3 mb-4">
        <div className="stat-card"><BarChart3 size={18} className="text-violet" /><div className="stat-value">{avgPct}%</div><div className="stat-label">Overall attendance</div></div>
        <div className="stat-card"><CalendarDays size={18} className="text-mint" /><div className="stat-value">{allRecords.length}</div><div className="stat-label">Classes logged</div></div>
        <div className="stat-card"><Sparkles size={18} className="text-amber" /><div className="stat-value">{riskySubjects.length}</div><div className="stat-label">Subjects needing attention</div></div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="section-title"><CalendarDays size={16} /> 21-Day Calendar</div>
          <div className="attendance-calendar">
            {calendarDays.map(day => {
              const pct = day.total ? Math.round((day.present / day.total) * 100) : 0;
              const bg = day.total === 0 ? 'var(--surface3)' : pct >= 75 ? 'rgba(16,185,129,0.55)' : pct > 0 ? 'rgba(245,158,11,0.55)' : 'rgba(244,63,94,0.55)';
              return <div key={day.date} className="attendance-day" style={{ background: bg }} title={`${day.date}: ${day.present}/${day.total}`} />;
            })}
          </div>
        </div>
        <div className="card">
          <div className="section-title"><Sparkles size={16} /> AI Attendance Advisor</div>
          <button className="btn btn-secondary btn-sm" onClick={askAdvisor} disabled={advisorLoading}>
            <Sparkles size={14} /> {advisorLoading ? 'Checking...' : 'Review risk'}
          </button>
          <p className="text-muted" style={{ marginTop: 14, whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.85rem' }}>
            {advisor || 'Get a personalized warning list and recovery strategy based on each subject threshold.'}
          </p>
        </div>
      </div>

      {adding && (
        <div className="card mb-4">
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>New Subject</h3>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <label className="label">Subject Name</label>
              <input className="input" placeholder="e.g. Big Data Analytics" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="label">Required % (e.g. 75)</label>
              <input className="input" type="number" min={50} max={100} value={form.req} onChange={e => setForm(f => ({ ...f, req: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={addSubject}>Add</button>
            <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {db.attendance.map(sub => {
          const { pct, present, total } = calcAttendance(sub.records);
          const color = getStatusColor(pct, sub.req);
          const info = classesNeeded(sub.records, sub.req);
          const todayRecord = sub.records.find(r => r.date === todayStr);

          const radius = 34;
          const circumference = 2 * Math.PI * radius;
          const percentage = Math.min(100, Math.max(0, pct));
          const strokeDashoffset = circumference - (percentage / 100) * circumference;

          return (
            <div key={sub.id} className="card card-glow" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              
              {/* Circular SVG Meter */}
              <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                  <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                  <motion.circle 
                    cx="40" cy="40" r={radius} 
                    stroke={color} strokeWidth="6" fill="none" 
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                  />
                </svg>
                <div style={{ position: 'relative', zIndex: 1, color, fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', textShadow: `0 0 15px ${color}66` }}>
                  {pct}%
                </div>
              </div>

              {/* Subject details & actions */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{sub.subject}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4, fontWeight: 500 }}>
                      Required: {sub.req}% • {present}/{total} classes attended
                    </div>
                  </div>
                  <button onClick={() => deleteSubject(sub.id)} style={{ color: 'var(--red)', opacity: 0.5, transition: 'opacity 0.2s', padding: 4 }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0.5}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    {info.type === 'safe'
                      ? <span className="badge badge-mint" style={{ padding: '4px 10px', boxShadow: '0 0 10px rgba(16,185,129,0.1)' }}>✓ Safe to miss {info.count}</span>
                      : <span className="badge badge-red" style={{ padding: '4px 10px', boxShadow: '0 0 10px rgba(244,63,94,0.1)' }}>⚠ Need {info.count} to recover</span>}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => logRecord(sub.id, 'p')} className="btn btn-sm"
                      style={{ background: todayRecord?.status === 'p' ? 'rgba(16,185,129,0.15)' : 'var(--surface2)', color: 'var(--mint2)', border: `1px solid ${todayRecord?.status === 'p' ? 'var(--mint2)' : 'var(--border)'}`, gap: 6, boxShadow: todayRecord?.status === 'p' ? '0 0 15px rgba(16,185,129,0.2)' : 'none' }}>
                      <CheckCircle size={14} /> Present
                    </button>
                    <button onClick={() => logRecord(sub.id, 'a')} className="btn btn-sm"
                      style={{ background: todayRecord?.status === 'a' ? 'rgba(244,63,94,0.15)' : 'var(--surface2)', color: 'var(--red)', border: `1px solid ${todayRecord?.status === 'a' ? 'var(--red)' : 'var(--border)'}`, gap: 6, boxShadow: todayRecord?.status === 'a' ? '0 0 15px rgba(244,63,94,0.2)' : 'none' }}>
                      <XCircle size={14} /> Absent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {db.attendance.length === 0 && <div className="empty-state">Add subjects to track attendance</div>}
      </div>
    </div>
  );
}
