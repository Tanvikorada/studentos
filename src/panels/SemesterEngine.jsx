import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDB, mutateDB, aiAnalyze, toast } from '../store';
import {
  Upload, Sparkles, CheckCircle, Calendar, BookOpen,
  AlertTriangle, ArrowRight, Loader2, FileText, Clock, Target
} from 'lucide-react';

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function SemesterEngine() {
  const db = useDB();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('input'); // input | processing | done

  const hasKey = !!(window.localStorage.getItem('studentos_grok_key') || window.localStorage.getItem('studentos_openai_key'));

  const processSyllabus = async () => {
    if (!inputText.trim()) {
      toast.error('Paste your syllabus or semester documents first');
      return;
    }
    if (!hasKey) {
      toast.error('Add an API key in Settings to use the Semester Engine');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const prompt = `You are analyzing a student's academic semester document.

Extract and return a JSON object with this exact structure:
{
  "subjects": [{ "name": "string", "code": "string (if available)", "credits": number }],
  "deadlines": [{ "title": "string", "subject": "string", "date": "YYYY-MM-DD or description", "type": "assignment|exam|quiz|project|submission" }],
  "semesterStart": "YYYY-MM-DD or description",
  "semesterEnd": "YYYY-MM-DD or description",
  "workloadSummary": "2-3 sentence overall workload assessment",
  "recommendations": ["string", "string", "string"],
  "studyPlan": [{ "week": "Week 1-2", "focus": "topic/subject", "priority": "high|medium|low" }]
}

Analyze this document and extract all meaningful academic information:
---
${inputText.slice(0, 4000)}
---

Return ONLY valid JSON, no markdown.`;

      const raw = await aiAnalyze({ text: inputText }, prompt);
      
      let parsed;
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: create minimal structure from raw text
        parsed = {
          subjects: [],
          deadlines: [],
          workloadSummary: raw.slice(0, 300),
          recommendations: ['Review the pasted document manually', 'Add subjects individually', 'Set deadlines in Tasks'],
          studyPlan: [],
        };
      }

      setResult(parsed);
      setStep('done');
    } catch (err) {
      toast.error('AI processing failed. Check your API key.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const applyToWorkspace = () => {
    if (!result) return;

    let tasksAdded = 0;
    let attendanceAdded = 0;

    mutateDB(d => {
      // Add subjects to attendance tracker
      if (result.subjects?.length > 0) {
        const existingNames = new Set((d.attendance || []).map(a => a.name?.toLowerCase()));
        result.subjects.forEach(subj => {
          if (!existingNames.has(subj.name?.toLowerCase())) {
            d.attendance.push({
              id: Date.now().toString() + Math.random(),
              name: subj.name,
              code: subj.code || '',
              credits: subj.credits || 3,
              minPct: 75,
              records: [],
            });
            attendanceAdded++;
          }
        });
      }

      // Add deadlines as tasks
      if (result.deadlines?.length > 0) {
        result.deadlines.forEach(dl => {
          const dueDate = dl.date?.match(/\d{4}-\d{2}-\d{2}/) ? dl.date : '';
          d.tasks.push({
            id: Date.now().toString() + Math.random(),
            title: dl.title,
            desc: `Subject: ${dl.subject} | Type: ${dl.type}`,
            cat: 'Academics',
            due: dueDate,
            priority: dl.type === 'exam' ? 'high' : 'medium',
            done: false,
            status: 'todo',
            subtasks: [],
            recurrence: 'none',
            createdAt: new Date().toISOString(),
            completedAt: '',
          });
          tasksAdded++;
        });
      }

      // Save study plan recommendations
      d.studyPlan.recommendations = [
        { id: Date.now().toString(), text: `Semester Engine: ${result.workloadSummary}`, createdAt: new Date().toISOString() },
        ...(d.studyPlan.recommendations || []),
      ].slice(0, 15);
    }, 'Applied Semester Engine results');

    toast.success(`Applied! ${tasksAdded} deadlines added to Tasks, ${attendanceAdded} subjects added to Attendance.`);
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--violet), var(--mint))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              AI Semester Engine
            </h1>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0, marginTop: 2 }}>
              Paste your syllabus, timetable, or assignment sheets — AI sets up your entire semester.
            </p>
          </div>
        </div>
      </div>

      {/* How it works strip */}
      {step === 'input' && (
        <motion.div
          variants={container} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}
        >
          {[
            { icon: Upload, label: 'Paste document', desc: 'Syllabus, timetable, or assignment sheet text' },
            { icon: Sparkles, label: 'AI extracts', desc: 'Subjects, deadlines, workload, exam dates' },
            { icon: Target, label: 'Auto-applies', desc: 'Tasks, attendance tracker, study plan' },
          ].map((s, i) => (
            <motion.div key={i} variants={item} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'var(--surface3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
              }}>
                <s.icon size={18} color="var(--violet)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>{s.label}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Input area */}
      {step === 'input' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FileText size={16} color="var(--violet)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Paste Your Semester Document</span>
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Paste your syllabus, assignment sheet, or semester timetable here...\n\nExamples:\n• Course names and codes\n• Assignment due dates\n• Exam schedules\n• Weekly timetable\n• Project submission deadlines`}
            style={{
              width: '100%', minHeight: 200, resize: 'vertical', fontFamily: 'inherit',
              fontSize: '0.875rem', lineHeight: 1.7, background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px',
              color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {inputText.length} characters · {!hasKey && '⚠ Add an API key in Settings first'}
            </span>
            <button
              className="btn btn-primary"
              onClick={processSyllabus}
              disabled={!inputText.trim() || !hasKey}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Sparkles size={16} /> Analyze with AI <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Processing state */}
      {step === 'processing' && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', marginBottom: 20 }}
          >
            <Sparkles size={36} color="var(--violet)" />
          </motion.div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>AI is reading your semester...</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            Extracting subjects, deadlines, and building your academic roadmap.
          </div>
        </div>
      )}

      {/* Results */}
      {step === 'done' && result && (
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Workload summary */}
          <motion.div variants={item} className="card" style={{
            marginBottom: 16,
            borderLeft: '3px solid var(--violet)',
            background: 'rgba(139,92,246,0.05)',
          }}>
            <div className="section-title" style={{ marginBottom: 8 }}><Sparkles size={15} /> AI Workload Assessment</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{result.workloadSummary || 'Semester analyzed.'}</p>
          </motion.div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            {/* Subjects found */}
            <motion.div variants={item} className="card">
              <div className="section-title" style={{ marginBottom: 12 }}><BookOpen size={15} /> Subjects Detected ({result.subjects?.length || 0})</div>
              {result.subjects?.length > 0 ? result.subjects.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem',
                }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <span className="badge badge-gray">{s.credits || 3} cr</span>
                </div>
              )) : (
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>No subjects extracted. Try pasting more detailed text.</div>
              )}
            </motion.div>

            {/* Deadlines found */}
            <motion.div variants={item} className="card">
              <div className="section-title" style={{ marginBottom: 12 }}><Calendar size={15} /> Deadlines Detected ({result.deadlines?.length || 0})</div>
              {result.deadlines?.length > 0 ? result.deadlines.slice(0, 8).map((d, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '7px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                    background: d.type === 'exam' ? 'var(--red)' : 'var(--violet)',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{d.subject} · {d.date}</div>
                  </div>
                </div>
              )) : (
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>No deadlines extracted.</div>
              )}
            </motion.div>
          </div>

          {/* AI Recommendations */}
          {result.recommendations?.length > 0 && (
            <motion.div variants={item} className="card" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 12 }}><AlertTriangle size={15} /> AI Recommendations</div>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)',
                  fontSize: '0.875rem', alignItems: 'flex-start',
                }}>
                  <CheckCircle size={14} color="var(--mint)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{r}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Study Plan Preview */}
          {result.studyPlan?.length > 0 && (
            <motion.div variants={item} className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 12 }}><Clock size={15} /> Suggested Study Plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.studyPlan.slice(0, 6).map((w, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px',
                    background: 'var(--surface2)', borderRadius: 8, fontSize: '0.85rem',
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--text3)', minWidth: 70, fontSize: '0.75rem' }}>{w.week}</span>
                    <span style={{ flex: 1 }}>{w.focus}</span>
                    <span className={`badge ${w.priority === 'high' ? 'badge-red' : w.priority === 'medium' ? 'badge-amber' : 'badge-gray'}`}>{w.priority}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div variants={item} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={applyToWorkspace} style={{ flex: 1 }}>
              <CheckCircle size={16} /> Apply to My Workspace
            </button>
            <button className="btn btn-secondary" onClick={() => { setStep('input'); setResult(null); setInputText(''); }}>
              Start Over
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* No key state */}
      {!hasKey && step === 'input' && (
        <div className="card" style={{
          textAlign: 'center', padding: '28px 24px',
          border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)',
        }}>
          <AlertTriangle size={24} color="var(--amber)" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, marginBottom: 6 }}>API Key Required</div>
          <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 16 }}>
            Connect an AI provider in Settings to use the Semester Engine. Grok or OpenAI are supported.
          </div>
          <button className="btn btn-primary btn-sm">Go to Settings →</button>
        </div>
      )}
    </div>
  );
}
