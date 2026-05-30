import StyledText from '../components/StyledText';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDB, mutateDB, toast, addXP, aiAnalyze, scheduleReminder } from '../store';
import { Plus, Trash2, Calendar as CalIcon, Sparkles, Bell, BarChart3, CheckSquare } from 'lucide-react';

const COLS = [
  { id: 'todo', label: 'To Do', color: 'var(--text2)', glow: 'rgba(255,255,255,0.1)' },
  { id: 'inprogress', label: 'In Progress', color: 'var(--violet2)', glow: 'rgba(139, 92, 246, 0.15)' },
  { id: 'done', label: 'Done', color: 'var(--mint2)', glow: 'rgba(16, 185, 129, 0.15)' },
];

const taskStatus = (t) => t.done ? 'done' : t.status || 'todo';

export default function Tasks() {
  const db = useDB();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', cat: 'Academics', due: '', priority: 'medium', recurrence: 'none', desc: '' });
  const [drag, setDrag] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const addTask = () => {
    if (!form.title) { toast.error('Title required'); return; }
    const id = Date.now().toString();
    mutateDB(d => {
      d.tasks.push({
        id,
        title: form.title,
        desc: form.desc,
        cat: form.cat,
        due: form.due,
        priority: form.priority,
        recurrence: form.recurrence,
        done: false,
        status: 'todo',
        subtasks: [],
        createdAt: new Date().toISOString(),
        completedAt: '',
      });
    }, `Added task: ${form.title}`);
    if (form.due) scheduleReminder(id, form.due);
    setForm({ title: '', cat: 'Academics', due: '', priority: 'medium', recurrence: 'none', desc: '' });
    setAdding(false);
    toast.success('Task added');
  };

  const breakdownTask = async () => {
    if (!form.title.trim()) { toast.error('Enter a task first'); return; }
    setAiLoading(true);
    const result = await aiAnalyze({ task: form, timetable: db.timetable, existingTasks: db.tasks }, 'Break this vague student task into 5-7 concrete subtasks with estimated time. Return short markdown bullets only.');
    setForm(f => ({ ...f, desc: `${f.desc ? `${f.desc}\n\n` : ''}${result}` }));
    setAiLoading(false);
  };

  const askScheduling = async (task) => {
    const openTasks = (db.tasks || []).filter(t => !t.done);
    const result = await aiAnalyze({ task, timetable: db.timetable, openTasks }, 'When should I do this task? Suggest a practical time block using timetable gaps and deadline urgency.');
    toast.info(result.slice(0, 240));
  };

  const moveTask = (id, newStatus) => {
    mutateDB(d => {
      const t = d.tasks.find(x => x.id === id);
      if (t && t.status !== 'done' && newStatus === 'done') {
        // Award XP only once when moved to done
        setTimeout(() => addXP(10), 0);
      }
      if (t) {
        t.status = newStatus;
        t.done = newStatus === 'done';
        t.completedAt = newStatus === 'done' ? new Date().toISOString() : '';
      }
    }, `Moved task`);
  };

  const deleteTask = (id) => {
    mutateDB(d => { d.tasks = d.tasks.filter(t => t.id !== id); }, 'Deleted task');
  };

  const colTasks = (colId) => (db.tasks || []).filter(t => taskStatus(t) === colId);
  const weekAgo = Date.now() - 7 * 86400000;
  const doneThisWeek = (db.tasks || []).filter(t => t.done && t.completedAt && new Date(t.completedAt).getTime() >= weekAgo).length;
  const completionRate = (db.tasks && db.tasks.length) ? Math.round(((db.tasks || []).filter(t => t.done).length / db.tasks.length) * 100) : 0;

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <StyledText text="Tasks & Schedule" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="grid-3 mb-4">
        <div className="stat-card"><BarChart3 size={18} className="text-violet" /><div className="stat-value">{completionRate}%</div><div className="stat-label">Overall completion</div></div>
        <div className="stat-card"><CheckSquare size={18} className="text-mint" /><div className="stat-value">{doneThisWeek}</div><div className="stat-label">Finished this week</div></div>
        <div className="stat-card"><Bell size={18} className="text-amber" /><div className="stat-value">{(db.tasks || []).filter(t => !t.done && t.due && new Date(t.due) - Date.now() < 86400000).length}</div><div className="stat-label">Due within 24h</div></div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card mb-4 card-glow" style={{ overflow: 'hidden' }}
          >
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>New Task</h3>
            <div className="grid-3" style={{ marginBottom: 16 }}>
              <div style={{ gridColumn: 'span 3 / span 3' }}>
                <label className="label">Title</label>
                <input className="input" placeholder="Task title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              </div>
              <div style={{ gridColumn: 'span 3 / span 3' }}>
                <label className="label">Details / AI Breakdown</label>
                <textarea className="input" rows={4} placeholder="Add details, or let AI break this down..." value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
                  <option>Academics</option><option>Career</option><option>Personal</option>
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input className="input" type="datetime-local" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="label">Repeat</label>
                <select className="input" value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                  <option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={addTask}>Add Task</button>
              <button className="btn btn-secondary" onClick={breakdownTask} disabled={aiLoading}><Sparkles size={14} /> {aiLoading ? 'Breaking down...' : 'AI Breakdown'}</button>
              <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="kanban-board">
        {COLS.map(col => (
          <div key={col.id} 
            className={`glass-card kanban-col ${dragOverCol === col.id ? 'drag-over' : ''}`}
            style={{ 
              padding: '16px',
              display: 'flex', flexDirection: 'column',
              background: dragOverCol === col.id ? col.glow : 'rgba(30, 30, 42, 0.4)',
              borderColor: dragOverCol === col.id ? col.color : 'var(--border)',
              transition: 'all 0.3s ease',
            }}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => { 
              if (drag) { moveTask(drag, col.id); setDrag(null); } 
              setDragOverCol(null); 
            }}
          >
            <div className="kanban-col-header" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                <span style={{ color: col.color, fontWeight: 700, letterSpacing: '-0.01em' }}>{col.label}</span>
              </div>
              <span className="badge badge-gray" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }}>{colTasks(col.id).length}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 150 }}>
              <AnimatePresence>
                {colTasks(col.id).map(t => (
                  <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="kanban-card glass-card" draggable
                    onDragStart={() => setDrag(t.id)}
                    style={{ 
                      opacity: drag === t.id ? 0.5 : 1, 
                      padding: '14px', 
                      background: 'rgba(42, 42, 56, 0.6)', 
                      cursor: 'grab',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${col.glow}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }}>{t.title}</span>
                      <button onClick={() => deleteTask(t.id)} style={{ color: 'var(--red)', opacity: 0.3, padding: 4, marginTop: -4, marginRight: -4, transition: 'opacity 0.2s' }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}><Trash2 size={14} /></button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>{t.cat}</span>
                      <span className={`badge ${t.priority === 'high' ? 'badge-red' : t.priority === 'low' ? 'badge-gray' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>{t.priority || 'medium'}</span>
                      {t.due && (
                        <span style={{ fontSize: '0.65rem', color: new Date(t.due) < new Date() && !t.done ? 'var(--red)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <CalIcon size={10} /> {new Date(t.due).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {t.desc && <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{t.desc.slice(0, 180)}{t.desc.length > 180 ? '...' : ''}</p>}
                    
                    <div style={{ display: 'flex', gap: 6, marginTop: 12, opacity: 0.8 }}>
                      <button onClick={() => askScheduling(t)}
                        style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: 'var(--violet2)', cursor: 'pointer', fontWeight: 600 }}>
                        AI schedule
                      </button>
                      {COLS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveTask(t.id, c.id)}
                          style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: c.color, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = c.glow}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {colTasks(col.id).length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
