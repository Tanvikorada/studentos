import StyledText from '../components/StyledText';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mutateDB, exportDB, resetDB, toast, useDB, callGrok, importDB, aiAnalyze, setOpenAIApiKey, getOpenAIApiKey, getGrokApiKey, setGrokApiKey } from '../store';
import { Plus, Trash2, Download, Save, Upload, Trash, Mic, Send, RefreshCw, Briefcase, TrendingUp, DollarSign, Award, MapPin, Mail, Phone, User, Globe, Sparkles, Printer, FileCheck, LogOut } from 'lucide-react';

export function ResumeBuilder() {
  const db = useDB();
  const [form, setForm] = useState({ ...db.resumeData });
  const [template, setTemplate] = useState('classic');
  const [jobDescription, setJobDescription] = useState('');
  const [atsReport, setAtsReport] = useState('');
  const [aiLoading, setAiLoading] = useState('');

  useEffect(() => {
    if (db.resumeData) {
      setForm({ ...db.resumeData });
    }
  }, [db.resumeData]);

  const save = () => {
    mutateDB(d => { d.resumeData = form; }, 'Updated resume');
    toast.success('Resume saved');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'resume.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  };

  const printPDF = () => {
    save();
    setTimeout(() => window.print(), 100);
  };

  const aiWriteSummary = async () => {
    setAiLoading('summary');
    const result = await aiAnalyze({ profile: db.profile, resumeData: form, projects: db.projects, skills: db.skills }, 'Write a polished 3-line professional resume summary for this student. Make it ATS-friendly and truthful.');
    setBasics('summary', result.replace(/^["']|["']$/g, ''));
    setAiLoading('');
  };

  const scoreATS = async () => {
    if (!jobDescription.trim()) { toast.error('Paste a job description first'); return; }
    setAiLoading('ats');
    const result = await aiAnalyze({ resume: form, jobDescription }, 'Give an ATS compatibility score out of 100 with keyword matches, missing keywords, formatting risks, and concrete improvements.');
    setAtsReport(result);
    setAiLoading('');
  };

  const setBasics = (k, v) => setForm(f => ({ ...f, basics: { ...f.basics, [k]: v } }));
  const addExp = () => setForm(f => ({ ...f, experience: [...(f.experience || []), { id: Date.now().toString(), title: '', company: '', start: '', end: '', desc: '' }] }));
  const setExp = (id, k, v) => setForm(f => ({ ...f, experience: f.experience.map(e => e.id === id ? { ...e, [k]: v } : e) }));
  const delExp = (id) => setForm(f => ({ ...f, experience: f.experience.filter(e => e.id !== id) }));

  return (
    <div className="animate-fade resume-builder-layout" style={{ paddingBottom: '40px' }}>
      <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <StyledText text="Resume Builder" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>Design a tailored ATS-friendly profile resume</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportJSON}><Download size={14} /> Export JSON</button>
          <button className="btn btn-secondary btn-sm" onClick={printPDF}><Printer size={14} /> PDF</button>
          <button className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save Changes</button>
        </div>
      </div>

      <div className="card mb-4">
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 12 }}>Template</div>
        <div className="thread-tabs">
          {['classic', 'modern', 'minimal'].map(t => (
            <button key={t} className={`thread-tab ${template === t ? 'active' : ''}`} onClick={() => setTemplate(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Basics */}
      <div className="card mb-4">
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--violet2)' }}>
          <User size={16} /> Contact Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <div><label className="label">Full Name</label><input className="input" placeholder="e.g. John Doe" value={form.basics?.name || ''} onChange={e => setBasics('name', e.target.value)} /></div>
            <div><label className="label">Email Address</label><input className="input" type="email" placeholder="e.g. john@example.com" value={form.basics?.email || ''} onChange={e => setBasics('email', e.target.value)} /></div>
            <div><label className="label">Phone Number</label><input className="input" placeholder="e.g. +91 98765 43210" value={form.basics?.phone || ''} onChange={e => setBasics('phone', e.target.value)} /></div>
            <div><label className="label">Location</label><input className="input" placeholder="e.g. Chennai, India" value={form.basics?.location || ''} onChange={e => setBasics('location', e.target.value)} /></div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="label">Professional Summary</label>
              <button className="btn btn-secondary btn-sm" onClick={aiWriteSummary} disabled={!!aiLoading}><Sparkles size={12} /> {aiLoading === 'summary' ? 'Writing...' : 'AI Write'}</button>
            </div>
            <textarea className="input" rows={3} placeholder="A short description of your professional journey and goals..." value={form.basics?.summary || ''} onChange={e => setBasics('summary', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="card mb-4">
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--mint2)' }}>
          <Award size={16} /> Education
        </div>
        {(form.education || []).map((edu, i) => (
          <div key={edu.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 12 }}>
            <div className="grid-2" style={{ gap: 12 }}>
              <div><label className="label">Institution / University</label><input className="input input-sm" value={edu.institution} onChange={e => setForm(f => ({ ...f, education: f.education.map((x, j) => j === i ? { ...x, institution: e.target.value } : x) }))} /></div>
              <div><label className="label">Course / Area of Study</label><input className="input input-sm" value={edu.area} onChange={e => setForm(f => ({ ...f, education: f.education.map((x, j) => j === i ? { ...x, area: e.target.value } : x) }))} /></div>
              <div><label className="label">Start Year</label><input className="input input-sm" value={edu.startDate} onChange={e => setForm(f => ({ ...f, education: f.education.map((x, j) => j === i ? { ...x, startDate: e.target.value } : x) }))} /></div>
              <div><label className="label">End Year / Expected</label><input className="input input-sm" value={edu.endDate} onChange={e => setForm(f => ({ ...f, education: f.education.map((x, j) => j === i ? { ...x, endDate: e.target.value } : x) }))} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Experience */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)' }}>
            <Briefcase size={16} /> Experience
          </div>
          <button className="btn btn-secondary btn-sm" onClick={addExp}><Plus size={12} /> Add Experience</button>
        </div>
        {(form.experience || []).map(exp => (
          <div key={exp.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 12 }}>
            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div><label className="label">Job Title</label><input className="input input-sm" placeholder="e.g. Frontend Developer" value={exp.title} onChange={e => setExp(exp.id, 'title', e.target.value)} /></div>
              <div><label className="label">Company / Organization</label><input className="input input-sm" placeholder="e.g. Google" value={exp.company} onChange={e => setExp(exp.id, 'company', e.target.value)} /></div>
              <div><label className="label">Start Date</label><input className="input input-sm" placeholder="e.g. June 2024" value={exp.start} onChange={e => setExp(exp.id, 'start', e.target.value)} /></div>
              <div><label className="label">End Date</label><input className="input input-sm" placeholder="e.g. Present" value={exp.end} onChange={e => setExp(exp.id, 'end', e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label className="label">Key Contributions & Achievements</label><textarea className="input input-sm" rows={3} placeholder="Describe your core responsibilities, technologies used, and impact..." value={exp.desc} onChange={e => setExp(exp.id, 'desc', e.target.value)} /></div>
            <button onClick={() => delExp(exp.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '4px 0' }}><Trash2 size={12} /> Remove Entry</button>
          </div>
        ))}
        {(form.experience || []).length === 0 && <div className="text-muted" style={{ padding: '24px 0', textAlign: 'center', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 12 }}>No professional experience listed. Click 'Add Experience' to build your history.</div>}
      </div>

      {/* Skills */}
      <div className="card mb-6">
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 10, color: 'var(--violet2)' }}>Keywords & Skills</div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>Enter your primary technical skills separated by commas to optimize for ATS scanners.</p>
        <textarea className="input" rows={3} value={(form.skills || []).join(', ')} onChange={e => setForm(f => ({ ...f, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="React, Python, SQL, Machine Learning..." />
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', gap: 10 }} onClick={save}><Save size={18} /> Save Resume Data</button>
      </div>

      <aside className="resume-side">
        <div className={`resume-preview resume-${template}`}>
          <h2>{form.basics?.name || db.profile.name || 'Your Name'}</h2>
          <p className="resume-contact">{[form.basics?.email, form.basics?.phone, form.basics?.location].filter(Boolean).join(' | ')}</p>
          {form.basics?.summary && <p>{form.basics.summary}</p>}
          {(form.education || []).length > 0 && <h3>Education</h3>}
          {(form.education || []).map((e, i) => <p key={i}><strong>{e.institution}</strong> - {e.area} {e.startDate} {e.endDate}</p>)}
          {(form.experience || []).length > 0 && <h3>Experience</h3>}
          {(form.experience || []).map(e => <p key={e.id}><strong>{e.title}</strong>, {e.company}<br />{e.desc}</p>)}
          {(form.skills || []).length > 0 && <><h3>Skills</h3><p>{form.skills.join(', ')}</p></>}
        </div>

        <div className="card">
          <div className="section-title"><FileCheck size={16} /> ATS Score</div>
          <textarea className="input" rows={5} placeholder="Paste job description..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={scoreATS} disabled={!!aiLoading}>
            <Sparkles size={14} /> {aiLoading === 'ats' ? 'Scoring...' : 'Score Resume'}
          </button>
          {atsReport && <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 12 }}>{atsReport}</p>}
        </div>
      </aside>
    </div>
  );
}


export function Portfolio() {
  const db = useDB();
  const { profile, projects, resumeData, skills } = db;
  const [layout, setLayout] = useState(db.portfolioConfig?.layout || 'cards');
  const [showDeployGuide, setShowDeployGuide] = useState(false);

  const portfolioHTML = () => {
    const projectHTML = (projects || []).map(p => `<article class="project"><h3>${p.name || ''}</h3><p>${p.desc || ''}</p><div>${(p.tech || []).map(t => `<span>${t}</span>`).join('')}</div>${p.repo ? `<a href="${p.repo}">View project</a>` : ''}</article>`).join('');
    const skillHTML = (skills || []).map(s => `<span>${s.name || s}</span>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${profile.name || 'Portfolio'}</title><style>body{font-family:Inter,Arial,sans-serif;margin:0;background:#0f172a;color:#e5e7eb;line-height:1.6}main{max-width:980px;margin:auto;padding:56px 22px}.hero{min-height:48vh;display:grid;align-content:center}h1{font-size:clamp(2.4rem,8vw,5rem);margin:0}p{color:#cbd5e1}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}.project{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:18px;background:rgba(255,255,255,.04)}span{display:inline-block;margin:4px;padding:5px 10px;border-radius:999px;background:#1e293b;color:#93c5fd}a{color:#67e8f9}</style></head><body><main class="${layout}"><section class="hero"><h1>${profile.name || 'Student Portfolio'}</h1><p>${profile.headline || ''}</p><p>${profile.bio || resumeData?.basics?.summary || ''}</p><p>${resumeData?.basics?.email || ''}</p></section><section><h2>Projects</h2><div class="grid">${projectHTML}</div></section><section><h2>Skills</h2>${skillHTML}</section></main></body></html>`;
  };

  const downloadHTML = () => {
    const blob = new Blob([portfolioHTML()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile.name || 'portfolio').replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Portfolio HTML downloaded');
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '40px' }}>
      <div className="card mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800 }}>Live Portfolio Page</div>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>Generate a single-file portfolio you can host anywhere.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="thread-tabs">
            {['cards', 'timeline', 'minimal'].map(t => (
              <button key={t} className={`thread-tab ${layout === t ? 'active' : ''}`} onClick={() => {
                setLayout(t);
                mutateDB(d => { d.portfolioConfig.layout = t; });
              }}>{t}</button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowDeployGuide(!showDeployGuide)}><Globe size={14} /> Deploy to GitHub</button>
          <button className="btn btn-secondary btn-sm" onClick={downloadHTML}><Download size={14} /> Download HTML</button>
        </div>
      </div>

      {showDeployGuide && (
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(0,200,100,0.1))', border: '1px solid var(--violet)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={16} /> Free Hosting via GitHub Pages</h3>
          <ol style={{ paddingLeft: 20, lineHeight: 1.6, fontSize: '0.9rem', color: 'var(--text2)', margin: 0 }}>
            <li style={{ marginBottom: 4 }}>Click <strong>Download HTML</strong> above to save your portfolio.</li>
            <li style={{ marginBottom: 4 }}>Rename the downloaded file exactly to <code>index.html</code>.</li>
            <li style={{ marginBottom: 4 }}>Go to <a href="https://github.com/new" target="_blank" rel="noreferrer" style={{ color: 'var(--mint)' }}>github.com/new</a> and create a new public repository.</li>
            <li style={{ marginBottom: 4 }}>Upload your <code>index.html</code> file to this repository.</li>
            <li>Go to the repository <strong>Settings {'>'} Pages</strong>, select the <code>main</code> branch, and save. Your site is now live!</li>
          </ol>
        </div>
      )}

      <div className="card" style={{ padding: '40px', textAlign: 'center', marginBottom: 32, background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.08) 0%, rgba(16, 16, 28, 0.7) 100%)' }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,var(--violet),var(--mint))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem', fontWeight: 800, color: '#fff', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)' }}>
          {profile.name?.[0] || 'S'}
        </div>
        <StyledText text={profile.name} style={{ fontSize: '2.25rem', display: 'block', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--violet2)', marginTop: 6, fontWeight: 600, fontSize: '1rem' }}>{profile.headline}</p>
        <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: 8, opacity: 0.9 }}>{profile.college} • {profile.dept}</p>
        
        {/* Contact Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {resumeData?.basics?.email && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text2)' }}>
              <Mail size={12} className="text-violet" /> {resumeData.basics.email}
            </span>
          )}
          {resumeData?.basics?.phone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text2)' }}>
              <Phone size={12} className="text-violet" /> {resumeData.basics.phone}
            </span>
          )}
          {resumeData?.basics?.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text2)' }}>
              <MapPin size={12} className="text-violet" /> {resumeData.basics.location}
            </span>
          )}
        </div>

        {profile.bio && <p style={{ marginTop: 20, color: 'var(--text2)', fontSize: '0.925rem', maxWidth: 540, margin: '20px auto 0', lineHeight: 1.7, opacity: 0.85 }}>{profile.bio}</p>}
      </div>

      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 18, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text)' }}>Featured Projects</h2>
        <div className="grid-2">
          {projects.map(p => (
            <div key={p.id} className="card card-glow" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{p.name}</div>
                {p.repo && <a href={p.repo} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--violet2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Globe size={12} /> Repo</a>}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>{p.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.tech.map(t => <span key={t} className="badge badge-gray" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(skills || []).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 14, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text)' }}>Skills & Technologies</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map(s => <span key={s.id} className="badge badge-violet" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '10px' }}>{s.name}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

export function MockInterview() {
  const db = useDB();
  const [phase, setPhase] = useState('setup'); // setup | interview | report
  const [jd, setJd] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [report, setReport] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [interviewType, setInterviewType] = useState('Technical');
  const [questionCount, setQuestionCount] = useState(5);
  const [voiceName, setVoiceName] = useState('');
  const [voices, setVoices] = useState([]);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices?.() || []);
    loadVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices);
  }, []);

  const speak = (text) => {
    if (!voiceMode) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/\n/g, ' '));
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = 1;
    // prefer a good voice
    const preferred = voices.find(v => v.name === voiceName) || voices.find(v => v.lang === language) || voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('Aaron'));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice not supported in this browser. Use Chrome.'); return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      sendAnswer(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const startInterview = async () => {
    if (!jd && !topic) { toast.error('Enter a job description or topic first'); return; }
    const sys = `You are a senior technical interviewer at a top tech company. You are interviewing ${db.profile.name || 'a candidate'} who has skills in: ${(db.resumeData?.skills || []).join(', ')} and has built projects like: ${(db.projects || []).map(p => p.name).join(', ')}.
    
Interview context:
- Topic/Role: ${topic || 'General SWE'}
- Interview Type: ${interviewType}
- Job Description: ${jd || 'Full Stack Engineer'}
- Difficulty: ${difficulty}
- Interview Language: ${language}

Rules:
1. Ask ONE focused technical or behavioral question at a time.
2. After each answer, give brief sharp feedback (max 2 sentences), a score out of 10, then ask the next question.
3. After ${questionCount} questions total, write "[INTERVIEW COMPLETE]" and give a detailed scorecard with Communication, Technical Accuracy, Confidence, and Clarity sub-scores.
4. Be strict, professional, and constructive. No fluff.
5. Conduct the interview in the selected language when possible.

Start NOW with your first question.`;
    const firstMsg = [{ role: 'user', content: 'Start the interview.' }];
    setPhase('interview');
    setLoading(true);
    const reply = await callGrok(firstMsg, sys);
    const aiMsg = { role: 'assistant', content: reply, sys };
    setMessages([aiMsg]);
    speak(reply);
    setLoading(false);
  };

  const sendAnswer = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    window.speechSynthesis.cancel();
    const userMsg = { role: 'user', content: msg };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    const sys = messages[0]?.sys || '';
    const reply = await callGrok(history.map(m => ({ role: m.role, content: m.content })), sys);
    const aiMsg = { role: 'assistant', content: reply, sys };
    const finalHistory = [...history, aiMsg];
    setMessages(finalHistory);
    speak(reply);
    setLoading(false);
    // detect end
    if (reply.includes('[INTERVIEW COMPLETE]')) {
      setReport(reply);
      mutateDB(d => {
        if (!d.interviewHistory) d.interviewHistory = [];
        d.interviewHistory.unshift({
          id: Date.now().toString(),
          topic: topic || 'General SWE',
          type: interviewType,
          difficulty,
          report: reply,
          date: new Date().toISOString(),
        });
        d.interviewHistory = d.interviewHistory.slice(0, 20);
      }, 'Saved interview report');
      setTimeout(() => setPhase('report'), 1500);
    }
  };

  const reset = () => {
    window.speechSynthesis.cancel();
    setPhase('setup');
    setMessages([]);
    setReport(null);
    setJd('');
    setTopic('');
    setInput('');
  };

  if (phase === 'setup') return (
    <div className="animate-fade" style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <StyledText text="AI Mock Interviewer" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Voice-to-Voice • Grok • Real interview simulation</p>
      </div>

      <div className="card mb-4" style={{ borderColor: 'rgba(139,92,246,0.3)' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--violet2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎯 Interview Setup</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Topic / Role (e.g. "React Frontend Developer")</label>
            <input className="input" placeholder="e.g. Data Structures, System Design, ML Engineer..." value={topic} onChange={e => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="label">Paste Job Description (optional but recommended)</label>
            <textarea className="input" rows={5} placeholder="Paste the full job description here. The AI will tailor questions specifically to this JD..." value={jd} onChange={e => setJd(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label">Difficulty Level</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['easy', 'medium', 'hard', 'faang'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${difficulty === d ? 'var(--violet)' : 'rgba(255,255,255,0.08)'}`, background: difficulty === d ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', color: difficulty === d ? 'var(--violet2)' : 'var(--text3)', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                  {d === 'faang' ? '🔥 FAANG' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label className="label">Interview Type</label>
              <select className="input" value={interviewType} onChange={e => setInterviewType(e.target.value)}>
                {['Technical', 'Behavioral', 'HR', 'System Design', 'DSA'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Questions</label>
              <select className="input" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))}>
                {[5, 10, 15].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en-US">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="te-IN">Telugu</option>
                <option value="ta-IN">Tamil</option>
              </select>
            </div>
            <div>
              <label className="label">Voice</label>
              <select className="input" value={voiceName} onChange={e => setVoiceName(e.target.value)}>
                <option value="">Auto voice</option>
                {voices.map(v => <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>🎙️ Voice Mode</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>AI speaks questions aloud, you reply by voice</div>
            </div>
            <button onClick={() => setVoiceMode(v => !v)}
              style={{ padding: '6px 16px', borderRadius: 99, border: `1px solid ${voiceMode ? 'var(--mint)' : 'rgba(255,255,255,0.1)'}`, background: voiceMode ? 'rgba(0,242,254,0.1)' : 'transparent', color: voiceMode ? 'var(--mint2)' : 'var(--text3)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>
              {voiceMode ? '✅ ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={startInterview} style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800 }}>
        🚀 Start Interview
      </button>

      <div style={{ marginTop: 20, padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, fontSize: '0.78rem', color: 'var(--text3)', lineHeight: 1.8 }}>
        <strong style={{ color: 'var(--violet2)' }}>How it works:</strong> The AI interviewer asks {questionCount} targeted questions based on your JD/topic. After each answer, it gives instant feedback and a score. At the end, you receive a detailed performance report.
      </div>
      {(db.interviewHistory || []).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title"><FileCheck size={16} /> Past Reports</div>
          {(db.interviewHistory || []).slice(0, 4).map(item => (
            <button key={item.id} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }} onClick={() => { setReport(item.report); setPhase('report'); }}>
              <span>{item.topic} - {item.type}</span>
              <span className="text-faint">{new Date(item.date).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (phase === 'report') return (
    <div className="animate-fade" style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <StyledText text="📊 Interview Report" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>Your detailed performance scorecard</p>
        </div>
        <button className="btn btn-primary" onClick={reset}>New Interview</button>
      </div>
      <div className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.88rem', color: 'var(--text2)' }}
        dangerouslySetInnerHTML={{ __html: (report || '').replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>').replace(/\n/g, '<br/>') }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: speaking ? 'linear-gradient(135deg, var(--violet), var(--mint))' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: speaking ? '0 0 20px rgba(139,92,246,0.5)' : 'none' }}>
            {speaking ? (
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {[1,2,3,4,5].map(i => (
                  <motion.div key={i} style={{ width: 3, background: '#fff', borderRadius: 2 }}
                    animate={{ height: [4, 14 + i*3, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.07 }} />
                ))}
              </div>
            ) : <Mic size={18} color="var(--text3)" />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>AI Interviewer</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{speaking ? 'Speaking...' : loading ? 'Thinking...' : 'Listening'} • {topic || 'General SWE'}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={reset}>End Interview</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 0' }}>
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
            {m.role === 'assistant' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,var(--violet),var(--mint))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={10} color="#fff" />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>AI Interviewer</span>
                <button onClick={() => speak(m.content)} style={{ fontSize: '0.65rem', color: 'var(--violet2)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>🔊 Replay</button>
              </div>
            )}
            <div style={{ maxWidth: '80%', padding: '14px 18px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'linear-gradient(135deg,var(--violet),#4f46e5)' : 'rgba(255,255,255,0.03)', border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)', lineHeight: 1.65, fontSize: '0.9rem', boxShadow: m.role === 'user' ? '0 4px 20px rgba(99,102,241,0.2)' : 'none' }}
              dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
          </motion.div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-start', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: '18px 18px 18px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[0, 0.2, 0.4].map((d, i) => (
              <motion.div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--violet2)' }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: d }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={startListening}
          style={{ width: 46, height: 46, borderRadius: 12, border: `1px solid ${listening ? 'var(--red)' : 'rgba(255,255,255,0.1)'}`, background: listening ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: listening ? 'var(--red)' : 'var(--text3)', transition: 'all 0.2s', flexShrink: 0 }}>
          {listening ? (
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {[1,2,3].map(i => (
                <motion.div key={i} style={{ width: 3, background: 'var(--red)', borderRadius: 2 }}
                  animate={{ height: [4 + i*2, 12 + i*3, 4 + i*2] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} />
              ))}
            </div>
          ) : <Mic size={18} />}
        </button>
        <input className="input" style={{ flex: 1, height: 46 }}
          placeholder={listening ? '🎤 Listening... speak now' : 'Type your answer or click 🎤 to speak...'}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAnswer()} />
        <button className="btn btn-primary" onClick={() => sendAnswer()} disabled={(!input.trim() && !loading) || loading}
          style={{ width: 46, height: 46, borderRadius: 12, padding: 0 }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export function MarketTrends() {
  const db = useDB();
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveStatus, setLiveStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const generateInsights = async () => {
    setLoading(true);
    const result = await aiAnalyze({ skills: db.skills, resumeSkills: db.resumeData?.skills, projects: db.projects, trends }, 'Based on my skills and projects, identify top hiring roles, salary range, missing skills, and a 30-day learning path.');
    setInsights(result);
    setLoading(false);
  };
  const trends = [
    { tech: 'AI/ML Engineering', demand: 95, salary: '₹18-35 LPA', growth: '+42%', color: 'var(--violet)' },
    { tech: 'Full Stack (React+Node)', demand: 88, salary: '₹12-25 LPA', growth: '+28%', color: 'var(--mint)' },
    { tech: 'Data Engineering', demand: 82, salary: '₹15-28 LPA', growth: '+35%', color: 'var(--amber)' },
    { tech: 'DevOps / Cloud', demand: 80, salary: '₹14-30 LPA', growth: '+31%', color: '#3b82f6' },
    { tech: 'Cybersecurity', demand: 75, salary: '₹12-28 LPA', growth: '+38%', color: '#ec4899' },
    { tech: 'Mobile (Flutter/RN)', demand: 70, salary: '₹10-20 LPA', growth: '+22%', color: '#f97316' },
    { tech: 'Blockchain', demand: 55, salary: '₹14-32 LPA', growth: '+18%', color: '#8b5cf6' },
    { tech: 'AR/VR Development', demand: 45, salary: '₹12-25 LPA', growth: '+25%', color: '#06b6d4' },
  ];

  const fetchLiveJobs = async () => {
    if (!searchQuery.trim()) { setLiveStatus('Please enter a job title or keyword.'); return; }
    setLiveStatus(`Fetching live openings for "${searchQuery}"...`);
    try {
      const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchQuery)}&limit=12`);
      if (!res.ok) throw new Error('Remote jobs API unavailable');
      const data = await res.json();
      setLiveJobs((data.jobs || []).slice(0, 12));
      setLiveStatus(`Loaded ${(data.jobs || []).slice(0, 12).length} live remote roles from Remotive.`);
    } catch (err) {
      setLiveStatus(`Live fetch unavailable: ${err.message}. Showing StudentOS demand index.`);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 760, margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: 24 }}>
        <StyledText text="Career & Market Trends" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />
        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>Live industry demand index • Updated for 2026</p>
      </div>
      
      <div className="card mb-4">
        <div className="section-title"><Sparkles size={16} /> AI Career Insights</div>
        <button className="btn btn-secondary btn-sm" onClick={generateInsights} disabled={loading}>
          <Sparkles size={14} /> {loading ? 'Analyzing...' : 'Analyze my market fit'}
        </button>
        {insights && <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 14 }}>{insights}</p>}
        {!insights && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 14 }}>Uses your skills, projects, and resume data to suggest roles, salary bands, and learning gaps.</p>}
      </div>

      <div className="card mb-4">
        <div className="section-title"><TrendingUp size={16} /> Live Openings Search</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input className="input" style={{ flex: 1 }} placeholder="Search for 'React', 'Python', 'Product Manager'..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchLiveJobs()} />
          <button className="btn btn-primary" onClick={fetchLiveJobs}><Search size={14} /> Search Live Roles</button>
        </div>
        {liveStatus && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4, marginBottom: 10 }}>{liveStatus}</p>}
        {liveJobs.length > 0 && (
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {liveJobs.map(job => (
              <a key={job.id} href={job.url} target="_blank" rel="noreferrer" className="card card-glow" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                {job.company_logo && <img src={job.company_logo} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#fff' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--violet2)', fontSize: '1.05rem', marginBottom: 2 }}>{job.title}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>{job.company_name}</span> • <span>{job.job_type || 'Full-time'}</span> • <span>{job.candidate_required_location || 'Remote'}</span>
                  </div>
                </div>
                <div style={{ background: 'var(--surface2)', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}>Apply</div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {trends.map((t, i) => (
          <div key={t.tech} className="card card-glow" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text3)' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t.tech}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-mint" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>{t.growth}</span>
                <span className="badge badge-gray" style={{ fontSize: '0.72rem', padding: '2px 8px', color: 'var(--text2)' }}>{t.salary}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: t.color }}>{t.demand}% Demand</span>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${t.demand}%`, background: t.color, borderRadius: 99, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Settings() {
  const db = useDB();
  const [grokKey, setGrokKeyLocal] = useState(getGrokApiKey());
  const [openAIKey, setOpenAIKeyLocal] = useState(getOpenAIApiKey());
  const [aiProvider, setAiProvider] = useState(db.settings?.aiProvider || 'grok');

  useEffect(() => {
    setAiProvider(db.settings?.aiProvider || 'grok');
  }, [db.settings]);

  const saveKeys = () => {
    mutateDB(d => { 
      if (!d.settings) d.settings = {}; 
      d.settings.aiProvider = aiProvider;
    }, 'Updated AI Integration settings');
    setGrokApiKey(grokKey);
    setOpenAIApiKey(openAIKey);
    toast.success('AI settings saved securely to browser');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importDB(file);
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 600, margin: '0 auto', paddingBottom: '40px' }}>
      <StyledText text="System Settings" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }} />

      <div className="card mb-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--violet2)' }}>
          🤖 AI Integration
        </div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 16, lineHeight: 1.5 }}>
          Connect an AI provider to enable personalized intelligence across StudentOS. Grok 2 is fast and powerful.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { id: 'grok', label: '⚡ Grok (xAI)', desc: 'Grok-2 Latest', color: 'var(--mint)' },
            { id: 'openai', label: '🧠 OpenAI GPT-4o', desc: 'Most capable', color: 'var(--violet2)' },
          ].map(p => (
            <label key={p.id} style={{
              display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.8rem', cursor: 'pointer',
              padding: '10px 14px', flex: 1, minWidth: 120,
              background: aiProvider === p.id ? `rgba(124,58,237,0.1)` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${aiProvider === p.id ? 'var(--violet2)' : 'transparent'}`,
              borderRadius: 10, transition: 'all 0.2s',
            }}>
              <input type="radio" name="ai-provider" checked={aiProvider === p.id} onChange={() => setAiProvider(p.id)} style={{ display: 'none' }} />
              <span style={{ fontWeight: 700 }}>{p.label}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{p.desc}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {aiProvider === 'grok' && (
            <div>
              <label className="label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Grok API Key (xoxb-...) — <a href="https://console.x.ai" target="_blank" rel="noreferrer" style={{ color: 'var(--mint)' }}>Get key</a></label>
              <input className="input" type="password" placeholder="xoxb-..." value={grokKey} onChange={e => setGrokKeyLocal(e.target.value)} style={{ fontFamily: 'monospace' }} />
            </div>
          )}
          {aiProvider === 'openai' && (
            <div>
              <label className="label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>OpenAI API Key (sk-...)</label>
              <input className="input" type="password" placeholder="sk-..." value={openAIKey} onChange={e => setOpenAIKeyLocal(e.target.value)} style={{ fontFamily: 'monospace' }} />
            </div>
          )}
          <button className="btn btn-primary" onClick={saveKeys} style={{ alignSelf: 'flex-start', marginTop: 4 }}>Save AI Settings</button>
        </div>
      </div>

      <div className="card mb-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--text)' }}>✨ Aesthetics &amp; Theme</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {[
            { id: 'chatgpt-style', name: 'ChatGPT', icon: '🤖', desc: 'Dark sleek code UI', colors: ['#212121', '#10a37f'] },
            { id: 'claude-style', name: 'Claude', icon: '📝', desc: 'Light academic reading', colors: ['#faf9f5', '#d97757'] },
            { id: 'gemini-style', name: 'Gemini', icon: '✨', desc: 'Soft Google aesthetic', colors: ['#ffffff', '#1a73e8'] },
          ].map(t => (
            <div key={t.id}
              onClick={() => mutateDB(d => { if(!d.settings) d.settings={}; d.settings.theme = t.id; }, 'Changed theme')}
              style={{ padding: '14px 10px', borderRadius: 12, background: db.settings?.theme === t.id ? `linear-gradient(135deg, ${t.colors[0]}15, ${t.colors[1]}15)` : 'rgba(255,255,255,0.02)', border: `2px solid ${db.settings?.theme === t.id ? t.colors[0] : 'transparent'}`, cursor: 'pointer', transition: 'all 0.25s', textAlign: 'center' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{t.icon}</div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px', background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`, boxShadow: db.settings?.theme === t.id ? `0 0 20px ${t.colors[0]}88` : 'none', transition: 'box-shadow 0.3s' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: db.settings?.theme === t.id ? 'var(--text)' : 'var(--text3)' }}>{t.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--mint2)' }}>📦 Backups & Data Management</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Export Configuration</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Save all your student data and notes into a local JSON backup</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={exportDB} style={{ gap: 6 }}><Download size={14} /> Export JSON</button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Import Configuration</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Restore your StudentOS profile and records from a JSON file</div>
            </div>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', gap: 6 }}>
              <Upload size={14} /> Import Backup
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--red)' }}>Reset All Database Storage</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Clear all subjects, grades, tasks, notes and credentials</div>
            </div>
            <button className="btn btn-sm" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)', padding: '6px 14px', borderRadius: 8 }}
              onClick={() => { if (window.confirm('Are you absolutely sure? This will wipe your local database permanently.')) { localStorage.clear(); window.location.reload(); } }}>
              <Trash size={14} /> Wipe Everything
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Lock Workspace</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Secure your StudentOS and return to login screen</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { import('../store').then(m => m.lockDB()); }} style={{ background: 'var(--bg2)', color: 'var(--text)' }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 12 }}>ℹ️ Developer Details</div>
        <div style={{ fontSize: '0.825rem', color: 'var(--text2)', lineHeight: 1.8 }}>
          <div>System Engine: <span className="mono">v1.0.0</span></div>
          <div>Storage Driver: <span className="mono">localStorage (Encrypted/Plain Client Sandbox)</span></div>
          <div style={{ marginTop: 10, color: 'var(--violet2)' }}>💡 Quick Navigation: Press <kbd style={{ background: 'var(--surface3)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>Cmd+K</kbd> or <kbd style={{ background: 'var(--surface3)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>Ctrl+K</kbd> anywhere to open the system search.</div>
        </div>
      </div>
    </div>
  );
}
