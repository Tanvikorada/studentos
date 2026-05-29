import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mutateDB, toast, setGroqApiKey, setOpenAIApiKey, setGeminiApiKey, aiAnalyze } from '../store';
import { CheckCircle, BookOpen, Briefcase, Target, ArrowRight, Sparkles, ExternalLink, FileText, Zap, ChevronRight, X } from 'lucide-react';

const GOALS = [
  { id: 'academics', icon: BookOpen, label: 'Academics First', desc: 'GPA, notes, attendance tracking' },
  { id: 'career', icon: Briefcase, label: 'Career Focused', desc: 'Placement prep, resume, interview' },
  { id: 'balanced', icon: Target, label: 'Balanced', desc: 'Everything, in harmony' },
];

const slideVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', college: '', dept: '', groqApiKey: '', openaiApiKey: '', geminiApiKey: '' });
  const [goal, setGoal] = useState('balanced');
  const [syllabusText, setSyllabusText] = useState('');
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [syllabusResult, setSyllabusResult] = useState(null);
  const [providerSelected, setProviderSelected] = useState('groq');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isGroqValid = form.groqApiKey?.startsWith('gsk_') && form.groqApiKey.length > 20;
  const isOpenAIValid = form.openaiApiKey?.startsWith('sk-') && form.openaiApiKey.length > 20;
  const isGeminiValid = form.geminiApiKey?.startsWith('AIza') && form.geminiApiKey.length > 20;
  const hasValidKey = isGroqValid || isOpenAIValid || isGeminiValid;

  const handleSyllabusAnalyze = async () => {
    if (!syllabusText.trim() || !hasValidKey) return;
    setSyllabusLoading(true);
    // Save keys first so AI can run
    if (form.groqApiKey) setGroqApiKey(form.groqApiKey);
    if (form.openaiApiKey) setOpenAIApiKey(form.openaiApiKey);
    if (form.geminiApiKey) setGeminiApiKey(form.geminiApiKey);

    const raw = await aiAnalyze({ text: syllabusText },
      'Extract from this semester document: 1) subject names, 2) key deadlines with dates (YYYY-MM-DD format if possible). Return a JSON object: {"subjects": [{"name":"string"}], "deadlines": [{"title":"string","subject":"string","date":"string"}]}. Return only valid JSON.'
    );
    try {
      const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
      setSyllabusResult(parsed);
    } catch {
      setSyllabusResult({ subjects: [], deadlines: [], error: true });
    }
    setSyllabusLoading(false);
  };

  const handleDone = () => {
    if (form.groqApiKey) setGroqApiKey(form.groqApiKey);
    if (form.openaiApiKey) setOpenAIApiKey(form.openaiApiKey);
    if (form.geminiApiKey) setGeminiApiKey(form.geminiApiKey);

    mutateDB(d => {
      d.profile.name = form.name || d.profile.name;
      d.profile.college = form.college || d.profile.college;
      d.profile.dept = form.dept || d.profile.dept;
      d.settings.onboardingComplete = true;
      if (isGroqValid) d.settings.aiProvider = 'groq';
      else if (isGeminiValid) d.settings.aiProvider = 'gemini';
      else if (isOpenAIValid) d.settings.aiProvider = 'openai';

      // Apply syllabus results if available
      if (syllabusResult && !syllabusResult.error) {
        if (syllabusResult.subjects?.length > 0) {
          syllabusResult.subjects.forEach(s => {
            d.attendance.push({ id: Date.now().toString() + Math.random(), name: s.name, code: '', credits: 3, minPct: 75, records: [] });
          });
        }
        if (syllabusResult.deadlines?.length > 0) {
          syllabusResult.deadlines.forEach(dl => {
            d.tasks.push({
              id: Date.now().toString() + Math.random(),
              title: dl.title, desc: `Subject: ${dl.subject}`, cat: 'Academics',
              due: dl.date?.match(/\d{4}-\d{2}-\d{2}/) ? dl.date : '',
              priority: 'medium', done: false, status: 'todo', subtasks: [], recurrence: 'none',
              createdAt: new Date().toISOString(), completedAt: '',
            });
          });
        }
      }
    }, 'Completed onboarding');

    toast.success(`Welcome to StudentOS, ${form.name || 'Student'}! Your academic OS is ready.`);
    onDone();
  };

  const TOTAL_STEPS = 4;

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        style={{ maxWidth: 520 }}
      >
        {/* Progress */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i + 1 <= step ? 'var(--violet)' : 'var(--surface3)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 — Profile */}
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                Step 1 of {TOTAL_STEPS}
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Let's set up your space</h2>
              <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.875rem' }}>Tell us a bit about yourself — this personalizes your entire experience.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Your Name</label>
                  <input className="input" placeholder="Tanvi Sharma" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="label">College / University</label>
                  <input className="input" placeholder="SRMIST Chennai" value={form.college} onChange={e => set('college', e.target.value)} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" placeholder="Big Data Analytics" value={form.dept} onChange={e => set('dept', e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 24 }} onClick={() => setStep(2)}>
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 2 — Goal */}
          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                Step 2 of {TOTAL_STEPS}
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>What's your primary goal?</h2>
              <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.875rem' }}>We'll optimize your dashboard and AI recommendations accordingly.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GOALS.map(g => (
                  <div key={g.id} onClick={() => setGoal(g.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 12, cursor: 'pointer',
                    background: goal === g.id ? 'rgba(124,58,237,0.1)' : 'var(--surface2)',
                    border: `1.5px solid ${goal === g.id ? 'var(--violet2)' : 'var(--border)'}`,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: goal === g.id ? 'rgba(124,58,237,0.2)' : 'var(--surface3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <g.icon size={18} color={goal === g.id ? 'var(--violet)' : 'var(--text3)'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.label}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{g.desc}</div>
                    </div>
                    {goal === g.id && <CheckCircle size={18} color="var(--violet)" style={{ marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setStep(3)}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Semester Setup (Optional) */}
          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                Step 3 of {TOTAL_STEPS}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Set up your semester</h2>
                <span style={{
                  fontSize: '0.65rem', padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                  background: 'rgba(245,158,11,0.15)', color: 'var(--amber)',
                }}>OPTIONAL</span>
              </div>
              <p className="text-muted" style={{ marginBottom: 16, fontSize: '0.875rem', lineHeight: 1.6 }}>
                Paste your syllabus or timetable text and AI will automatically create your tasks, subjects, and attendance tracker. You can also do this later from the <strong>Semester Engine</strong> in Academics.
              </p>

              <textarea
                value={syllabusText}
                onChange={e => setSyllabusText(e.target.value)}
                placeholder="Paste syllabus, subject list, exam dates, or assignment schedule here..."
                style={{
                  width: '100%', minHeight: 130, resize: 'vertical', fontFamily: 'inherit',
                  fontSize: '0.85rem', background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 14px', color: 'var(--text)', outline: 'none',
                  boxSizing: 'border-box', lineHeight: 1.6,
                }}
              />

              {syllabusResult && !syllabusResult.error && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--mint)', marginBottom: 6 }}>
                    ✓ AI found: {syllabusResult.subjects?.length || 0} subjects, {syllabusResult.deadlines?.length || 0} deadlines
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>These will be added to your workspace when you complete setup.</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                {syllabusText.trim() && !syllabusResult && (
                  <button className="btn btn-secondary" onClick={handleSyllabusAnalyze} disabled={syllabusLoading || !hasValidKey}>
                    {syllabusLoading ? '...' : <><Sparkles size={14} /> Analyze</>}
                  </button>
                )}
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setStep(4)}>
                  {syllabusText.trim() ? 'Continue' : 'Skip for now'} <ArrowRight size={16} />
                </button>
              </div>
              {!hasValidKey && syllabusText.trim() && (
                <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: 8 }}>Add an API key in the next step to analyze your syllabus with AI.</div>
              )}
            </motion.div>
          )}

          {/* Step 4 — API Key (Optional) */}
          {step === 4 && (
            <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                Step 4 of {TOTAL_STEPS}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Connect AI</h2>
                <span style={{
                  fontSize: '0.65rem', padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                  background: 'rgba(245,158,11,0.15)', color: 'var(--amber)',
                }}>OPTIONAL</span>
              </div>
              <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.875rem', lineHeight: 1.6 }}>
                StudentOS works fully without an API key. Connect one to unlock personalized AI briefings, smart study plans, and the Semester Engine. You can always add this later in Settings.
              </p>

              {/* Provider tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'groq', label: '⚡ Groq', sub: 'Free · Recommended', link: 'https://console.groq.com' },
                  { id: 'openai', label: '🧠 OpenAI', sub: 'GPT-4o', link: 'https://platform.openai.com/api-keys' },
                  { id: 'gemini', label: '✨ Gemini', sub: 'Google AI', link: 'https://aistudio.google.com/app/apikey' },
                ].map(p => (
                  <button key={p.id} onClick={() => setProviderSelected(p.id)} style={{
                    flex: 1, padding: '8px 10px', borderRadius: 10, fontSize: '0.78rem', cursor: 'pointer',
                    fontWeight: 700, border: `1.5px solid ${providerSelected === p.id ? 'var(--violet2)' : 'var(--border)'}`,
                    background: providerSelected === p.id ? 'rgba(124,58,237,0.1)' : 'var(--surface2)',
                    color: 'var(--text)', transition: 'all 0.2s',
                  }}>
                    <div>{p.label}</div>
                    <div style={{ fontWeight: 400, color: 'var(--text3)', fontSize: '0.68rem' }}>{p.sub}</div>
                  </button>
                ))}
              </div>

              {providerSelected === 'groq' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="label" style={{ margin: 0 }}>Groq API Key (gsk-...)</label>
                    <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Get free key <ExternalLink size={11} />
                    </a>
                  </div>
                  <input className="input" type="password" placeholder="gsk-..." value={form.groqApiKey} onChange={e => set('groqApiKey', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  {isGroqValid && <div style={{ fontSize: '0.72rem', color: 'var(--mint)', marginTop: 4 }}>✓ Valid Groq key detected</div>}
                </div>
              )}
              {providerSelected === 'openai' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="label" style={{ margin: 0 }}>OpenAI API Key (sk-...)</label>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--violet2)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Get key <ExternalLink size={11} />
                    </a>
                  </div>
                  <input className="input" type="password" placeholder="sk-..." value={form.openaiApiKey} onChange={e => set('openaiApiKey', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  {isOpenAIValid && <div style={{ fontSize: '0.72rem', color: 'var(--mint)', marginTop: 4 }}>✓ Valid OpenAI key detected</div>}
                </div>
              )}
              {providerSelected === 'gemini' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="label" style={{ margin: 0 }}>Gemini API Key (AIza...)</label>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Get free key <ExternalLink size={11} />
                    </a>
                  </div>
                  <input className="input" type="password" placeholder="AIza..." value={form.geminiApiKey} onChange={e => set('geminiApiKey', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  {isGeminiValid && <div style={{ fontSize: '0.72rem', color: 'var(--mint)', marginTop: 4 }}>✓ Valid Gemini key detected</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setStep(3)}>Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleDone}>
                  <Sparkles size={16} /> {hasValidKey ? 'Launch StudentOS with AI' : 'Launch StudentOS'}
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={handleDone} style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>
                  Skip AI setup — I'll add a key later
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
