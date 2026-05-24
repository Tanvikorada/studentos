import StyledText from '../components/StyledText';
import { useState } from 'react';
import { useDB, mutateDB, toast } from '../store';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

const STATUSES = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];
const STATUS_COLORS = { Wishlist: 'var(--text2)', Applied: 'var(--violet2)', Interview: 'var(--amber)', Offer: 'var(--mint2)', Rejected: 'var(--red)' };

export default function Internships() {
  const db = useDB();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ role: '', company: '', status: 'Wishlist', applied: '', link: '' });
  const [drag, setDrag] = useState(null);

  const add = () => {
    if (!form.role || !form.company) { toast.error('Role and company required'); return; }
    mutateDB(d => { d.internships.push({ id: Date.now().toString(), ...form }); }, `Added: ${form.role} at ${form.company}`);
    setAdding(false); setForm({ role: '', company: '', status: 'Wishlist', applied: '', link: '' });
    toast.success('Added to tracker');
  };

  const move = (id, status) => {
    mutateDB(d => { const i = d.internships.find(x => x.id === id); if (i) i.status = status; }, 'Moved application');
  };

  const del = (id) => {
    mutateDB(d => { d.internships = d.internships.filter(x => x.id !== id); }, 'Deleted application');
  };


  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <StyledText text="Internship Tracker" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add Application</button>
      </div>

      {adding && (
        <div className="card mb-4">
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>New Application</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="grid-2">
              <div><label className="label">Role</label><input className="input" placeholder="Software Engineer Intern" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} autoFocus /></div>
              <div><label className="label">Company</label><input className="input" placeholder="Google" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Applied Date</label><input className="input" type="date" value={form.applied} onChange={e => setForm(f => ({ ...f, applied: e.target.value }))} /></div>
            </div>
            <div><label className="label">Job Link</label><input className="input" placeholder="https://..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={add}>Add</button>
              <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="kanban-board">
        {STATUSES.map(status => {
          const items = db.internships.filter(i => i.status === status);
          return (
            <div key={status} className="kanban-col"
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (drag) { move(drag, status); setDrag(null); } }}>
              <div className="kanban-col-header">
                <span style={{ color: STATUS_COLORS[status] }}>{status}</span>
                <span className="badge badge-gray">{items.length}</span>
              </div>
              {items.map(item => (
                <div key={item.id} className="kanban-card" draggable onDragStart={() => setDrag(item.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.role}</div>
                    <button onClick={() => del(item.id)} style={{ color: 'var(--red)', opacity: 0.5 }}><Trash2 size={12} /></button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginBottom: 6 }}>{item.company}</div>
                  {item.applied && <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>Applied: {item.applied}</div>}
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.65rem', color: 'var(--violet2)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      <ExternalLink size={10} /> View listing
                    </a>
                  )}
                </div>
              ))}
              {items.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: '0.75rem', color: 'var(--text3)' }}>Drop here</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
