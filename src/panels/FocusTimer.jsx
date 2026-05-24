import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Bell, Sparkles, Music } from 'lucide-react';
import { toast, addXP, useDB, mutateDB, aiAnalyze } from '../store';

const MODES = [
  { id: 'work', label: 'Focus', color: 'var(--violet2)' },
  { id: 'short', label: 'Short Break', color: 'var(--mint2)' },
  { id: 'long', label: 'Long Break', color: 'var(--amber)' },
];

function ClockStat() {
  return <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--violet2)', display: 'inline-block' }} />;
}

export default function FocusTimer() {
  const db = useDB();
  const [durations, setDurations] = useState({ work: 25, short: 5, long: 15 });
  const [mode, setMode] = useState({ ...MODES[0], minutes: 25 });
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [subject, setSubject] = useState('');
  const [coach, setCoach] = useState('');
  const [noise, setNoise] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const total = mode.minutes * 60;
  const pct = seconds / total;

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s > 1) return s - 1;

        clearInterval(intervalRef.current);
        setRunning(false);
        if (mode.id === 'work') {
          setSessions(n => n + 1);
          mutateDB(d => {
            d.focusSessions.unshift({
              id: Date.now().toString(),
              subject: subject || 'General',
              minutes: mode.minutes,
              completedAt: new Date().toISOString(),
            });
            d.focusSessions = d.focusSessions.slice(0, 100);
          }, 'Completed focus session');
          setTimeout(() => addXP(15), 0);
          aiAnalyze({ subject, minutes: mode.minutes }, 'Give one short motivational message and one study tip after this focus session.').then(setCoach);
        }
        if (Notification.permission === 'granted') new Notification('StudentOS', { body: `${mode.label} session complete!` });
        else toast.success(`${mode.label} complete!`);
        return 0;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, mode, subject]);

  const setModeAndReset = (m) => {
    const next = { ...m, minutes: durations[m.id] || 25 };
    setMode(next);
    setSeconds(next.minutes * 60);
    setRunning(false);
  };

  const reset = () => { setSeconds(mode.minutes * 60); setRunning(false); };
  const requestNotif = () => { if (Notification.permission === 'default') Notification.requestPermission(); };

  const updateDuration = (id, value) => {
    const minutes = Math.max(1, parseInt(value) || 1);
    setDurations(d => ({ ...d, [id]: minutes }));
    if (mode.id === id && !running) {
      setMode(m => ({ ...m, minutes }));
      setSeconds(minutes * 60);
    }
  };

  const toggleNoise = () => {
    if (noise && audioRef.current) {
      audioRef.current.ctx.close();
      audioRef.current = null;
      setNoise(false);
      return;
    }
    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0.025;
    source.connect(gain).connect(ctx.destination);
    source.start();
    audioRef.current = { ctx, source };
    setNoise(true);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const r = 120;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className={`animate-fade ${running ? 'focus-ambient' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, paddingTop: 32 }}>
      <StyledText text="Focus Timer" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />

      <div style={{ display: 'flex', gap: 8, background: 'var(--surface2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setModeAndReset(m)} style={{ padding: '7px 18px', borderRadius: 8, fontWeight: 500, fontSize: '0.875rem', background: mode.id === m.id ? m.color : 'transparent', color: mode.id === m.id ? '#fff' : 'var(--text2)' }}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid-3" style={{ maxWidth: 620, width: '100%' }}>
        {MODES.map(m => (
          <div key={m.id}>
            <label className="label">{m.label} minutes</label>
            <input className="input input-sm" type="number" min="1" value={durations[m.id]} onChange={e => updateDuration(m.id, e.target.value)} />
          </div>
        ))}
      </div>

      <input className="input" style={{ maxWidth: 420 }} placeholder="What are you studying this session?" value={subject} onChange={e => setSubject(e.target.value)} />

      <div style={{ position: 'relative', width: 280, height: 280 }}>
        <svg width={280} height={280} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx={140} cy={140} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={12} />
          {running && <motion.circle cx={140} cy={140} r={r} fill="none" stroke={mode.color} strokeWidth={4} initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.15, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} style={{ transformOrigin: 'center' }} />}
          <motion.circle cx={140} cy={140} r={r} fill="none" stroke={mode.color} strokeWidth={12} strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round" animate={{ strokeDashoffset: circ - dash }} transition={{ duration: 0.5 }} style={{ filter: `drop-shadow(0 0 12px ${mode.color}88)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '3.5rem', fontWeight: 700, color: mode.color, letterSpacing: '-2px', textShadow: `0 0 20px ${mode.color}66` }}>{mm}:{ss}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>{mode.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <button onClick={reset} className="btn btn-secondary btn-icon" style={{ width: 44, height: 44, borderRadius: '50%' }}><RotateCcw size={18} /></button>
        <button onClick={() => { setRunning(runningNow => !runningNow); requestNotif(); }} style={{ width: 72, height: 72, borderRadius: '50%', background: mode.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${mode.color}66` }}>
          {running ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button onClick={requestNotif} className="btn btn-secondary btn-icon" style={{ width: 44, height: 44, borderRadius: '50%' }}><Bell size={18} /></button>
        <button onClick={toggleNoise} className={`btn ${noise ? 'btn-primary' : 'btn-secondary'} btn-icon`} style={{ width: 44, height: 44, borderRadius: '50%' }}><Music size={18} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i < (sessions % 4) ? 'var(--violet2)' : 'var(--surface3)' }} />)}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{sessions} sessions completed{sessions >= 4 ? ' - time for a long break' : ''}</span>
      </div>

      <div className="grid-2" style={{ maxWidth: 760, width: '100%' }}>
        <div className="card">
          <div className="section-title"><Sparkles size={16} /> AI Focus Coach</div>
          <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{coach || 'Complete a focus session to get a study tip.'}</p>
        </div>
        <div className="card">
          <div className="section-title"><ClockStat /> Focus Log</div>
          {(db.focusSessions || []).slice(0, 5).map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{s.subject}</span><span className="text-muted">{s.minutes}m</span>
            </div>
          ))}
          {(db.focusSessions || []).length === 0 && <p className="text-muted">No sessions logged yet.</p>}
        </div>
      </div>
    </div>
  );
}
