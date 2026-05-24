import { useState } from 'react';
import { useDB, mutateDB, toast, calcCGPA, aiAnalyze } from '../store';
import { User, Save, Edit3, Sparkles, Award, Link as LinkIcon } from 'lucide-react';

function completeness(profile) {
  const checks = [profile.name, profile.college, profile.dept, profile.headline, profile.bio, profile.quickNote, profile.socials?.linkedin, profile.socials?.github, profile.socials?.portfolio];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function Profile() {
  const db = useDB();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...db.profile, socials: { ...(db.profile.socials || {}) } });
  const [aiLoading, setAiLoading] = useState(false);

  const save = () => {
    mutateDB(d => { d.profile = { ...d.profile, ...form, socials: { ...(d.profile.socials || {}), ...(form.socials || {}) } }; }, 'Updated profile');
    setEditing(false);
    toast.success('Profile saved');
  };

  const generateBio = async () => {
    setAiLoading(true);
    const result = await aiAnalyze({ profile: form, skills: db.skills, projects: db.projects, cgpa: calcCGPA(db.gpa?.semesters || []) }, 'Generate a truthful professional student bio in 80-100 words.');
    setForm(f => ({ ...f, bio: result }));
    setAiLoading(false);
  };

  const p = db.profile;
  const initials = p.name?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const cgpa = calcCGPA(db.gpa?.semesters || []);
  const complete = completeness(p);
  const badges = [
    { label: 'Starter', earned: true },
    { label: '100 XP', earned: (db.xp || 0) >= 100 },
    { label: '10 Tasks', earned: (db.tasks || []).filter(t => t.done).length >= 10 },
    { label: 'Focus Builder', earned: (db.focusSessions || []).length >= 3 },
  ];

  return (
    <div className="animate-fade" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,var(--violet),var(--mint))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.5rem' }}>{p.name}</h2>
            <p style={{ color: 'var(--violet2)', fontWeight: 500, fontSize: '0.875rem', marginTop: 2 }}>{p.headline}</p>
            <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: 4 }}>{p.college} - {p.dept}</p>
            <div className="progress-bar" style={{ marginTop: 14, maxWidth: 280 }}><div className="progress-fill mint" style={{ width: `${complete}%` }} /></div>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 6 }}>{complete}% profile complete</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ ...db.profile, socials: { ...(db.profile.socials || {}) } }); setEditing(e => !e); }}>
            <Edit3 size={14} /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {p.quickNote && <div style={{ padding: '10px 14px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text2)' }}>{p.quickNote}</div>}
      </div>

      <div className="grid-3 mb-4">
        <div className="stat-card"><Award size={18} className="text-violet" /><div className="stat-value">{cgpa}</div><div className="stat-label">CGPA</div></div>
        <div className="stat-card"><User size={18} className="text-mint" /><div className="stat-value">{(db.skills || []).length}</div><div className="stat-label">Skills</div></div>
        <div className="stat-card"><LinkIcon size={18} className="text-amber" /><div className="stat-value">{(db.projects || []).length}</div><div className="stat-label">Projects</div></div>
      </div>

      <div className="card mb-4">
        <div className="section-title"><Award size={16} /> Achievement Badges</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {badges.map(b => <span key={b.label} className={`badge ${b.earned ? 'badge-mint' : 'badge-gray'}`}>{b.label}</span>)}
        </div>
      </div>

      {editing ? (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Edit Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'name', label: 'Full Name' },
              { key: 'college', label: 'College / University' },
              { key: 'dept', label: 'Department' },
              { key: 'headline', label: 'Headline' },
              { key: 'quickNote', label: 'Quick Note' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input className="input" value={form[f.key] || ''} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} />
              </div>
            ))}
            {['linkedin', 'github', 'portfolio'].map(key => (
              <div key={key}>
                <label className="label">{key[0].toUpperCase() + key.slice(1)} URL</label>
                <input className="input" value={form.socials?.[key] || ''} onChange={e => setForm(x => ({ ...x, socials: { ...(x.socials || {}), [key]: e.target.value } }))} />
              </div>
            ))}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="label">Bio</label>
                <button className="btn btn-secondary btn-sm" onClick={generateBio} disabled={aiLoading}><Sparkles size={12} /> {aiLoading ? 'Writing...' : 'Generate Bio'}</button>
              </div>
              <textarea className="input" rows={4} value={form.bio || ''} onChange={e => setForm(x => ({ ...x, bio: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={save}><Save size={16} /> Save Changes</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14 }}>About</h3>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text2)' }}>{p.bio || 'No bio yet. Click Edit to add one.'}</p>
          <div className="divider" />
          <div className="grid-3">
            {['linkedin', 'github', 'portfolio'].map(key => (
              <div key={key}>
                <div className="label">{key[0].toUpperCase() + key.slice(1)}</div>
                {p.socials?.[key] ? <a href={p.socials[key]} target="_blank" rel="noreferrer" className="text-violet">Open</a> : <span className="text-faint">Not set</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
