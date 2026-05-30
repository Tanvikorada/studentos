import StyledText from '../components/StyledText';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDB, mutateDB, GRADE_POINTS, calcCGPA, calcGradeFromMarks, toast, aiAnalyze } from '../store';
import { Plus, Trash2, TrendingUp, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Calculator, Award, BookOpen, Sparkles, Target } from 'lucide-react';

const gradeColor = (g) => {
  const gp = GRADE_POINTS[g] || 0;
  if (gp >= 9) return 'var(--mint2)';
  if (gp >= 7) return 'var(--violet2)';
  if (gp >= 5) return 'var(--amber)';
  return 'var(--red)';
};

function CircleRing({ value, max = 10, color = 'var(--violet2)', label = 'CGPA' }) {
  const r = 70, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(parseFloat(value) / max, 1);
  const dash = pct * circ;
  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      <svg width={160} height={160} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          style={{ fontSize: '2.4rem', fontWeight: 800, color, textShadow: `0 0 30px ${color}55` }}>
          {value}
        </motion.div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: -4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>/ {max} {label}</div>
      </div>
    </div>
  );
}

function GPACurve({ semesters }) {
  if (semesters.length < 2) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, gap: 8, opacity: 0.4 }}>
      <TrendingUp size={24} />
      <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Add ≥ 2 semesters to see your performance curve</span>
    </div>
  );
  const w = 420, h = 130, padX = 30, padY = 24;
  const sgpas = semesters.map(sem => {
    let pts = 0, creds = 0;
    (sem.subjects || []).forEach(s => { pts += (GRADE_POINTS[s.grade] || 0) * s.credits; creds += s.credits; });
    return creds > 0 ? parseFloat((pts / creds).toFixed(2)) : 0;
  });
  const maxGPA = 10, minGPA = Math.max(0, Math.min(...sgpas) - 1);
  const dx = (w - padX * 2) / Math.max(sgpas.length - 1, 1);
  const dy = (h - padY * 2) / (maxGPA - minGPA);
  const pts = sgpas.map((g, i) => `${padX + i * dx},${h - padY - (g - minGPA) * dy}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--violet)" />
          <stop offset="100%" stopColor="var(--mint2)" />
        </linearGradient>
      </defs>
      <motion.polyline points={pts} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
      {sgpas.map((g, i) => (
        <g key={i} transform={`translate(${padX + i * dx},${h - padY - (g - minGPA) * dy})`}>
          <motion.circle cx="0" cy="0" r="5" fill="var(--surface)" stroke="var(--mint2)" strokeWidth="2"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.1 }} />
          <motion.text x="0" y="-12" textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="700"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.1 }}>
            {g.toFixed(2)}
          </motion.text>
          <text x="0" y={h - padY - (g - minGPA) * dy + 18} textAnchor="middle" fill="var(--text3)" fontSize="9">{semesters[i].name?.replace('Semester ', 'Sem ')}</text>
        </g>
      ))}
    </svg>
  );
}

function GradeSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${gradeColor(value)}44`, borderRadius: 8, color: gradeColor(value), fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 58, justifyContent: 'center', fontSize: '0.95rem' }}>
        {value} <ChevronDown size={11} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }}
              style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6, zIndex: 10, background: 'var(--surface2)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, boxShadow: '0 16px 50px rgba(0,0,0,0.7)' }}>
              {Object.keys(GRADE_POINTS).map(g => (
                <div key={g} onClick={() => { onChange(g); setOpen(false); }}
                  style={{ padding: '8px 10px', textAlign: 'center', cursor: 'pointer', borderRadius: 6, background: value === g ? `${gradeColor(g)}22` : 'transparent', color: gradeColor(g), fontWeight: 700, border: value === g ? `1px solid ${gradeColor(g)}44` : '1px solid transparent', transition: 'all 0.15s', fontSize: '0.9rem' }}>
                  {g}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BarChartMini() {
  return (
    <span style={{ width: 16, height: 16, display: 'inline-grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, alignItems: 'end' }}>
      <span style={{ height: 7, background: 'var(--violet2)', borderRadius: 2 }} />
      <span style={{ height: 12, background: 'var(--mint2)', borderRadius: 2 }} />
      <span style={{ height: 9, background: 'var(--amber)', borderRadius: 2 }} />
    </span>
  );
}

export default function GPA() {
  const db = useDB();
  const [expandedSem, setExpandedSem] = useState(null);
  const [marksMode, setMarksMode] = useState(false); // toggle marks vs grade input
  const [targetCGPA, setTargetCGPA] = useState(db.gpa?.targets?.desiredCGPA || '8.5');
  const [advisor, setAdvisor] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const semesters = db.gpa?.semesters || [];
  const cgpa = calcCGPA(semesters);
  const cgpaNum = parseFloat(cgpa) || 0;

  const cgpaColor = cgpaNum >= 8.5 ? 'var(--mint2)' : cgpaNum >= 7 ? 'var(--violet2)' : cgpaNum >= 5 ? 'var(--amber)' : 'var(--red)';
  const cgpaLabel = cgpaNum >= 9 ? '🏆 Distinction' : cgpaNum >= 7.5 ? '⭐ First Class' : cgpaNum >= 6 ? 'Second Class' : cgpaNum > 0 ? 'Pass Class' : '—';

  const addSem = () => {
    const id = Date.now().toString();
    mutateDB(d => {
      if (!d.gpa) d.gpa = { semesters: [] };
      d.gpa.semesters.push({ id, name: `Semester ${d.gpa.semesters.length + 1}`, subjects: [] });
    }, 'Added semester');
    setExpandedSem(id);
  };

  const addSubject = (semId) => {
    mutateDB(d => {
      const sem = d.gpa.semesters.find(s => s.id === semId);
      if (sem) sem.subjects.push({ id: Date.now().toString(), name: 'New Subject', credits: 3, grade: 'A', marks: '' });
    }, 'Added subject');
    setExpandedSem(semId);
  };

  const updateSubject = (semId, subId, key, val) => {
    mutateDB(d => {
      const sem = d.gpa.semesters.find(s => s.id === semId);
      const sub = sem?.subjects.find(x => x.id === subId);
      if (!sub) return;
      sub[key] = val;
      // Auto-calculate grade from marks
      if (key === 'marks') {
        const grade = calcGradeFromMarks(val);
        if (grade) sub.grade = grade;
      }
    });
  };

  const deleteSubject = (semId, subId) => {
    mutateDB(d => {
      const sem = d.gpa.semesters.find(s => s.id === semId);
      if (sem) sem.subjects = sem.subjects.filter(x => x.id !== subId);
    }, 'Deleted subject');
  };

  const deleteSem = (semId) => {
    if (!window.confirm('Delete this semester and all its subjects?')) return;
    mutateDB(d => { d.gpa.semesters = d.gpa.semesters.filter(s => s.id !== semId); }, 'Deleted semester');
    setExpandedSem(null);
  };

  const semSGPA = (sem) => {
    if (!(sem.subjects || []).length) return '—';
    let pts = 0, creds = 0;
    (sem.subjects || []).forEach(s => { pts += (GRADE_POINTS[s.grade] || 0) * s.credits; creds += s.credits; });
    return creds > 0 ? (pts / creds).toFixed(2) : '—';
  };

  const totalCredits = semesters.reduce((a, s) => a + (s.subjects || []).reduce((b, x) => b + (x.credits || 0), 0), 0);
  const remainingCreditsGuess = Math.max(0, 160 - totalCredits);
  const requiredFutureGPA = remainingCreditsGuess > 0
    ? (((parseFloat(targetCGPA) || 0) * (totalCredits + remainingCreditsGuess) - (cgpaNum * totalCredits)) / remainingCreditsGuess)
    : 0;
  const gradeDistribution = semesters.flatMap(s => s.subjects || []).reduce((acc, sub) => {
    acc[sub.grade] = (acc[sub.grade] || 0) + 1;
    return acc;
  }, {});

  const askAdvisor = async () => {
    setAdvisorLoading(true);
    const result = await aiAnalyze({ semesters, cgpa, targetCGPA, gradeDistribution }, 'How can I improve my GPA? Give personalized academic advice based on grades, weak subjects, credits, and target CGPA.');
    setAdvisor(result);
    setAdvisorLoading(false);
  };

  return (
    <div className="animate-fade" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <StyledText text="GPA Calculator" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>Track your academic performance semester by semester</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Marks / Grade toggle */}
          <button
            onClick={() => setMarksMode(m => !m)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.8rem', color: marksMode ? 'var(--mint2)' : 'var(--text2)', transition: 'all 0.2s' }}>
            {marksMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {marksMode ? 'Marks → Auto Grade' : 'Manual Grade Mode'}
          </button>
          <button className="btn btn-primary" onClick={addSem}><Plus size={16} /> Add Semester</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-2 mb-6">
        {/* CGPA Ring */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <CircleRing value={cgpa} color={cgpaColor} />
              <div style={{ marginTop: 12, fontWeight: 800, fontSize: '1.1rem' }}>Overall CGPA</div>
              <div style={{ marginTop: 6, padding: '4px 14px', borderRadius: 99, background: `${cgpaColor}18`, border: `1px solid ${cgpaColor}44`, fontSize: '0.75rem', fontWeight: 700, color: cgpaColor }}>
                {cgpaLabel}
              </div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 28, minWidth: 160 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Performance Curve</div>
              <GPACurve semesters={semesters} />
              <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--violet2)' }}>{semesters.length}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Semesters</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--mint2)' }}>{totalCredits}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Credits Earned</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Point Matrix */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={16} style={{ color: 'var(--violet2)' }} /> Grade Point Matrix
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
            {Object.entries(GRADE_POINTS).map(([g, p]) => (
              <div key={g} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${gradeColor(g)}22`, borderRadius: 10 }}>
                <span style={{ fontWeight: 800, color: gradeColor(g), fontSize: '1.05rem' }}>{g}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{p} pts</span>
              </div>
            ))}
          </div>
          {marksMode && (
            <div style={{ padding: 14, background: 'rgba(0,255,200,0.04)', border: '1px solid rgba(0,255,200,0.15)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mint2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Marks → Grade Scale (B.Tech 10-pt)</div>
              {[['≥ 90','O','10'],['80–89','A+','9'],['70–79','A','8'],['60–69','B+','7'],['50–59','B','6'],['45–49','C','5'],['< 45','F','0']].map(([m,g,p]) => (
                <div key={g} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--text3)' }}>{m} marks</span>
                  <span style={{ color: gradeColor(g), fontWeight: 700 }}>{g}</span>
                  <span>{p} GP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-title"><Target size={16} /> Target CGPA Planner</div>
          <div className="grid-2" style={{ alignItems: 'end' }}>
            <div>
              <label className="label">Target CGPA</label>
              <input className="input" type="number" min="0" max="10" step="0.01" value={targetCGPA}
                onChange={e => {
                  setTargetCGPA(e.target.value);
                  mutateDB(d => { if (!d.gpa.targets) d.gpa.targets = {}; d.gpa.targets.desiredCGPA = e.target.value; });
                }} />
            </div>
            <div>
              <div className="stat-value" style={{ color: requiredFutureGPA <= 10 ? 'var(--mint2)' : 'var(--red)', fontSize: '2rem' }}>
                {remainingCreditsGuess ? requiredFutureGPA.toFixed(2) : '0.00'}
              </div>
              <div className="stat-label">needed avg GPA over remaining estimated credits</div>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 12 }}>Assumes a 160-credit degree. Adjust completed semesters and credits for a sharper estimate.</p>
        </div>

        <div className="card">
          <div className="section-title"><Sparkles size={16} /> AI Academic Advisor</div>
          <button className="btn btn-secondary btn-sm" onClick={askAdvisor} disabled={advisorLoading}>
            <Sparkles size={14} /> {advisorLoading ? 'Analyzing...' : 'How can I improve?'}
          </button>
          {advisor && <p className="text-muted" style={{ marginTop: 14, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{advisor}</p>}
          {!advisor && <p className="text-muted" style={{ marginTop: 14, fontSize: '0.85rem' }}>Uses your grades, credits, and target CGPA to suggest the highest-impact subjects and study strategy.</p>}
        </div>
      </div>

      {Object.keys(gradeDistribution).length > 0 && (
        <div className="card mb-6">
          <div className="section-title"><BarChartMini /> Subject-wise Grade Distribution</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {Object.keys(GRADE_POINTS).map(g => {
              const count = gradeDistribution[g] || 0;
              const max = Math.max(...Object.values(gradeDistribution), 1);
              return (
                <div key={g} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 40px', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, color: gradeColor(g) }}>{g}</span>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${(count / max) * 100}%`, background: gradeColor(g) }} /></div>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {semesters.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--violet2)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Calculator size={32} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Start Tracking Your GPA</h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 24px' }}>
            Add your first semester, then input subjects with {marksMode ? 'marks out of 100' : 'grades directly'}. Your CGPA will be calculated automatically.
          </p>
          <button className="btn btn-primary" onClick={addSem}><Plus size={16} /> Add Your First Semester</button>
        </motion.div>
      )}

      {/* Semesters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {semesters.map((sem, idx) => {
          const isExpanded = expandedSem === sem.id;
          const sgpa = semSGPA(sem);
          const sgpaNum = parseFloat(sgpa) || 0;
          const semCredits = (sem.subjects || []).reduce((a, s) => a + (s.credits || 0), 0);
          return (
            <motion.div key={sem.id} layout className={`card ${isExpanded ? 'card-glow' : ''}`}
              style={{ overflow: 'visible', transition: 'box-shadow 0.3s' }}>
              {/* Semester Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpandedSem(isExpanded ? null : sem.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} style={{ color: 'var(--text3)' }}>
                    <ChevronRight size={18} />
                  </motion.div>
                  <input
                    value={sem.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => mutateDB(d => { const s = d.gpa.semesters.find(x => x.id === sem.id); if(s) s.name = e.target.value; })}
                    style={{ fontWeight: 800, fontSize: '1.05rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', cursor: 'text', maxWidth: 180 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {sgpa !== '—' && (
                      <span style={{ padding: '3px 12px', borderRadius: 99, background: `${gradeColor(sgpaNum >= 9 ? 'O' : sgpaNum >= 7 ? 'A' : 'B')}18`, border: `1px solid ${gradeColor(sgpaNum >= 9 ? 'O' : sgpaNum >= 7 ? 'A' : 'B')}44`, fontSize: '0.75rem', fontWeight: 700, color: gradeColor(sgpaNum >= 9 ? 'O' : sgpaNum >= 7 ? 'A' : 'B') }}>
                        SGPA {sgpa}
                      </span>
                    )}
                    <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem', color: 'var(--text3)' }}>
                      {semCredits} credits
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm" onClick={() => addSubject(sem.id)}><Plus size={14} /> Subject</button>
                  <button onClick={() => deleteSem(sem.id)} style={{ color: 'var(--red)', opacity: 0.5, padding: '6px', borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = 'transparent'; }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Subjects Table */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {(sem.subjects || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text3)', fontSize: '0.85rem' }}>
                          <BookOpen size={24} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                          No subjects yet. Click "+ Subject" to add one.
                        </div>
                      ) : (
                        <table className="table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Subject Name</th>
                              <th style={{ width: 90, textAlign: 'center' }}>Credits</th>
                              {marksMode && <th style={{ width: 110, textAlign: 'center' }}>Marks /100</th>}
                              <th style={{ width: 120, textAlign: 'center' }}>Grade</th>
                              <th style={{ width: 80, textAlign: 'center' }}>Points</th>
                              <th style={{ width: 50 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(sem.subjects || []).map(sub => (
                              <tr key={sub.id}>
                                <td>
                                  <input className="input" value={sub.name}
                                    onChange={e => updateSubject(sem.id, sub.id, 'name', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', fontWeight: 500 }} />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <input className="input" type="number" min={1} max={6} value={sub.credits}
                                    onChange={e => updateSubject(sem.id, sub.id, 'credits', parseInt(e.target.value) || 1)}
                                    style={{ width: 60, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: 'none' }} />
                                </td>
                                {marksMode && (
                                  <td style={{ textAlign: 'center' }}>
                                    <input className="input" type="number" min={0} max={100} value={sub.marks || ''}
                                      placeholder="0–100"
                                      onChange={e => updateSubject(sem.id, sub.id, 'marks', e.target.value)}
                                      style={{ width: 80, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: 'none' }} />
                                  </td>
                                )}
                                <td style={{ textAlign: 'center' }}>
                                  <GradeSelector value={sub.grade} onChange={val => updateSubject(sem.id, sub.id, 'grade', val)} />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: gradeColor(sub.grade) }}>
                                    {GRADE_POINTS[sub.grade] || 0}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button onClick={() => deleteSubject(sem.id, sub.id)}
                                    style={{ color: 'var(--red)', opacity: 0.5, padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = 'transparent'; }}>
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {(sem.subjects || []).length > 0 && (
                        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 24 }}>
                            <div><span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Total Credits: </span><span style={{ fontWeight: 700, color: 'var(--text2)' }}>{semCredits}</span></div>
                            <div><span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Subjects: </span><span style={{ fontWeight: 700, color: 'var(--text2)' }}>{(sem.subjects || []).length}</span></div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>Semester GPA:</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: gradeColor(sgpaNum >= 9 ? 'O' : sgpaNum >= 7 ? 'A' : 'B'), textShadow: `0 0 20px ${gradeColor(sgpaNum >= 9 ? 'O' : sgpaNum >= 7 ? 'A' : 'B')}44` }}>
                              {sgpa}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
