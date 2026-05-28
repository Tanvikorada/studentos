import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDB, calcAttendance, calcCGPA, mutateDB, aiAnalyze, toast } from '../store';
import {
  CheckSquare, AlertTriangle, BookOpen, Activity, Clock, Calculator,
  BarChart3, Sparkles, Timer, Plus, MessageSquare, Flame,
} from 'lucide-react';

function CircularProgress({ value, max = 100, color = 'var(--violet)', label, subLabel, icon: Icon, isPercent = false, onClick }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="stat-card" onClick={onClick} style={{ alignItems: 'center', textAlign: 'center', gap: 16, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="90" height="90" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx="45" cy="45" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
          <motion.circle
            cx="45"
            cy="45"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div style={{ position: 'relative', zIndex: 1, color, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', width: 48, height: 48, boxShadow: `0 0 15px ${color}33` }}>
          <Icon size={22} />
        </div>
      </div>
      <div>
        <div className="stat-value" style={{ fontSize: '2rem', color, textShadow: `0 0 20px ${color}66` }}>
          {value}{isPercent ? '%' : ''}
        </div>
        <div className="stat-label" style={{ marginTop: 4 }}>{label}</div>
        {subLabel && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 6, fontWeight: 500 }}>{subLabel}</div>}
      </div>
    </div>
  );
}

function Heatmap({ data }) {
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
      const count = dataMap[key] || 0;
      week.push({ date: key, count });
    }
    weeks.push(week);
  }

  const getColor = (count) => {
    if (count === 0) return 'var(--surface3)';
    if (count <= 2) return 'rgba(139,92,246,0.3)';
    if (count <= 4) return 'rgba(139,92,246,0.5)';
    if (count <= 6) return 'rgba(139,92,246,0.7)';
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

function calcActivityStreak(productivity = []) {
  const active = new Set(productivity.filter(p => p.count > 0).map(p => p.date));
  let streak = 0;
  const cursor = new Date();
  while (active.has(cursor.toISOString().split('T')[0])) {
    streak += 1;
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
  const mins = Math.max(1, Math.floor((ms % 3600000) / 60000));
  return `${hours}h ${mins}m`;
}

export default function Dashboard({ onNavigate, onOpenAI }) {
  const db = useDB();
  const [briefing, setBriefing] = useState(db.studyPlan?.dailyBriefing || '');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState('');
  const [studyLoading, setStudyLoading] = useState(false);

  const semesters = db.gpa?.semesters || [];
  const cgpa = parseFloat(calcCGPA(semesters)) || 0;
  const overdueTasks = (db.tasks || []).filter(t => !t.done && t.due && new Date(t.due) < new Date());
  const doneTasks = (db.tasks || []).filter(t => t.done).length;
  const totalTasks = (db.tasks || []).length;
  const taskPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const attRecords = db.attendance || [];
  let totalPresent = 0;
  let totalClasses = 0;
  attRecords.forEach(subj => {
    const { present, total } = calcAttendance(subj.records);
    totalPresent += present;
    totalClasses += total;
  });
  const avgAtt = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;

  const todoTasks = (db.tasks || []).filter(t => !t.done).slice(0, 4);
  const recentNotes = (db.notes || []).slice(0, 3);
  const streak = calcActivityStreak(db.productivity || []);
  const nearestTask = (db.tasks || []).filter(t => !t.done && t.due).sort((a, b) => new Date(a.due) - new Date(b.due))[0];
  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!db.settings?.groqApiKey || db.studyPlan?.lastBriefingDate === todayKey || briefingLoading) return;

    const run = async () => {
      setBriefingLoading(true);
      const result = await aiAnalyze(
        { date: todayKey, tasks: db.tasks, attendance: db.attendance, gpa: db.gpa, timetable: db.timetable },
        'Write a short daily academic briefing for today. Include task priorities, attendance risks, and one study suggestion. Keep it under 120 words.'
      );
      setBriefing(result);
      mutateDB(d => {
        d.studyPlan.dailyBriefing = result;
        d.studyPlan.lastBriefingDate = todayKey;
      });
      setBriefingLoading(false);
    };

    run();
  }, [db.settings?.groqApiKey, db.studyPlan?.lastBriefingDate, todayKey]);

  const addQuickTask = () => {
    const title = window.prompt('Task title');
    if (!title?.trim()) return;
    mutateDB(d => {
      d.tasks.unshift({
        id: Date.now().toString(),
        title: title.trim(),
        desc: '',
        cat: 'Quick',
        status: 'todo',
        done: false,
        due: '',
        priority: 'medium',
        recurrence: 'none',
        subtasks: [],
        reminderState: {},
        createdAt: new Date().toISOString(),
        completedAt: '',
      });
    }, 'Added quick task');
    toast.success('Task added');
    onNavigate?.('tasks');
  };

  const generateStudyPlan = async () => {
    setStudyLoading(true);
    const result = await aiAnalyze(
      { cgpa, tasks: db.tasks, attendance: db.attendance, timetable: db.timetable, recentNotes: db.notes?.slice(0, 5) },
      'What should I study today? Create a focused 3-block plan based on weak grades, upcoming tasks, attendance risks, and schedule gaps.'
    );
    setStudyPlan(result);
    mutateDB(d => {
      d.studyPlan.recommendations = [{ id: Date.now().toString(), text: result, createdAt: new Date().toISOString() }, ...(d.studyPlan.recommendations || [])].slice(0, 10);
    }, 'Generated AI study plan');
    setStudyLoading(false);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="display text-violet" style={{ textShadow: 'var(--glow)' }}>{db.profile.name}</span>
        </h1>
        <p className="text-muted" style={{ marginTop: 6, fontSize: '0.9rem', fontWeight: 500 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="card mb-6 dashboard-briefing">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <div className="section-title" style={{ marginBottom: 10 }}><Sparkles size={16} /> AI Daily Briefing</div>
            <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
              {briefingLoading ? 'Reading your academic workspace and preparing today priorities...' : briefing || 'Add your Groq API key in Settings to unlock a personalized daily briefing.'}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('settings')}>{db.settings?.groqApiKey ? 'AI Connected' : 'Add API Key'}</button>
        </div>
      </div>

      <div className="dashboard-actions mb-6">
        <button className="btn btn-primary" onClick={addQuickTask}><Plus size={16} /> Add Task</button>
        <button className="btn btn-secondary" onClick={() => onNavigate?.('focus')}><Timer size={16} /> Start Focus</button>
        <button className="btn btn-secondary" onClick={onOpenAI}><MessageSquare size={16} /> Open AI Chat</button>
        <button className="btn btn-secondary" onClick={generateStudyPlan} disabled={studyLoading}><Sparkles size={16} /> {studyLoading ? 'Planning...' : 'What should I study?'}</button>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid-2 mb-6">
        <motion.div variants={item} className="card">
          <div className="section-title"><Flame size={16} /> Activity Streak</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="stat-value text-amber">{streak}</span>
            <span className="text-muted">day{streak === 1 ? '' : 's'} active</span>
          </div>
          <p className="text-muted" style={{ marginTop: 8, fontSize: '0.82rem' }}>Saved tasks, notes, grades, or study activity keep the streak alive.</p>
        </motion.div>
        <motion.div variants={item} className="card">
          <div className="section-title"><AlertTriangle size={16} /> Deadline Countdown</div>
          {nearestTask ? (
            <>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{nearestTask.title}</div>
              <div className={new Date(nearestTask.due) < new Date() ? 'text-red' : 'text-violet'} style={{ fontSize: '2rem', fontWeight: 800, marginTop: 8 }}>{formatCountdown(nearestTask.due)}</div>
              <p className="text-muted" style={{ fontSize: '0.78rem' }}>Due {new Date(nearestTask.due).toLocaleString()}</p>
            </>
          ) : (
            <div className="empty-state" style={{ padding: 18 }}>No dated tasks yet</div>
          )}
        </motion.div>
      </motion.div>

      {studyPlan && (
        <div className="card mb-6">
          <div className="section-title"><Sparkles size={16} /> Today&apos;s AI Study Plan</div>
          <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{studyPlan}</p>
        </div>
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="grid-3 mb-6">
        <motion.div variants={item}>
          <CircularProgress value={cgpa.toFixed(2)} max={10} color="var(--violet)" label="Cumulative GPA" subLabel="Based on completed semesters" icon={Calculator} onClick={() => onNavigate?.('gpa')} />
        </motion.div>
        <motion.div variants={item}>
          <CircularProgress value={avgAtt} max={100} color={avgAtt < 75 ? 'var(--red)' : 'var(--mint)'} label="Avg Attendance" subLabel={`${totalPresent} / ${totalClasses} Classes Present`} icon={BarChart3} isPercent onClick={() => onNavigate?.('attendance')} />
        </motion.div>
        <motion.div variants={item}>
          <CircularProgress value={taskPercent} max={100} color="var(--amber)" label="Task Completion" subLabel={`${doneTasks} / ${totalTasks} Tasks Done - ${overdueTasks.length} Overdue`} icon={CheckSquare} isPercent onClick={() => onNavigate?.('tasks')} />
        </motion.div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid-2 mb-6">
        <motion.div variants={item} className="card">
          <div className="section-title"><CheckSquare size={16} /> Upcoming Tasks</div>
          {todoTasks.length === 0 ? <div className="empty-state" style={{ padding: '16px' }}>No pending tasks</div> : (
            todoTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.due && new Date(t.due) < new Date() ? 'var(--red)' : 'var(--violet)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{t.title}</span>
                {t.due && <span style={{ fontSize: '0.7rem', color: new Date(t.due) < new Date() ? 'var(--red)' : 'var(--text3)' }}>{new Date(t.due).toLocaleDateString()}</span>}
                <span className="badge badge-gray">{t.cat}</span>
              </div>
            ))
          )}
        </motion.div>

        <motion.div variants={item} className="card">
          <div className="section-title"><Clock size={16} /> Recent Activity</div>
          {(db.recentActivity || []).slice(0, 6).map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)', marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.8rem' }}>{a.text}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{a.date} {a.time}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="card mb-6">
        <div className="section-title"><Activity size={16} /> Productivity Heatmap (120 days)</div>
        <Heatmap data={db.productivity || []} />
      </div>

      <div className="card">
        <div className="section-title"><BookOpen size={16} /> Recent Notes</div>
        <div className="grid-3">
          {recentNotes.map(n => (
            <div key={n.id} onClick={() => onNavigate?.('notes')} style={{ padding: 14, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {n.content.replace(/[#*`]/g, '').slice(0, 80)}...
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 8 }}>{n.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
