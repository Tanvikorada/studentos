import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mutateDB, toast, setGroqApiKey, setOpenAIApiKey } from '../store';
import { CheckCircle, BookOpen, Briefcase, Target, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';

const GOALS = [
  { id: 'academics', icon: BookOpen, label: 'Academics First', desc: 'GPA, notes, attendance tracking' },
  { id: 'career', icon: Briefcase, label: 'Career Focused', desc: 'Internships, projects, GitHub' },
  { id: 'balanced', icon: Target, label: 'Balanced', desc: 'Everything, in harmony' },
];

const AI_FEATURES = [
  'Daily academic briefing', 'AI study plan generator',
  'Mock interview coach', 'Note summarizer & flashcards',
  'Task breakdown assistant', 'Code AI debugger',
  'Career gap analysis', 'Attendance risk advisor',
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', college: '', dept: '', groqApiKey: '', openaiApiKey: '' });
  const [goal, setGoal] = useState('balanced');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isGroqValid = form.groqApiKey?.startsWith('gsk_') && form.groqApiKey.length > 20;
  const isOpenAIValid = form.openaiApiKey?.startsWith('sk-') && form.openaiApiKey.length > 20;
  const hasValidKey = isGroqValid || isOpenAIValid;

  const handleDone = () => {
    if (form.groqApiKey) setGroqApiKey(form.groqApiKey);
    if (form.openaiApiKey) setOpenAIApiKey(form.openaiApiKey);
    
    mutateDB(d => {
      d.profile.name = form.name || d.profile.name;
      d.profile.college = form.college || d.profile.college;
      d.profile.dept = form.dept || d.profile.dept;
      d.settings.onboardingComplete = true;
      if (isOpenAIValid && !isGroqValid) d.settings.aiProvider = 'openai';
      if (isGroqValid && !isOpenAIValid) d.settings.aiProvider = 'groq';
    }, 'Completed onboarding');
    toast.success(`Welcome to StudentOS, ${form.name || 'Student'}!`);
    onDone();
  };

  return (
    <div className="modal-overlay">
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'var(--violet)' : 'var(--surface3)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 — Profile */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>Let's set up your space</h2>
              <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.875rem' }}>Tell us a bit about yourself</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>What's your primary goal?</h2>
              <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.875rem' }}>We'll optimize your dashboard accordingly</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GOALS.map(g => (
                  <div key={g.id} onClick={() => setGoal(g.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      borderRadius: 'var(--radius)', cursor: 'pointer',
                      background: goal === g.id ? 'rgba(124,58,237,0.15)' : 'var(--surface2)',
                      border: `1px solid ${goal === g.id ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: goal === g.id ? 'rgba(124,58,237,0.2)' : 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: goal === g.id ? 'var(--violet2)' : 'var(--text3)' }}>
                      <g.icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{g.label}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{g.desc}</div>
                    </div>
                    {goal === g.id && <CheckCircle size={18} style={{ marginLeft: 'auto', color: 'var(--violet2)' }} />}
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

          {/* Step 3 — AI Integration (Unified) */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>🤖 Power up with AI</h2>
              <p className="text-muted" style={{ marginBottom: 14, fontSize: '0.875rem' }}>
                StudentOS acts as your personal intelligence layer. Adding an API key securely enables automated study planning, resume scoring, and the AI tutor.
              </p>

              {/* AI features grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 20, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                {AI_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: hasValidKey ? 'var(--mint2)' : 'var(--text3)' }}>
                    <span style={{ fontSize: '0.7rem' }}>{hasValidKey ? '✅' : '⬜'}</span> {f}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="label" style={{ margin: 0 }}>Premium: OpenAI API Key</label>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--violet2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                    >
                      <ExternalLink size={12} /> platform.openai.com
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type="password"
                      placeholder="sk-..."
                      value={form.openaiApiKey}
                      onChange={e => set('openaiApiKey', e.target.value)}
                      style={{ fontFamily: 'monospace', paddingRight: isOpenAIValid ? 44 : undefined }}
                    />
                    {isOpenAIValid && (
                      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--mint2)', fontSize: '1.1rem' }}>✓</span>
                    )}
                  </div>
                  <p className="text-faint" style={{ fontSize: '0.72rem', marginTop: 8 }}>
                    Uses GPT-4o. Best for deep coding and reasoning.
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="label" style={{ margin: 0 }}>Free Alternative: Groq API Key</label>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--mint2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                    >
                      <ExternalLink size={12} /> console.groq.com
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type="password"
                      placeholder="gsk_..."
                      value={form.groqApiKey}
                      onChange={e => set('groqApiKey', e.target.value)}
                      style={{ fontFamily: 'monospace', paddingRight: isGroqValid ? 44 : undefined }}
                    />
                    {isGroqValid && (
                      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--mint2)', fontSize: '1.1rem' }}>✓</span>
                    )}
                  </div>
                  <p className="text-faint" style={{ fontSize: '0.72rem', marginTop: 8 }}>
                    Uses LLaMA 3. Free tier: 14,400 req/day. Blazing fast.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setStep(4)}>
                  {hasValidKey ? '🚀 AI Connected — Continue' : 'Skip for now'} <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Launch */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--violet), var(--mint))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Sparkles size={28} color="#fff" />
              </motion.div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>You're all set, {form.name || 'Student'}!</h2>
              <p className="text-muted" style={{ marginBottom: 28, fontSize: '0.875rem' }}>
                {hasValidKey ? '✅ AI features are active and your keys are saved securely.' : '⚠️ AI features are off — add your keys in Settings anytime.'} How do you want to start?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleDone}>
                  ✨ Launch StudentOS
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => setStep(3)}>
                  ← Go back to add API key
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
