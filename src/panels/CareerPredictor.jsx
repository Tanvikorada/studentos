import StyledText from '../components/StyledText';
import { useState, useEffect } from 'react';
import { useDB, mutateDB, toast, calcCGPA, addXP, callGroq, aiAnalyze } from '../store';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Plus, Trash2, Zap, MessageCircle, Link as LinkIcon, CalendarClock } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// Sample data for radar chart – will be dynamically generated based on user data
const defaultRadarData = {
  labels: ['GPA', 'Projects', 'Skills', 'Internships', 'Certifications'],
  datasets: [
    {
      label: 'Your Profile',
      data: [8, 7, 6, 5, 6],
      backgroundColor: 'rgba(128, 0, 255, 0.2)',
      borderColor: 'rgba(128, 0, 255, 0.8)',
      pointBackgroundColor: 'rgba(128, 0, 255, 1)',
    },
    {
      label: 'FAANG Target',
      data: [9.5, 9, 8, 7, 8],
      backgroundColor: 'rgba(0, 200, 100, 0.2)',
      borderColor: 'rgba(0, 200, 100, 0.8)',
      pointBackgroundColor: 'rgba(0, 200, 100, 1)',
    },
  ],
};

const NETWORK_STATUSES = ['To Contact', 'Connected', 'Interviewing', 'Offer'];
const NETWORK_COLORS = { 'To Contact': 'var(--text2)', 'Connected': 'var(--violet2)', 'Interviewing': 'var(--amber)', 'Offer': 'var(--mint2)' };

export default function CareerPredictor() {
  const db = useDB();
  const [radarData, setRadarData] = useState(defaultRadarData);
  const [gapAnalysis, setGapAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const [addingNetwork, setAddingNetwork] = useState(false);
  const [networkForm, setNetworkForm] = useState({ name: '', company: '', role: '', status: 'To Contact', link: '' });
  const [drag, setDrag] = useState(null);
  const [aiDraft, setAiDraft] = useState(null);
  const [linkedinText, setLinkedinText] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [networkCoach, setNetworkCoach] = useState('');

  // Compute radar data from DB
  useEffect(() => {
    const gpa = parseFloat(db.gpa?.semesters?.reduce((acc, s) => acc + Number(calcCGPA([s]) || 0), 0) / (Math.max(db.gpa?.semesters?.length || 1, 1))) || 0;
    const projects = db.projects?.length || 0;
    const skills = db.certs?.filter(c => c.type === 'skill').length || 0;
    const internships = db.internships?.length || 0;
    const certs = db.certs?.filter(c => c.type === 'cert').length || 0;
    const newData = { ...defaultRadarData };
    newData.datasets[0].data = [gpa / 10 * 10, projects, skills, internships, certs]; // scale GPA to 0‑10
    setRadarData(newData);
  }, [db]);

  const runGapAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `Analyze user profile: GPA ${radarData.datasets[0].data[0].toFixed(1)}/10, Projects ${radarData.datasets[0].data[1]}, Skills ${radarData.datasets[0].data[2]}, Internships ${radarData.datasets[0].data[3]}, Certifications ${radarData.datasets[0].data[4]}. Provide a concise, harsh but actionable gap analysis for getting a FAANG software engineering job. Give 3 bullet points on what to improve.`;
      const text = await callGroq([{ role: 'user', content: prompt }]);
      setGapAnalysis(text);
      toast.success('Gap Analysis Complete!');
    } catch (e) {
      console.error(e);
      toast.error('Gap analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const addContact = () => {
    if (!networkForm.name || !networkForm.company) { toast.error('Name and company required'); return; }
    mutateDB(d => {
      if (!d.networking) d.networking = [];
      d.networking.push({ id: Date.now().toString(), ...networkForm, createdAt: new Date().toISOString(), lastContacted: '' });
    }, `Added networking contact: ${networkForm.name}`);
    setAddingNetwork(false);
    setNetworkForm({ name: '', company: '', role: '', status: 'To Contact', link: '' });
    addXP(10); // Reward for networking
    toast.success('Contact added');
  };

  const importLinkedInText = async () => {
    if (!linkedinText.trim() && !linkedinUrl.trim()) { toast.error('Paste a profile URL or public profile text'); return; }
    const result = await aiAnalyze({ linkedinUrl, linkedinText }, 'Extract likely name, company, role, and networking angle from this public LinkedIn/profile text. Return concise JSON-like fields plus a short relationship strategy.');
    setNetworkCoach(result);
    mutateDB(d => {
      d.linkedinData.url = linkedinUrl;
      d.linkedinData.importedText = linkedinText;
      d.linkedinData.lastAnalyzed = new Date().toISOString();
    }, 'Analyzed LinkedIn profile text');
  };

  const moveContact = (id, status) => {
    mutateDB(d => {
      const c = d.networking.find(x => x.id === id);
      if (c) c.status = status;
    }, 'Moved contact status');
  };

  const deleteContact = (id) => {
    mutateDB(d => {
      if (d.networking) d.networking = d.networking.filter(x => x.id !== id);
    }, 'Deleted contact');
  };

  const generateColdDM = async (contact) => {
    const prompt = `Create a full networking strategy for this contact, not just a cold DM.
Student: ${db.profile.name}, ${db.profile.college}, skills ${(db.resumeData?.skills || []).join(', ')}.
Contact: ${contact.name}, ${contact.role} at ${contact.company}.
Return:
1. First LinkedIn DM under 90 words
2. Follow-up after 5 days
3. Coffee chat questions
4. Referral ask timing`;
    setAiDraft('Generating draft...');
    const draft = await callGroq([{ role: 'user', content: prompt }]);
    setAiDraft(draft);
  };

  const contacts = db.networking || [];
  const placementScore = Math.min(100, Math.round(
    (Math.min(parseFloat(calcCGPA(db.gpa?.semesters || [])) || 0, 10) * 4) +
    Math.min((db.projects?.length || 0) * 8, 24) +
    Math.min((db.resumeData?.skills?.length || db.skills?.length || 0) * 3, 18) +
    Math.min((db.internships?.length || 0) * 10, 20) +
    Math.min((db.certs?.length || 0) * 2, 10)
  ));

  return (
    <div className="animate-fade" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '40px' }}>
      <StyledText text="Career & Placement AI Predictor" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
      
      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.01)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Skill Radar & FAANG Predictor</h2>
          <Radar data={radarData} options={{ scales: { r: { beginAtZero: true, max: 10 } } }} />
        </div>

        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={runGapAnalysis} disabled={loading} style={{ flex: 1 }}>
              <Zap size={16} />
              {loading ? 'Analyzing...' : 'Run AI Gap Analysis'}
            </button>
            {gapAnalysis && (
              <button className="btn btn-secondary" onClick={() => setGapAnalysis('')}>
                <Trash2 size={16} /> Clear
              </button>
            )}
          </div>
          
          {gapAnalysis && (
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 20 }}>
              <h2 style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)' }}>
                <Zap size={18} /> AI Feedback
              </h2>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>{gapAnalysis}</div>
            </div>
          )}
          
          {!gapAnalysis && (
            <div className="card" style={{ padding: 20, textAlign: 'center', opacity: 0.7 }}>
              <Zap size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>Run the gap analysis to compare your profile against FAANG requirements and get actionable steps.</p>
            </div>
          )}
          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 10 }}>Placement Probability</h2>
            <div className="stat-value text-violet">{placementScore}%</div>
            <p className="text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>Weighted by GPA, projects, skills, internships, and certifications. Use gap analysis for exact next moves.</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>LinkedIn CRM & Auto-Networking</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>Track recruiter connections and generate AI Cold DMs.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setAddingNetwork(true)}><Plus size={16} /> Add Contact</button>
        </div>

        <div className="card mb-4">
          <div className="section-title"><LinkIcon size={16} /> LinkedIn-Safe Import</div>
          <div className="grid-2">
            <input className="input" placeholder="Public profile URL" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
            <button className="btn btn-secondary" onClick={importLinkedInText}>Analyze Profile Text</button>
          </div>
          <textarea className="input" rows={4} style={{ marginTop: 10 }} placeholder="Paste public profile/about/experience text here. No scraping required." value={linkedinText} onChange={e => setLinkedinText(e.target.value)} />
          {networkCoach && <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 12 }}>{networkCoach}</p>}
        </div>

        {addingNetwork && (
          <div className="card mb-4">
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>New Contact</h3>
            <div className="grid-2">
              <div><label className="label">Name</label><input className="input" placeholder="John Doe" value={networkForm.name} onChange={e => setNetworkForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
              <div><label className="label">Company</label><input className="input" placeholder="Google" value={networkForm.company} onChange={e => setNetworkForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div><label className="label">Role</label><input className="input" placeholder="Technical Recruiter" value={networkForm.role} onChange={e => setNetworkForm(f => ({ ...f, role: e.target.value }))} /></div>
              <div><label className="label">Profile Link</label><input className="input" placeholder="https://linkedin.com/in/..." value={networkForm.link} onChange={e => setNetworkForm(f => ({ ...f, link: e.target.value }))} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={networkForm.status} onChange={e => setNetworkForm(f => ({ ...f, status: e.target.value }))}>
                  {NETWORK_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={addContact}>Add Contact</button>
              <button className="btn btn-secondary" onClick={() => setAddingNetwork(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="kanban-board">
          {NETWORK_STATUSES.map(status => {
            const items = contacts.filter(i => i.status === status);
            return (
              <div key={status} className="kanban-col"
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (drag) { moveContact(drag, status); setDrag(null); } }}>
                <div className="kanban-col-header">
                  <span style={{ color: NETWORK_COLORS[status], fontWeight: 600 }}>{status}</span>
                  <span className="badge badge-gray">{items.length}</span>
                </div>
                {items.map(item => (
                  <div key={item.id} className="kanban-card" draggable onDragStart={() => setDrag(item.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                      <button onClick={() => deleteContact(item.id)} style={{ color: 'var(--red)', opacity: 0.5 }}><Trash2 size={12} /></button>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginBottom: 2 }}>{item.role} @ {item.company}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CalendarClock size={10} /> {item.lastContacted ? `Last contacted ${new Date(item.lastContacted).toLocaleDateString()}` : 'No outreach logged'}
                    </div>
                    
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 12, padding: '4px 0', fontSize: '0.7rem' }} onClick={() => generateColdDM(item)}>
                      <MessageCircle size={12} style={{ marginRight: 6 }} /> AI Cold DM
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 6, padding: '4px 0', fontSize: '0.7rem' }} onClick={() => mutateDB(d => { const c = d.networking.find(x => x.id === item.id); if (c) c.lastContacted = new Date().toISOString(); }, 'Logged networking follow-up')}>
                      Log follow-up
                    </button>
                  </div>
                ))}
                {items.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: '0.75rem', color: 'var(--text3)' }}>Drop here</div>}
              </div>
            );
          })}
        </div>

        {aiDraft && (
          <div className="card" style={{ marginTop: 24, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--violet2)' }}>
                <MessageCircle size={18} /> AI Generated Draft
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setAiDraft(null)}>Close</button>
            </div>
            <textarea className="input" rows={6} value={aiDraft} onChange={e => setAiDraft(e.target.value)} style={{ fontSize: '0.9rem', lineHeight: 1.6 }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 8 }}>You can edit this draft before copying it to LinkedIn.</div>
          </div>
        )}
      </div>
    </div>
  );
}
