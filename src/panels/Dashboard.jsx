import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDB, calcAttendance, calcCGPA, mutateDB, aiAnalyze, toast } from '../store';
import {
  CheckSquare, AlertTriangle, BookOpen, Activity, Clock, Calculator,
  BarChart3, Sparkles, Target, Plus, Flame, ArrowRight, TrendingUp,
  FileText, Award, Code, Brain, Zap, ChevronRight,
} from 'lucide-react';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

function calcActivityStreak(productivity = []) {
  const active = new Set(productivity.filter(p => p.count > 0).map(p => p.date));
  let streak = 0;
  const cursor = new Date();
  while (active.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatCountdown(due) {
  const ms = new Date(due).getTime() - Date.now();
  if (Number.isNaN(ms)) return 'No date';
  if (ms < 0) return 'Overdue';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${Math.max(1, Math.floor((ms % 3600000) / 60000))}m`;
}

function calcPlacementScore(db) {
  let score = 0;
  const basics = db.resumeData?.basics || {};
  if (basics.name) score += 10;
  if (basics.summary) score += 10;
  if ((db.resumeData?.education || []).length > 0) score += 10;
  if ((db.resumeData?.experience || []).length > 0) score += 10;
  if ((db.projects || []).length > 0) score += 15;
  if ((db.skills || []).length > 0) score += 10;
  if ((db.certs || []).length > 0) score += 10;
  if (db.github?.username) score += 10;
  if ((db.interviewHistory || []).length > 0) score += 10;
  if (basics.email && basics.phone) score += 5;
  return Math.min(100, score);
}

function HealthBar({ label, value, max = 100, color, onClick, subtext }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const status = pct >= 75 ? 'good' : pct >= 60 ? 'warn' : 'risk';
  const statusColor = status === 'good' ? 'var(--mint)' : status === 'warn' ? 'var(--amber)' : 'var(--red)';

  return (
    <div
      onClick={onClick}
      className="glass-card"
      style={{
        padding: '16px 20px', 
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={e => {
        if(onClick) {
          e.currentTarget.style.borderColor = 'var(--border2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)';
        }
      }}
      onMouseLeave={e => {
        if(onClick) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: statusColor }}>
            {value}{max !== 100 ? `/${max}` : '%'}
          </span>
          {onClick && <ChevronRight size={13} color="var(--text3)" />}
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ height: '100%', background: statusColor, borderRadius: 99 }}
        />
      </div>
      {subtext && <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 5 }}>{subtext}</div>}
    </div>
  );
}

function PlacementGauge({ score }) {
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const strokeDash = circ * 0.75; // 3/4 arc
  const offset = strokeDash - (score / 100) * strokeDash;
  const color = score >= 70 ? 'var(--mint)' : score >= 45 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px' }}>
      <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(135deg)', filter: `drop-shadow(0 0 8px ${color}40)` }}>
          <circle cx="50" cy="50" r={radius} stroke="var(--surface3)" strokeWidth="8" fill="none" strokeDasharray={`${strokeDash} ${circ}`} />
          <motion.circle
            cx="50" cy="50" r={radius}
            stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circ}`}
            initial={{ strokeDashoffset: strokeDash }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>/ 100</span>
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 6, color: 'var(--text)' }}>Placement Readiness</div>
        <div className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
          {score < 40 && 'Add projects, skills, and resume details to improve your score.'}
          {score >= 40 && score < 70 && 'Good progress! Complete your resume and add certifications.'}
          {score >= 70 && 'Strong profile. Keep up with mock interviews and coding practice.'}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate, onOpenAI }) {
  const db = useDB();
  const [briefing, setBriefing] = useState(db.studyPlan?.dailyBriefing || '');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [quickTask, setQuickTask] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [priorities, setPriorities] = useState([]);
  const [prioritiesLoading, setPrioritiesLoading] = useState(false);

  const semesters = db.gpa?.semesters || [];
  const cgpa = parseFloat(calcCGPA(semesters)) || 0;

  const attRecords = db.attendance || [];
  let totalPresent = 0, totalClasses = 0;
  attRecords.forEach(subj => {
    const { present, total } = calcAttendance(subj.records);
    totalPresent += present;
    totalClasses += total;
  });
  const avgAtt = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
  const atRiskSubjects = attRecords.filter(s => {
    const { pct } = calcAttendance(s.records || []);
    return pct < 75 && s.records?.length > 0;
  });

  const doneTasks = (db.tasks || []).filter(t => t.done).length;
  const totalTasks = (db.tasks || []).length;
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueTasks = (db.tasks || []).filter(t => !t.done && t.due && new Date(t.due) < new Date());
  const todoTasks = (db.tasks || []).filter(t => !t.done).slice(0, 5);
  const nearestTask = (db.tasks || []).filter(t => !t.done && t.due).sort((a, b) => new Date(a.due) - new Date(b.due))[0];

  const streak = calcActivityStreak(db.productivity || []);
  const placementScore = calcPlacementScore(db);
  const todayKey = new Date().toISOString().split('T')[0];
  const hasKey = !!(window.localStorage.getItem('studentos_groq_key') || window.localStorage.getItem('studentos_openai_key'));

  // Auto-briefing
  useEffect(() => {
    if (!hasKey || db.studyPlan?.lastBriefingDate === todayKey || briefingLoading) return;
    const run = async () => {
      setBriefingLoading(true);
      const result = await aiAnalyze(
        { date: todayKey, tasks: db.tasks, attendance: db.attendance, gpa: db.gpa, timetable: db.timetable },
        'Write a short daily academic briefing with 3-4 bullet points. Each bullet should be specific, actionable, and start with an emoji. Cover: deadline urgency, attendance risks (if any), GPA status, and one study suggestion. Keep each bullet under 15 words. No intro sentence.'
      );
      setBriefing(result);
      mutateDB(d => {
        d.studyPlan.dailyBriefing = result;
        d.studyPlan.lastBriefingDate = todayKey;
      });
      setBriefingLoading(false);
    };
    run();
  }, [hasKey, db.studyPlan?.lastBriefingDate, todayKey]);

  // Smart priorities
  const generatePriorities = async () => {
    if (!hasKey) return;
    setPrioritiesLoading(true);
    const result = await aiAnalyze(
      { tasks: db.tasks, attendance: db.attendance, gpa: db.gpa, timetable: db.timetable },
      'Generate exactly 4 ultra-concise priority action items for this student TODAY. Return ONLY a JSON array of strings. Each string max 8 words. Examples: "Review Networks chapter 4", "Mark today DBMS attendance", "Submit lab report by 5pm". Return only the array, no other text.'
    );
    try {
      const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const arr = JSON.parse(clean);
      if (Array.isArray(arr)) setPriorities(arr.slice(0, 4));
    } catch {
      // fallback
      setPriorities([
        overdueTasks.length > 0 ? `Complete ${overdueTasks[0].title}` : 'Review your open tasks',
        atRiskSubjects.length > 0 ? `Attend ${atRiskSubjects[0].name} — attendance at risk` : 'Keep up with attendance',
        cgpa < 7 ? 'Focus on GPA improvement this week' : 'Maintain your strong GPA',
        'Update your resume with latest projects',
      ]);
    }
    setPrioritiesLoading(false);
  };

  useEffect(() => {
    if (hasKey && priorities.length === 0) generatePriorities();
  }, [hasKey]);

  const addQuickTask = () => {
    if (!quickTask.trim()) return;
    mutateDB(d => {
      d.tasks.unshift({
        id: Date.now().toString(),
        title: quickTask.trim(),
        desc: '',
        cat: 'Quick',
        status: 'todo',
        done: false,
        due: '',
        priority: 'medium',
        recurrence: 'none',
        subtasks: [],
        createdAt: new Date().toISOString(),
        completedAt: '',
      });
    }, `Added quick task: ${quickTask}`);
    setQuickTask('');
    setShowQuickAdd(false);
    toast.success('Task added');
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="animate-fade">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          {greeting()},{' '}
          <span style={{ background: 'linear-gradient(135deg, var(--violet), var(--mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {db.profile.name || 'Student'}
          </span>
        </h1>
        <p className="text-muted" style={{ marginTop: 4, fontSize: '0.875rem', fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {streak > 0 && <span style={{ marginLeft: 12, color: 'var(--amber)', fontWeight: 700 }}>🔥 {streak} day streak</span>}
        </p>
      </div>
      {/* Cinematic Bento Grid Command Center */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="bento-grid mb-6">
        
        {/* Hero Cell: AI Briefing */}
        <motion.div variants={fadeUp} className="card bento-col-8" style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, var(--surface) 100%)',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div className="section-title"><Sparkles size={16} color="var(--violet)" /> AI Daily Briefing</div>
            {!hasKey && (
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('settings')}>
                Connect AI
              </button>
            )}
          </div>
          {briefingLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
              {[80, 65, 90, 70].map((w, i) => (
                <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  style={{ height: 14, width: `${w}%`, background: 'var(--surface3)', borderRadius: 8 }} />
              ))}
            </div>
          ) : briefing ? (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-line', color: 'var(--text)', opacity: 0.9 }}>{briefing}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
              <div className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
                Connect an AI provider to unlock personalized daily intelligence — deadline alerts, attendance risks, and study suggestions.
              </div>
              <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => onNavigate?.('settings')}>
                Set up AI <ArrowRight size={14} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Smart Priorities */}
        <motion.div variants={fadeUp} className="card bento-col-4" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title"><Zap size={16} color="var(--amber)" /> Smart Priorities</div>
            {hasKey && (
              <button className="btn btn-ghost btn-sm" onClick={generatePriorities} disabled={prioritiesLoading} style={{ padding: '4px 8px' }}>
                {prioritiesLoading ? '...' : 'Refresh'}
              </button>
            )}
          </div>
          {priorities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {priorities.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    background: 'var(--surface2)', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s', border: '1px solid transparent'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}
                  onClick={() => onNavigate?.('planner')}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: 'var(--surface3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800, color: 'var(--text3)', flexShrink: 0,
                  }}>{i + 1}</div>
                  <span style={{ flex: 1, fontWeight: 500 }}>{p}</span>
                  <ChevronRight size={14} color="var(--text3)" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {!hasKey ? (
                <div className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                  AI-generated priority suggestions will appear here once you connect an AI provider.
                </div>
              ) : (
                [1, 2, 3, 4].map(i => (
                  <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                    style={{ height: 42, background: 'var(--surface2)', borderRadius: 10 }} />
                ))
              )}
            </div>
          )}
        </motion.div>

        {/* Academic Health */}
        <motion.div variants={fadeUp} className="card bento-col-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div className="section-title"><Brain size={16} color="var(--mint)" /> Academic Health</div>
            {atRiskSubjects.length > 0 && (
              <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700 }}>
                {atRiskSubjects.length} subject{atRiskSubjects.length > 1 ? 's' : ''} at risk
              </span>
            )}
          </div>
          <div className="grid-3" style={{ gap: 12 }}>
            <HealthBar
              label="Cumulative GPA"
              value={cgpa > 0 ? cgpa.toFixed(2) : 0}
              max={10}
              onClick={() => onNavigate?.('academics')}
              subtext={semesters.length > 0 ? `${semesters.length} semester${semesters.length > 1 ? 's' : ''} recorded` : 'Add your grades'}
            />
            <HealthBar
              label="Avg Attendance"
              value={avgAtt}
              max={100}
              onClick={() => onNavigate?.('academics')}
              subtext={totalClasses > 0 ? `${totalPresent}/${totalClasses} classes` : 'No attendance logged'}
            />
            <HealthBar
              label="Task Completion"
              value={taskPct}
              max={100}
              onClick={() => onNavigate?.('planner')}
              subtext={totalTasks > 0 ? `${doneTasks}/${totalTasks} done · ${overdueTasks.length} overdue` : 'No tasks added yet'}
            />
          </div>
        </motion.div>

        {/* Placement Readiness */}
        <motion.div variants={fadeUp} className="card bento-col-4" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => onNavigate?.('career')}>
          <div className="section-title" style={{ marginBottom: 18 }}><Target size={16} color="var(--violet)" /> Placement Readiness</div>
          <PlacementGauge score={placementScore} />
          <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Resume', done: !!(db.resumeData?.basics?.name) },
              { label: 'Projects', done: (db.projects || []).length > 0 },
              { label: 'Skills', done: (db.skills || []).length > 0 },
              { label: 'GitHub', done: !!db.github?.username },
            ].map(item => (
              <span key={item.label} style={{
                fontSize: '0.68rem', padding: '4px 10px', borderRadius: 99, fontWeight: 700,
                background: item.done ? 'rgba(16,185,129,0.1)' : 'var(--surface3)',
                color: item.done ? 'var(--mint)' : 'var(--text3)',
              }}>
                {item.done ? '✓ ' : '○ '}{item.label}
              </span>
            ))}
          </div>
        </motion.div>
        {/* Deadline Alert */}
        <motion.div variants={fadeUp} className="card bento-col-12" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="section-title" style={{ marginBottom: 14 }}><AlertTriangle size={15} color="var(--amber)" /> Deadline Alert</div>
          {nearestTask ? (
            <>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{nearestTask.title}</div>
              <div style={{
                fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em',
                color: new Date(nearestTask.due) < new Date() ? 'var(--red)' : 'var(--violet)',
                marginBottom: 4,
              }}>
                {formatCountdown(nearestTask.due)}
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                Due {new Date(nearestTask.due).toLocaleString()}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, alignSelf: 'flex-start' }} onClick={() => onNavigate?.('planner')}>
                View all tasks <ArrowRight size={13} />
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckSquare size={28} color="var(--mint)" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No upcoming deadlines</div>
              <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4, marginBottom: 16 }}>
                Add tasks with due dates to track your deadlines here.
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowQuickAdd(true)}>
                <Plus size={13} /> Add a task
              </button>
            </div>
          )}
          </div>
        </motion.div>
      </motion.div>

      {/* Quick add task */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card mb-6" style={{ overflow: 'hidden' }}>
            <div className="section-title" style={{ marginBottom: 12 }}><Plus size={15} /> Quick Add Task</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="What do you need to do?"
                value={quickTask}
                onChange={e => setQuickTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuickTask()}
                autoFocus
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={addQuickTask}>Add</button>
              <button className="btn btn-ghost" onClick={() => setShowQuickAdd(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Tasks + Recent Notes */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid-2 mb-6">
        <motion.div variants={fadeUp} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="section-title"><CheckSquare size={15} /> Upcoming Tasks</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowQuickAdd(v => !v)}>
              <Plus size={13} /> Add
            </button>
          </div>
          {todoTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>Your planner is clear.</div>
              <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                Use the <strong>✦ Semester Engine</strong> in Academics to auto-generate tasks from your syllabus.
              </div>
            </div>
          ) : todoTasks.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: t.priority === 'high' ? 'var(--red)' : t.priority === 'low' ? 'var(--mint)' : 'var(--violet)',
              }} />
              <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
              {t.due && <span style={{ fontSize: '0.7rem', color: new Date(t.due) < new Date() ? 'var(--red)' : 'var(--text3)', flexShrink: 0 }}>
                {formatCountdown(t.due)}
              </span>}
            </div>
          ))}
          {todoTasks.length > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={() => onNavigate?.('planner')}>
              View all tasks <ArrowRight size={13} />
            </button>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="section-title"><BookOpen size={15} /> Recent Notes</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('academics')}>View all</button>
          </div>
          {(db.notes || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>No notes yet.</div>
              <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                Ask AI to summarize your next lecture in the Academics section.
              </div>
            </div>
          ) : (db.notes || []).slice(0, 3).map(n => (
            <div key={n.id} onClick={() => onNavigate?.('academics')} style={{
              padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8,
              marginBottom: 8, cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{n.title}</div>
              <div className="text-muted" style={{
                fontSize: '0.72rem', overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
              }}>
                {n.content?.replace(/[#*`]/g, '').slice(0, 80)}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Productivity Heatmap */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title"><Activity size={15} /> Productivity Heatmap</div>
          <span className="text-muted" style={{ fontSize: '0.72rem' }}>Last 120 days</span>
        </div>
        <HeatmapView data={db.productivity || []} />
      </motion.div>
    </div>
  );
}

function HeatmapView({ data }) {
  const weeks = [];
  const now = new Date();
  const dataMap = {};
  data.forEach(d => { dataMap[d.date] = d.count; });
  for (let w = 16; w >= 0; w--) {
    const week = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (w * 7 + d));
      const key = date.toISOString().split('T')[0];
      week.push({ date: key, count: dataMap[key] || 0 });
    }
    weeks.push(week);
  }
  const getColor = c => {
    if (c === 0) return 'var(--surface3)';
    if (c <= 2) return 'rgba(139,92,246,0.3)';
    if (c <= 4) return 'rgba(139,92,246,0.55)';
    if (c <= 6) return 'rgba(139,92,246,0.75)';
    return 'var(--violet2)';
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="heatmap">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-week">
            {week.map((day, di) => (
              <div key={di} className="heatmap-cell" title={`${day.date}: ${day.count} activities`} style={{ background: getColor(day.count) }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 12, alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginRight: 4 }}>Less</span>
        {[0, 2, 4, 6, 8].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(c) }} />)}
        <span style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginLeft: 4 }}>More</span>
      </div>
    </div>
  );
}
