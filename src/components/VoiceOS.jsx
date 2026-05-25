import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDB, mutateDB, callGroq, toast } from '../store';

export default function VoiceOS({ onNavigate }) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const db = useDB();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else setTranscript(event.results[i][0].transcript);
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          processCommand(finalTranscript);
        }
      };
      rec.onerror = (e) => {
        console.error('Speech recognition error', e.error);
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!db.settings?.groqApiKey) {
      toast.error('Groq API Key missing. Add it in Settings.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      setTranscript('Listening...');
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  const processCommand = async (text) => {
    setProcessing(true);
    const systemPrompt = `You are Jarvis, the StudentOS AI voice assistant.
The user just said: "${text}"

Available Panels to navigate to: dashboard, chat, notes, tasks, gpa, attendance, timetable, codestudio, focus, profile, projects, certs, github, predictor, settings.

Extract the user's intent. Output ONLY a valid JSON object, nothing else.
Possible intents:
1. "navigate" - if they want to open a panel. { "action": "navigate", "panel": "panel_name" }
2. "add_task" - if they want to add a task. { "action": "add_task", "title": "task title", "subject": "subject" (or "General") }
3. "info" - if they ask a question about their data (like GPA, tasks). You have access to their stats. Return { "action": "speak", "text": "your spoken answer" }

Here is their current data context:
GPA: ${db.gpa?.semesters?.length ? db.gpa.semesters.length + ' semesters' : 'none'}
Tasks: ${db.tasks?.filter(t=>!t.completed)?.length || 0} pending
`;

    try {
      const res = await callGroq([], systemPrompt);
      const jsonStr = res.replace(/```json/g, '').replace(/```/g, '').trim();
      const intent = JSON.parse(jsonStr);

      if (intent.action === 'navigate') {
        onNavigate(intent.panel);
        toast.success(`Opening ${intent.panel}...`);
      } else if (intent.action === 'add_task') {
        mutateDB(d => {
          if (!d.tasks) d.tasks = [];
          d.tasks.unshift({
            id: Date.now().toString(),
            title: intent.title,
            subject: intent.subject || 'General',
            dueDate: new Date().toISOString().split('T')[0],
            completed: false
          });
        }, `Added voice task: ${intent.title}`);
        toast.success(`Task added: ${intent.title}`);
      } else if (intent.action === 'speak') {
        speakText(intent.text);
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't process voice command.");
    } finally {
      setProcessing(false);
      setTimeout(() => setTranscript(''), 3000);
    }
  };

  const speakText = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
    toast.success('Jarvis spoke a response.');
  };

  return (
    <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
      <AnimatePresence>
        {transcript && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 20, boxShadow: 'var(--shadow)', color: 'var(--text)', fontSize: '0.9rem', maxWidth: 250, backdropFilter: 'blur(10px)' }}>
            {processing ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 size={14} className="animate-spin" /> Thinking...</div> : transcript}
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={toggleListening}
        style={{ width: 56, height: 56, borderRadius: '50%', background: listening ? 'var(--red)' : 'var(--violet)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'all 0.2s', outline: listening ? '4px solid rgba(244,63,94,0.3)' : 'none' }}>
        {listening ? <StopCircle size={24} /> : <Mic size={24} />}
      </button>
    </div>
  );
}
