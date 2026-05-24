import { useState } from 'react';
import { useDB, mutateDB, toast } from '../store';
import { Plus, Trash2, ExternalLink, Award, Star } from 'lucide-react';

export default function CertsSkills() {
  const db = useDB();
  const [addingCert, setAddingCert] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [certForm, setCertForm] = useState({ title: '', issuer: '', date: '', link: '' });
  const [skillForm, setSkillForm] = useState({ name: '', level: 3 });

  const addCert = () => {
    if (!certForm.title) { toast.error('Title required'); return; }
    mutateDB(d => { d.certs.push({ id: Date.now().toString(), ...certForm }); }, `Added cert: ${certForm.title}`);
    setAddingCert(false); setCertForm({ title: '', issuer: '', date: '', link: '' });
    toast.success('Certificate added');
  };

  const addSkill = () => {
    if (!skillForm.name) { toast.error('Skill name required'); return; }
    mutateDB(d => {
      if (!d.skills) d.skills = [];
      d.skills.push({ id: Date.now().toString(), name: skillForm.name, level: parseInt(skillForm.level) });
    }, `Added skill: ${skillForm.name}`);
    setAddingSkill(false); setSkillForm({ name: '', level: 3 });
    toast.success('Skill added');
  };

  const delCert = (id) => { mutateDB(d => { d.certs = d.certs.filter(c => c.id !== id); }); };
  const delSkill = (id) => { mutateDB(d => { d.skills = d.skills.filter(s => s.id !== id); }); };
  const updateSkillLevel = (id, level) => {
    mutateDB(d => { const s = d.skills?.find(x => x.id === id); if (s) s.level = level; });
  };

  const skills = db.skills || [];

  return (
    <div className="animate-fade">
      <div className="grid-2">
        {/* Certificates */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}><Award size={18} style={{ color: 'var(--amber)' }} /> Certificates</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setAddingCert(true)}><Plus size={14} /></button>
          </div>

          {addingCert && (
            <div className="card mb-4">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="input" placeholder="Certificate title" value={certForm.title} onChange={e => setCertForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                <input className="input" placeholder="Issuer (Google, Coursera...)" value={certForm.issuer} onChange={e => setCertForm(f => ({ ...f, issuer: e.target.value }))} />
                <input className="input" type="date" value={certForm.date} onChange={e => setCertForm(f => ({ ...f, date: e.target.value }))} />
                <input className="input" placeholder="Certificate URL" value={certForm.link} onChange={e => setCertForm(f => ({ ...f, link: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={addCert}>Add</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setAddingCert(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {db.certs.map(c => (
              <div key={c.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>{c.issuer} {c.date && `• ${c.date}`}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {c.link && <a href={c.link} target="_blank" rel="noreferrer" style={{ color: 'var(--violet2)' }}><ExternalLink size={14} /></a>}
                    <button onClick={() => delCert(c.id)} style={{ color: 'var(--red)', opacity: 0.5 }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
            {db.certs.length === 0 && <div className="empty-state">No certificates yet</div>}
          </div>
        </div>

        {/* Skills */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}><Star size={18} style={{ color: 'var(--violet2)' }} /> Skills</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setAddingSkill(true)}><Plus size={14} /></button>
          </div>

          {addingSkill && (
            <div className="card mb-4">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><label className="label">Skill</label><input className="input" placeholder="React, Python..." value={skillForm.name} onChange={e => setSkillForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
                <div style={{ width: 80 }}><label className="label">Level (1-5)</label><input className="input" type="number" min={1} max={5} value={skillForm.level} onChange={e => setSkillForm(f => ({ ...f, level: e.target.value }))} /></div>
                <button className="btn btn-primary btn-sm" onClick={addSkill}>Add</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAddingSkill(false)}>✕</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {skills.map(s => (
              <div key={s.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => updateSkillLevel(s.id, n)}
                        style={{ width: 18, height: 18, borderRadius: 4, background: n <= s.level ? 'var(--violet)' : 'var(--surface3)', cursor: 'pointer', border: 'none', transition: 'background 0.15s' }} />
                    ))}
                    <button onClick={() => delSkill(s.id)} style={{ color: 'var(--red)', opacity: 0.5, marginLeft: 4 }}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(s.level / 5) * 100}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>
                    {['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'][s.level]}
                  </span>
                </div>
              </div>
            ))}
            {skills.length === 0 && <div className="empty-state">Add your skills</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
