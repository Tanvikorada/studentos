import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDB, mutateDB, toast } from '../store';
import { CheckCircle, BookOpen, Briefcase, Target, ArrowRight, Sparkles } from 'lucide-react';

const GOALS = [
  { id: 'academics', icon: BookOpen, label: 'Academics First', desc: 'GPA, notes, attendance tracking' },
  { id: 'career', icon: Briefcase, label: 'Career Focused', desc: 'Internships, projects, GitHub' },
  { id: 'balanced', icon: Target, label: 'Balanced', desc: 'Everything, in harmony' },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', college: '', dept: '', groqApiKey: '' });
  const [goal, setGoal] = useState('balanced');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDone = (loadDemo) => {
    mutateDB(d => {
      d.profile.name = form.name || d.profile.name;
      d.profile.college = form.college || d.profile.college;
      d.profile.dept = form.dept || d.profile.dept;
      d.settings.groqApiKey = form.groqApiKey || d.settings.groqApiKey;
      d.settings.onboardingComplete = true;
    }, 'Completed onboarding');
    toast.success(`Welcome to StudentOS, ${form.name || 'Student'}!`);
    onDone();
  };

  return (
    <div className="modal-overlay">
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}>

        {/* Progress */}
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

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>Connect AI when ready</h2>
              <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.875rem' }}>StudentOS works without a key. Add Groq now to unlock daily briefings, study plans, interviews, and writing help.</p>
              <div>
                <label className="label">Groq API Key</label>
                <input className="input" type="password" placeholder="gsk_... optional" value={form.groqApiKey} onChange={e => set('groqApiKey', e.target.value)} style={{ fontFamily: 'monospace' }} />
                <p className="text-faint" style={{ fontSize: '0.75rem', marginTop: 8 }}>Stored locally in your encrypted StudentOS vault.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setStep(4)}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--violet), var(--mint))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Sparkles size={28} color="#fff" />
              </motion.div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>You're all set, {form.name || 'Student'}!</h2>
              <p className="text-muted" style={{ marginBottom: 28, fontSize: '0.875rem' }}>How do you want to start?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => handleDone(false)}>
                  ✨ Start with Demo Workspace
                </button>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleDone(false)}>
                  Start Blank
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
