import { useState, useEffect, useRef } from 'react';
import { Bot, Loader2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDB, mutateDB, callAI, toast } from '../store';

export default function VoiceOS({ onNavigate }) {
  const [listening, setListening] = useState(false);
  const [wakeWordMode, setWakeWordMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const db = useDB();
  const agentName = db.settings?.agentName || 'Jarvis';

  if (!db.settings?.onboardingComplete) return null;

  useEffect(() => {
    // We do not auto-complete onboarding here anymore
    // The Onboarding component handles it.

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = wakeWordMode;
      rec.interimResults = true;
      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else setTranscript(event.results[i][0].transcript);
        }
        if (finalTranscript) {
          const lower = finalTranscript.toLowerCase().trim();
          const trigger = `hey ${agentName.toLowerCase()}`;
          if (wakeWordMode) {
            if (lower.includes(trigger)) {
              const command = lower.split(trigger)[1].trim();
              if (command) {
                setTranscript(command);
                processCommand(command);
              } else {
                setTranscript(`Listening... what can I do for you?`);
                speakText(`Yes?`);
              }
            } else {
              setTranscript(finalTranscript); // Just show what it heard
            }
          } else {
            setTranscript(finalTranscript);
            processCommand(finalTranscript);
          }
        }
      };
      rec.onerror = (e) => {
        if (e.error !== 'no-speech') console.error('Speech recognition error', e.error);
        if (!wakeWordMode) setListening(false);
      };
      rec.onend = () => {
        if (wakeWordMode && listening) {
          try { rec.start(); } catch (e) {}
        } else {
          setListening(false);
        }
      };
      recognitionRef.current = rec;
    }
  }, [db.settings?.onboardingComplete, agentName, wakeWordMode, listening]);

  const toggleListening = () => {
    if (!db.settings?.groqApiKey && !db.settings?.openaiApiKey && !window.localStorage.getItem('studentos_openai_key')) {
      toast.error('AI API Key missing. Add it in Settings.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      setTranscript(wakeWordMode ? `Wake Word Mode: Say "Hey ${agentName}"` : 'Listening...');
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  const processCommand = async (text) => {
    setProcessing(true);
    const systemPrompt = `You are ${agentName}, the intelligent AI voice assistant for StudentOS.
The user just said: "${text}"

You have FULL control over the user's application database via JavaScript. 
The database 'd' has the following schema:
- d.tasks: array of {id, title, subject, dueDate, completed}
- d.timetable: object { Monday: [{id, subject, type, startTime, endTime, room, notes}], Tuesday: [...], ... }
- d.profile: object { name, college, dept, bio, headline }
- d.notes: array of {id, title, content, date}
- d.attendance: array of {id, subject, present, total}

Determine the intent and respond ONLY with a valid JSON object.
Possible intents:
1. "navigate": { "action": "navigate", "panel": "panel_name" } (panels: dashboard, chat, notes, tasks, gpa, attendance, timetable, codestudio, focus, profile, projects, certs, github, predictor, settings)
2. "speak": { "action": "speak", "text": "spoken response" } (use this to chat, answer questions, or acknowledge un-actionable statements)
3. "mutate": If the user wants to add, update, or delete ANY data (e.g., schedule, tasks, profile).
{ 
  "action": "mutate", 
  "code": "d.timetable.Monday.push({id: Date.now().toString(), subject: 'Math', type: 'Lecture', startTime: '10:00', endTime: '11:00'}); d.profile.bio = 'Love math';",
  "speakMsg": "I have added Math to your Monday schedule and updated your bio."
}

CRITICAL RULES for 'mutate':
- The 'code' must be pure JS that directly mutates 'd'. Do NOT use 'const' or 'let'. Do not return anything.
- Assume 'd' is already defined.
- Use Date.now().toString() for unique IDs.

User Context:
Name: ${db.profile?.name || 'Unknown'}
Pending Tasks: ${db.tasks?.filter(t=>!t.completed)?.length || 0}
`;

    try {
      const res = await callAI([], systemPrompt);
      const jsonStr = res.replace(/```json/g, '').replace(/```/g, '').trim();
      const intent = JSON.parse(jsonStr);

      const appendLog = (aiReply) => {
        mutateDB(d => {
          if (!d.chatThreads) d.chatThreads = { general: [] };
          if (!d.chatThreads.general) d.chatThreads.general = [];
          d.chatThreads.general.push({ role: 'user', content: text, display: text });
          d.chatThreads.general.push({ role: 'assistant', content: aiReply });
        }, 'Voice command logged');
      };

      if (intent.action === 'navigate') {
        onNavigate(intent.panel);
        toast.success(`Opening ${intent.panel}...`);
        speakText(`Opening ${intent.panel}`);
        appendLog(`*Navigated to ${intent.panel}*`);
      } else if (intent.action === 'mutate') {
        mutateDB(d => {
          const fn = new Function('d', `"use strict";\n${intent.code}`);
          fn(d);
        }, `${agentName} updated data`);
        if (intent.speakMsg) {
          speakText(intent.speakMsg);
          appendLog(intent.speakMsg);
        } else {
          appendLog('*Executed data mutation*');
        }
      } else if (intent.action === 'speak') {
        speakText(intent.text);
        appendLog(intent.text);
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't process command.");
      speakText("Sorry, I had trouble understanding that.");
    } finally {
      setProcessing(false);
      setTimeout(() => setTranscript(''), 3000);
    }
  };

  const speakText = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
    toast.success(`${agentName} spoke.`);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {listening && (
          <button 
            onClick={() => {
              setWakeWordMode(!wakeWordMode);
              if (recognitionRef.current) recognitionRef.current.stop(); // restart with new mode
            }}
            style={{ padding: '6px 12px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', color: wakeWordMode ? 'var(--mint)' : 'var(--text3)', fontSize: '0.75rem', cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
            {wakeWordMode ? 'Wake Word ON' : 'Wake Word OFF'}
          </button>
        )}
        <button 
          onClick={toggleListening}
          style={{ width: 56, height: 56, borderRadius: '50%', background: listening ? 'var(--red)' : 'linear-gradient(135deg, var(--violet), var(--mint))', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'all 0.2s', outline: listening ? '4px solid rgba(244,63,94,0.3)' : 'none' }}>
          {listening ? <StopCircle size={24} /> : <Bot size={26} />}
        </button>
      </div>
    </div>
  );
}
