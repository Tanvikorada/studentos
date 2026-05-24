// StudentOS Global Store
// localStorage-backed state with pub/sub

import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'studentos_db';
const SCHEMA_VERSION = 2;
let SECRET_KEY = null;

const defaultDB = {
  schemaVersion: SCHEMA_VERSION,
  tasks: [],
  notes: [
    { id: '1', title: 'Welcome to StudentOS', content: 'This is your academic command center. You can add your tasks, notes, track attendance, and manage your portfolio right here!', date: new Date().toLocaleDateString() }
  ],
  attendance: [],
  projects: [],
  internships: [],
  certs: [],
  skills: [],
  github: { username: '', trackedData: null },
  profile: {
    name: 'Student',
    college: '',
    dept: '',
    headline: 'Student | Learner | Builder',
    quickNote: 'Ready to crush this semester!',
    bio: '',
    socials: { linkedin: '', github: '', portfolio: '' },
  },
  xp: 0,
  level: 1,
  networking: [],
  recentActivity: [
    { text: 'Created StudentOS account', date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() },
  ],
  resumeData: {
    basics: { name: '', email: '', phone: '', summary: '', location: '' },
    education: [],
    experience: [],
    skills: [],
    projects: [],
  },
  chatHistory: [],
  chatThreads: {
    general: [],
    academics: [],
    exams: [],
    career: [],
  },
  gpa: {
    semesters: [],
    targets: { desiredCGPA: '' },
  },
  timetable: {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  },
  codeSnippets: [],
  settings: {
    groqApiKey: '',
    theme: 'chatgpt-style',
    notificationsEnabled: false,
    onboardingComplete: false,
  },
  productivity: [], // activity heatmap data
  studyPlan: {
    dailyBriefing: '',
    lastBriefingDate: '',
    recommendations: [],
  },
  focusSessions: [],
  reminders: [],
  notifications: [],
  portfolioConfig: {
    layout: 'cards',
    sections: ['about', 'projects', 'skills', 'contact'],
  },
  linkedinData: {
    url: '',
    importedText: '',
    lastAnalyzed: '',
  },
  interviewHistory: [],
};

// Toast pub/sub
const toastListeners = [];
export const toast = {
  subscribe: (fn) => { toastListeners.push(fn); return () => toastListeners.splice(toastListeners.indexOf(fn), 1); },
  emit: (msg, type = 'info') => toastListeners.forEach(fn => fn({ msg, type, id: Date.now() })),
  success: (msg) => toast.emit(msg, 'success'),
  error: (msg) => toast.emit(msg, 'error'),
  info: (msg) => toast.emit(msg, 'info'),
};

// State listeners
const stateListeners = [];
let db = null;

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDefaults(base, incoming) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  if (!isPlainObject(incoming)) return out;

  Object.keys(incoming).forEach((key) => {
    if (isPlainObject(base[key]) && isPlainObject(incoming[key])) {
      out[key] = mergeDefaults(base[key], incoming[key]);
    } else {
      out[key] = incoming[key];
    }
  });

  return out;
}

function normalizeTask(task) {
  return {
    id: task.id || Date.now().toString(),
    title: task.title || task.text || 'Untitled task',
    desc: task.desc || task.description || '',
    cat: task.cat || task.category || 'General',
    status: task.status || (task.done ? 'done' : 'todo'),
    done: Boolean(task.done || task.status === 'done'),
    due: task.due || '',
    priority: task.priority || 'medium',
    recurrence: task.recurrence || 'none',
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    reminderState: task.reminderState || {},
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: task.completedAt || '',
  };
}

function migrateDB(raw) {
  const migrated = mergeDefaults(defaultDB, raw || {});
  migrated.schemaVersion = SCHEMA_VERSION;

  migrated.tasks = (migrated.tasks || []).map(normalizeTask);
  migrated.notes = (migrated.notes || []).map(note => ({
    id: note.id || Date.now().toString(),
    title: note.title || 'Untitled note',
    content: note.content || '',
    date: note.date || new Date().toLocaleDateString(),
    updatedAt: note.updatedAt || note.date || new Date().toISOString(),
    tags: Array.isArray(note.tags) ? note.tags : [],
    subject: note.subject || '',
  }));

  if (Array.isArray(migrated.chatHistory) && migrated.chatHistory.length && !migrated.chatThreads.general.length) {
    migrated.chatThreads.general = migrated.chatHistory;
  }

  return migrated;
}

function loadDB() {
  if (!SECRET_KEY) return db || defaultDB;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const bytes = CryptoJS.AES.decrypt(saved, SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedData) {
          const parsed = JSON.parse(decryptedData);
          db = migrateDB(parsed);
        } else {
          throw new Error('Decryption failed, might be plain text');
        }
      } catch (err) {
        throw new Error('Decryption failed');
      }
    } else {
      db = migrateDB(defaultDB);
    }
  } catch (e) {
    throw e;
  }
  if (!db.productivity || db.productivity.length < 50) {
    db.productivity = generateProductivityData();
  }
  return db;
}

function generateProductivityData() {
  const data = [];
  const now = new Date();
  for (let i = 119; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 8);
    if (count > 0) data.push({ date: dateStr, count });
  }
  return data;
}

function saveDB() {
  if (!SECRET_KEY) return;
  try {
    const jsonString = JSON.stringify(db);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (e) {
    console.error('Save failed:', e);
  }
  stateListeners.forEach(fn => fn(db));
}

export function unlockDB(password) {
  SECRET_KEY = password;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      loadDB();
    } else {
    db = migrateDB(defaultDB);
      saveDB();
    }
    stateListeners.forEach(fn => fn(db));
    return true;
  } catch (err) {
    SECRET_KEY = null;
    return false;
  }
}

export function lockDB() {
  SECRET_KEY = null;
      db = migrateDB(defaultDB);
  stateListeners.forEach(fn => fn(db));
}

export function getDB() {
  if (!db) db = migrateDB(defaultDB);
  return db;
}

export function subscribeDB(fn) {
  stateListeners.push(fn);
  return () => stateListeners.splice(stateListeners.indexOf(fn), 1);
}

export function useDB() {
  const [state, setState] = useState(() => getDB());
  useEffect(() => {
    setState(getDB());
    return subscribeDB((newDB) => {
      setState({ ...newDB });
    });
  }, []);
  return state;
}


export function mutateDB(updater, activityText = null) {
  if (!db) loadDB();
  updater(db);
  if (activityText) {
    db.recentActivity.unshift({
      text: activityText,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    });
    if (db.recentActivity.length > 50) db.recentActivity = db.recentActivity.slice(0, 50);
    // Add to productivity
    const today = new Date().toISOString().split('T')[0];
    const existing = db.productivity.find(p => p.date === today);
    if (existing) existing.count = (existing.count || 0) + 1;
    else db.productivity.push({ date: today, count: 1 });
  }
  saveDB();
}

export function resetDB() {
  db = migrateDB({ ...defaultDB, productivity: generateProductivityData() });
  saveDB();
  toast.success('Data reset complete');
}

export function exportDB() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'studentos_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Data exported!');
}

export function importDB(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      db = migrateDB(parsed);
      saveDB();
      toast.success('Data imported!');
    } catch (err) {
      toast.error('Invalid file');
    }
  };
  reader.readAsText(file);
}

// Grade point map
export const GRADE_POINTS = {
  'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0,
};

export function calcCGPA(semesters) {
  if (!semesters || semesters.length === 0) return '0.00';
  let totalPoints = 0, totalCredits = 0;
  semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      const gp = GRADE_POINTS[sub.grade] || 0;
      totalPoints += gp * sub.credits;
      totalCredits += sub.credits;
    });
  });
  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
}

export function calcGradeFromMarks(marks) {
  if (marks === '' || marks === null) return '';
  const m = parseFloat(marks);
  if (isNaN(m)) return '';
  if (m >= 90) return 'O';
  if (m >= 80) return 'A+';
  if (m >= 70) return 'A';
  if (m >= 60) return 'B+';
  if (m >= 50) return 'B';
  if (m >= 45) return 'C';
  return 'F';
}

export function addXP(amount) {
  mutateDB(d => {
    d.xp = (d.xp || 0) + amount;
    // Level formula: level = 1 + floor(sqrt(xp / 100))
    const newLevel = 1 + Math.floor(Math.sqrt(d.xp / 100));
    if (newLevel > (d.level || 1)) {
      toast.success(`🎉 Level Up! You are now Level ${newLevel}`);
    }
    d.level = newLevel;
  }, 'Gained XP');
}

export function calcAttendance(records) {
  if (!records || records.length === 0) return { present: 0, total: 0, pct: 0 };
  const present = records.filter(r => r.status === 'p').length;
  const total = records.length;
  const pct = Math.round((present / total) * 100);
  return { present, total, pct };
}

// Groq API call
export async function callGroq(messages, systemPrompt = '') {
  const db = getDB();
  const apiKey = db.settings?.groqApiKey;
  if (!apiKey) {
    return "⚠️ No Groq API key set. Go to Settings → add your Groq API key to enable AI features.";
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        max_tokens: 1024,
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API error');
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
  } catch (err) {
    return `❌ Error: ${err.message}`;
  }
}

export function buildStudentContext(sourceDB = getDB()) {
  const semesters = sourceDB.gpa?.semesters || [];
  const subjects = semesters.flatMap(sem => sem.subjects || []);
  const openTasks = (sourceDB.tasks || []).filter(t => !t.done).slice(0, 8);
  const attendanceWarnings = (sourceDB.attendance || [])
    .map(subj => ({ name: subj.name, ...calcAttendance(subj.records || []) }))
    .filter(subj => subj.total > 0 && subj.pct < 80);

  return {
    profile: sourceDB.profile,
    cgpa: calcCGPA(semesters),
    subjects: subjects.map(s => ({ name: s.name, grade: s.grade, credits: s.credits })),
    openTasks: openTasks.map(t => ({ title: t.title, due: t.due, priority: t.priority, category: t.cat })),
    attendanceWarnings,
    skills: sourceDB.skills || [],
    projects: sourceDB.projects || [],
    timetable: sourceDB.timetable || {},
  };
}

export async function aiSummarize(text, purpose = 'academic summary') {
  if (!text?.trim()) return 'Nothing to summarize yet.';
  return callGroq(
    [{ role: 'user', content: text }],
    `Summarize this content for a college student. Purpose: ${purpose}. Use concise bullets and include action items when useful.`
  );
}

export async function aiAnalyze(context, question) {
  const studentContext = buildStudentContext();
  return callGroq(
    [{ role: 'user', content: `Question: ${question}\n\nContext:\n${JSON.stringify(context, null, 2)}` }],
    `You are StudentOS academic intelligence. Use the student's real profile and records to give specific, practical guidance. Student context: ${JSON.stringify(studentContext)}`
  );
}

export async function notifyUser(title, body, options = {}) {
  if (!('Notification' in window)) {
    toast.info(body || title);
    return false;
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    mutateDB(d => {
      d.settings.notificationsEnabled = permission === 'granted';
    });
  }

  if (Notification.permission === 'granted') {
    new Notification(title, { body, ...options });
    return true;
  }

  toast.info(body || title);
  return false;
}

export function addNotification(title, body, type = 'info') {
  mutateDB(d => {
    d.notifications.unshift({
      id: Date.now().toString(),
      title,
      body,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
    d.notifications = d.notifications.slice(0, 50);
  });
}

export function scheduleReminder(taskId, dueDate) {
  const due = new Date(dueDate);
  if (!taskId || Number.isNaN(due.getTime())) return false;

  const task = (getDB().tasks || []).find(t => t.id === taskId);
  if (!task) return false;

  const checkpoints = [
    { key: 'day', at: due.getTime() - 24 * 60 * 60 * 1000, label: 'Due in 24 hours' },
    { key: 'hour', at: due.getTime() - 60 * 60 * 1000, label: 'Due in 1 hour' },
    { key: 'deadline', at: due.getTime(), label: 'Deadline now' },
  ];

  checkpoints.forEach(checkpoint => {
    const delay = checkpoint.at - Date.now();
    if (delay <= 0 || delay > 2147483647) return;

    window.setTimeout(() => {
      const current = (getDB().tasks || []).find(t => t.id === taskId);
      if (!current || current.done) return;
      const title = `StudentOS: ${checkpoint.label}`;
      const body = current.title;
      addNotification(title, body, 'reminder');
      notifyUser(title, body);
    }, delay);
  });

  mutateDB(d => {
    d.reminders = (d.reminders || []).filter(r => r.taskId !== taskId);
    d.reminders.push({ taskId, dueDate: due.toISOString(), scheduledAt: new Date().toISOString() });
  });
  return true;
}

// Removed auto-init to allow AuthScreen to unlock
