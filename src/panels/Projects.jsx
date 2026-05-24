import { useState } from 'react';
import { useDB, mutateDB, toast } from '../store';
import { Plus, Trash2, ExternalLink, GitBranch, Edit3, Save } from 'lucide-react';

export default function Projects() {
  const db = useDB();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', desc: '', tech: '', progress: 0, repo: '', live: '' });

  const save = () => {
    if (!form.name) { toast.error('Project name required'); return; }
    const techArr = form.tech.split(',').map(t => t.trim()).filter(Boolean);
    if (adding) {
      mutateDB(d => { d.projects.unshift({ id: Date.now().toString(), ...form, tech: techArr, progress: parseInt(form.progress) || 0 }); }, `Added project: ${form.name}`);
      toast.success('Project added');
    } else {
      mutateDB(d => {
        const p = d.projects.find(x => x.id === editing);
        if (p) Object.assign(p, { ...form, tech: techArr, progress: parseInt(form.progress) || 0 });
      }, `Updated project`);
      toast.success('Updated');
    }
    setAdding(false); setEditing(null); setForm({ name: '', desc: '', tech: '', progress: 0, repo: '', live: '' });
  };

  const del = (id) => {
    mutateDB(d => { d.projects = d.projects.filter(p => p.id !== id); }, 'Deleted project');
    toast.success('Deleted');
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ ...p, tech: p.tech.join(', ') });
    setAdding(false);
  };

  const progressColor = (n) => n >= 80 ? 'mint' : n >= 40 ? '' : 'amber';

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <StyledText text="Projects" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
        <button className="btn btn-primary" onClick={() => { setAdding(true); setEditing(null); setForm({ name: '', desc: '', tech: '', progress: 0, repo: '', live: '' }); }}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {(adding || editing) && (
        <div className="card mb-4">
          <h3 style={{ fontWeight: 600, marginBottom: 14 }}>{adding ? 'New Project' : 'Edit Project'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="grid-2">
              <div><label className="label">Project Name</label><input className="input" placeholder="MediGarden" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
              <div><label className="label">Progress (%)</label><input className="input" type="number" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} /></div>
            </div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></div>
            <div><label className="label">Tech Stack (comma-separated)</label><input className="input" placeholder="React, Firebase, Tailwind" value={form.tech} onChange={e => setForm(f => ({ ...f, tech: e.target.value }))} /></div>
            <div className="grid-2">
              <div><label className="label">GitHub URL</label><input className="input" placeholder="https://github.com/..." value={form.repo} onChange={e => setForm(f => ({ ...f, repo: e.target.value }))} /></div>
              <div><label className="label">Live URL</label><input className="input" placeholder="https://..." value={form.live} onChange={e => setForm(f => ({ ...f, live: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={save}><Save size={14} /> Save</button>
              <button className="btn btn-secondary" onClick={() => { setAdding(false); setEditing(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {db.projects.map(p => (
          <div key={p.id} className="card card-glow">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {p.repo && <a href={p.repo} target="_blank" rel="noreferrer" style={{ color: 'var(--text3)' }}><GitBranch size={16} /></a>}
                {p.live && <a href={p.live} target="_blank" rel="noreferrer" style={{ color: 'var(--text3)' }}><ExternalLink size={16} /></a>}
                <button onClick={() => startEdit(p)} style={{ color: 'var(--text3)' }}><Edit3 size={14} /></button>
                <button onClick={() => del(p.id)} style={{ color: 'var(--red)', opacity: 0.5 }}><Trash2 size={14} /></button>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>{p.desc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {p.tech.map(t => <span key={t} className="chip">{t}</span>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Progress</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.progress >= 80 ? 'var(--mint2)' : 'var(--text2)' }}>{p.progress}%</span>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${progressColor(p.progress)}`} style={{ width: `${p.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
      {db.projects.length === 0 && <div className="empty-state">Add your first project</div>}
    </div>
  );
}
