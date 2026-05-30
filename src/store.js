// StudentOS Global Store
// localStorage-backed state with pub/sub

import { useState, useEffect } from 'react';
import { auth, signOut, onAuthStateChanged, db as firestoreDB, doc, setDoc, getDoc, onSnapshot } from './firebase';

const STORAGE_KEY = 'studentos_db';
const SCHEMA_VERSION = 3;
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
  tasks: [],
  notes: [],
  attendance: [],
  recentActivity: [],
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
    theme: 'chatgpt-style',
    notificationsEnabled: false,
    onboardingComplete: false,
    aiProvider: 'grok',
    geminiApiKey: '',
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
    if (incoming[key] == null) {
      // Keep base value if incoming is null or undefined
      out[key] = out[key] !== undefined ? out[key] : incoming[key];
    } else if (isPlainObject(base[key]) && isPlainObject(incoming[key])) {
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

  if (migrated.settings?.groqApiKey) {
    setGroqApiKey(migrated.settings.groqApiKey);
    delete migrated.settings.groqApiKey;
  }

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

  // Wipe fake productivity data introduced before schema version 3
  if ((raw.schemaVersion || 1) < 3) {
    migrated.productivity = [];
  }

  return migrated;
}

let firebaseUid = null;
let saveTimeout = null;
let unsubscribeSnapshot = null;
let applyingRemoteSnapshot = false;



function saveDB() {
  stateListeners.forEach(fn => fn(db));

  if (applyingRemoteSnapshot) return;
  
  if (firebaseUid) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        await setDoc(doc(firestoreDB, 'users', firebaseUid), db);
      } catch (e) {
        console.error('Failed to sync to cloud', e);
      }
    }, 1500); // 1.5s debounce
  } else if (SECRET_KEY) {
    // Local fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

export async function initFirebaseUser(uid, userObj) {
  firebaseUid = uid;
  SECRET_KEY = null;
  const userRef = doc(firestoreDB, 'users', uid);
  
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      db = migrateDB(snap.data());
    } else {
      db = migrateDB(defaultDB);
      if (userObj?.displayName) db.profile.name = userObj.displayName;
      if (userObj?.email) db.resumeData.basics.email = userObj.email;
      await setDoc(userRef, db);
    }
  } catch(e) {
    console.error(e);
    db = migrateDB(defaultDB);
  }
  
  if (!db.productivity) {
    db.productivity = [];
  }
  
  stateListeners.forEach(fn => fn(db));
  
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      applyingRemoteSnapshot = true;
      db = migrateDB(docSnap.data());
      if (!db.productivity) {
        db.productivity = [];
      }
      stateListeners.forEach(fn => fn(db));
      applyingRemoteSnapshot = false;
    }
  });
}

export function unlockDB(password, forceNew = false) {
  SECRET_KEY = password;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && !forceNew) {
      db = migrateDB(JSON.parse(saved));
    } else {
      db = migrateDB(defaultDB);
      saveDB();
    }
    if (!db.productivity) {
      db.productivity = [];
    }
    stateListeners.forEach(fn => fn(db));
    return true;
  } catch {
    SECRET_KEY = null;
    return false;
  }
}

export async function lockDB() {
  SECRET_KEY = null;
  firebaseUid = null;
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Firebase sign out error:', e);
  }
  db = migrateDB(defaultDB);
  stateListeners.forEach(fn => fn(db));
  toast.info('Workspace locked');
}

export function isDBUnlocked() {
  return !!(firebaseUid || SECRET_KEY);
}

export function getDB() {
  if (!db) db = migrateDB(defaultDB);
  return db;
}

export const getGroqApiKey = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('studentos_groq_key');
};

export const setGroqApiKey = (key) => {
  if (typeof window !== 'undefined') {
    if (key) {
      window.localStorage.setItem('studentos_groq_key', key);
    } else {
      window.localStorage.removeItem('studentos_groq_key');
    }
  }
};

// ─── DEMO DATA SEED ────────────────────────────────────────────────────────────
// Called when a user enters Test Mode. Populates a realistic student profile.
export function seedDemoData() {
  const today = new Date();
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };
  const daysFwd = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  // Build attendance records for the past 6 weeks realistically
  const makeRecords = (presentRatio) => {
    const records = [];
    for (let i = 42; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      if (day === 0 || day === 6) continue; // skip weekends
      records.push({ date: d.toISOString().split('T')[0], status: Math.random() < presentRatio ? 'p' : 'a' });
    }
    return records;
  };

  mutateDB(d => {
    // ── Profile ──────────────────────────────────────────────────
    d.profile.name = 'Aarav Mehta';
    d.profile.college = 'BITS Pilani';
    d.profile.dept = 'B.Tech Computer Science';
    d.profile.headline = 'CS Student · Full-Stack Dev · Open Source Enthusiast';
    d.profile.quickNote = 'End-sem in 3 weeks. Focus mode ON 🎯';
    d.profile.bio = 'Final year CS student passionate about building products that matter. Love React, distributed systems, and hackathons.';
    d.profile.socials = { linkedin: 'linkedin.com/in/aaravmehta', github: 'github.com/aarav-dev', portfolio: 'aaravmehta.dev' };

    // ── Tasks ─────────────────────────────────────────────────────
    d.tasks = [
      { id: '1001', title: 'Complete DBMS Assignment – ER Diagrams', desc: 'Draw ER diagram for Library Management System. Submit on Moodle.', cat: 'Academics', due: daysFwd(2), priority: 'high', status: 'inprogress', done: false, recurrence: 'none', subtasks: [{ id: 's1', text: 'Draw entity sets', done: true }, { id: 's2', text: 'Add relationships', done: false }, { id: 's3', text: 'Upload to Moodle', done: false }], createdAt: new Date().toISOString(), completedAt: '' },
      { id: '1002', title: 'Study for OS Mid-Semester Exam', desc: 'Cover: Process Scheduling, Deadlocks, Memory Management chapters 5-9.', cat: 'Academics', due: daysFwd(5), priority: 'high', status: 'todo', done: false, recurrence: 'none', subtasks: [], createdAt: new Date().toISOString(), completedAt: '' },
      { id: '1003', title: 'Push Portfolio Website v2', desc: 'Add Projects section, dark mode toggle, and deploy on Vercel.', cat: 'Career', due: daysFwd(7), priority: 'medium', status: 'inprogress', done: false, recurrence: 'none', subtasks: [{ id: 's4', text: 'Add Projects section', done: true }, { id: 's5', text: 'Dark mode toggle', done: true }, { id: 's6', text: 'Deploy on Vercel', done: false }], createdAt: new Date().toISOString(), completedAt: '' },
      { id: '1004', title: 'Submit Internship Application – Google STEP', desc: 'Prepare resume, write cover letter, get 2 LORs.', cat: 'Career', due: daysFwd(10), priority: 'high', status: 'todo', done: false, recurrence: 'none', subtasks: [], createdAt: new Date().toISOString(), completedAt: '' },
      { id: '1005', title: 'Read ML Paper – Attention Is All You Need', desc: 'Understand transformer architecture before the seminar next week.', cat: 'Learning', due: daysFwd(4), priority: 'medium', status: 'todo', done: false, recurrence: 'none', subtasks: [], createdAt: new Date().toISOString(), completedAt: '' },
      { id: '1006', title: 'CN Lab Report – TCP Socket Programming', desc: 'Write observations and code explanation for Lab 6.', cat: 'Academics', due: daysAgo(1), priority: 'medium', status: 'done', done: true, recurrence: 'none', subtasks: [], createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      { id: '1007', title: 'Review DSA Mock Test – Trees & Graphs', desc: 'Go through all wrong answers from yesterday\'s mock on LeetCode.', cat: 'Academics', due: daysAgo(2), priority: 'low', status: 'done', done: true, recurrence: 'none', subtasks: [], createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      { id: '1008', title: 'Register for HackCBS 7.0', desc: 'Team registration deadline. Invite Priya and Rohan.', cat: 'Personal', due: daysFwd(3), priority: 'medium', status: 'todo', done: false, recurrence: 'none', subtasks: [], createdAt: new Date().toISOString(), completedAt: '' },
    ];

    // ── Attendance ────────────────────────────────────────────────
    d.attendance = [
      { id: 'a1', subject: 'Operating Systems', req: 75, records: makeRecords(0.88) },
      { id: 'a2', subject: 'Database Management Systems', req: 75, records: makeRecords(0.92) },
      { id: 'a3', subject: 'Computer Networks', req: 75, records: makeRecords(0.68) }, // risky!
      { id: 'a4', subject: 'Machine Learning', req: 75, records: makeRecords(0.95) },
      { id: 'a5', subject: 'Software Engineering', req: 75, records: makeRecords(0.80) },
    ];

    // ── Notes ─────────────────────────────────────────────────────
    d.notes = [
      { id: 'n1', title: 'OS – Process Scheduling Algorithms', content: '## CPU Scheduling\n\n**FCFS** – First Come First Serve. Non-preemptive. Simple but convoy effect.\n\n**SJF** – Shortest Job First. Optimal avg waiting time. Hard to predict burst time.\n\n**Round Robin** – Each process gets a fixed time quantum (usually 20ms). Best for time-sharing systems.\n\n**Priority Scheduling** – Can lead to starvation. Solved by aging.\n\n> **Key formula**: Avg Waiting Time = (Sum of waiting times) / n', date: new Date().toLocaleDateString(), updatedAt: new Date().toISOString(), tags: ['OS', 'Exam'], subject: 'Operating Systems' },
      { id: 'n2', title: 'DBMS – Normalization Quick Reference', content: '## Normal Forms\n\n- **1NF**: Atomic values, no repeating groups\n- **2NF**: 1NF + No partial dependency on composite key\n- **3NF**: 2NF + No transitive dependency\n- **BCNF**: Every determinant must be a candidate key\n\n**Armstrong\'s Axioms**: Reflexivity, Augmentation, Transitivity\n\n> Tip: For exam, always identify functional dependencies first.', date: new Date().toLocaleDateString(), updatedAt: new Date().toISOString(), tags: ['DBMS', 'Exam'], subject: 'Database Management Systems' },
      { id: 'n3', title: 'ML – Transformer Architecture Notes', content: '## Attention Is All You Need (Vaswani et al., 2017)\n\n### Key Ideas\n- Replaces RNNs/CNNs with pure attention mechanism\n- **Multi-Head Attention**: Attends to information from different subspaces simultaneously\n- **Positional Encoding**: Adds position info since attention is permutation-invariant\n\n### Complexity\n- Self-attention: O(n² · d) — quadratic in sequence length\n- Recurrence: O(n · d²) — linear in sequence length\n\n> Great for parallelization on GPUs!', date: new Date().toLocaleDateString(), updatedAt: new Date().toISOString(), tags: ['ML', 'Research'], subject: 'Machine Learning' },
      { id: 'n4', title: '🎯 Semester Goals', content: '## This Semester\'s Goals\n\n### Academic\n- [ ] Target 8.5+ CGPA\n- [ ] No backlogs\n- [ ] Complete all lab reports on time\n\n### Career\n- [ ] Land a summer internship (Google/MS/startup)\n- [ ] Publish portfolio v2\n- [ ] Solve 150+ LeetCode problems\n\n### Personal\n- [ ] Participate in HackCBS\n- [ ] Read 2 tech books\n- [ ] Improve sleep schedule 😅', date: new Date().toLocaleDateString(), updatedAt: new Date().toISOString(), tags: ['Goals', 'Personal'], subject: '' },
    ];

    // ── GPA ───────────────────────────────────────────────────────
    d.gpa = {
      semesters: [
        {
          id: 'g1', name: 'Sem 1',
          subjects: [
            { id: 's1-1', name: 'Math I', credits: 4, grade: 'B+' },
            { id: 's1-2', name: 'Physics', credits: 4, grade: 'A' },
            { id: 's1-3', name: 'Programming in C', credits: 4, grade: 'B' },
            { id: 's1-4', name: 'Engineering Graphics', credits: 3, grade: 'A' },
            { id: 's1-5', name: 'Communication Skills', credits: 2, grade: 'A+' },
          ]
        },
        {
          id: 'g2', name: 'Sem 2',
          subjects: [
            { id: 's2-1', name: 'Math II', credits: 4, grade: 'A' },
            { id: 's2-2', name: 'Chemistry', credits: 4, grade: 'A' },
            { id: 's2-3', name: 'Data Structures', credits: 4, grade: 'A+' },
            { id: 's2-4', name: 'Basic Electrical', credits: 3, grade: 'B+' },
            { id: 's2-5', name: 'Environmental Science', credits: 2, grade: 'O' },
          ]
        },
        {
          id: 'g3', name: 'Sem 3',
          subjects: [
            { id: 's3-1', name: 'Math III', credits: 4, grade: 'A+' },
            { id: 's3-2', name: 'Object Oriented Prog', credits: 4, grade: 'O' },
            { id: 's3-3', name: 'Digital Logic', credits: 3, grade: 'A' },
            { id: 's3-4', name: 'Computer Architecture', credits: 3, grade: 'B+' },
            { id: 's3-5', name: 'Discrete Math', credits: 3, grade: 'A' },
          ]
        },
        {
          id: 'g4', name: 'Sem 4',
          subjects: [
            { id: 's4-1', name: 'Algorithms', credits: 4, grade: 'O' },
            { id: 's4-2', name: 'Operating Systems', credits: 4, grade: 'A+' },
            { id: 's4-3', name: 'Database Systems', credits: 4, grade: 'A' },
            { id: 's4-4', name: 'Theory of Computation', credits: 3, grade: 'A' },
            { id: 's4-5', name: 'Microprocessors', credits: 3, grade: 'B+' },
          ]
        }
      ],
      targets: { desiredCGPA: '9.0' },
    };

    // ── Timetable ─────────────────────────────────────────────────
    d.timetable = {
      Monday:    [{ id: 't1', subject: 'Operating Systems', time: '9:00 AM', room: 'CS-101' }, { id: 't2', subject: 'Machine Learning', time: '11:00 AM', room: 'CS-204' }, { id: 't3', subject: 'DBMS Lab', time: '2:00 PM', room: 'Lab-3' }],
      Tuesday:   [{ id: 't4', subject: 'Computer Networks', time: '10:00 AM', room: 'CS-102' }, { id: 't5', subject: 'Software Engineering', time: '12:00 PM', room: 'CS-301' }],
      Wednesday: [{ id: 't6', subject: 'Operating Systems', time: '9:00 AM', room: 'CS-101' }, { id: 't7', subject: 'DBMS', time: '11:00 AM', room: 'CS-201' }, { id: 't8', subject: 'ML Lab', time: '2:00 PM', room: 'Lab-2' }],
      Thursday:  [{ id: 't9', subject: 'Computer Networks', time: '10:00 AM', room: 'CS-102' }, { id: 't10', subject: 'Software Engineering', time: '12:00 PM', room: 'CS-301' }, { id: 't11', subject: 'CN Lab', time: '3:00 PM', room: 'Lab-1' }],
      Friday:    [{ id: 't12', subject: 'Machine Learning', time: '9:00 AM', room: 'CS-204' }, { id: 't13', subject: 'DBMS', time: '11:00 AM', room: 'CS-201' }],
    };

    // ── Skills ────────────────────────────────────────────────────
    d.skills = ['React', 'Node.js', 'Python', 'Java', 'SQL', 'Git', 'Docker', 'AWS (Basics)', 'Machine Learning', 'System Design'];

    // ── Projects ──────────────────────────────────────────────────
    d.projects = [
      { id: 'p1', name: 'StudyBuddy AI', desc: 'An AI-powered study planner that generates personalized schedules using GPT-4. Built with React + FastAPI.', tech: 'React, Python, FastAPI, OpenAI', link: 'github.com/aarav-dev/studybuddy', status: 'Completed' },
      { id: 'p2', name: 'Real-Time Code Collab', desc: 'Collaborative code editor with live sync, syntax highlighting, and video chat. Like Google Docs for code.', tech: 'React, Socket.io, Node.js, Monaco Editor', link: 'github.com/aarav-dev/codelab', status: 'In Progress' },
      { id: 'p3', name: 'Campus Connect', desc: 'Campus event and club management app for colleges. 500+ students at BITS use it.', tech: 'React Native, Firebase, Node.js', link: 'github.com/aarav-dev/campus-connect', status: 'Live' },
    ];

    // ── Resume ────────────────────────────────────────────────────
    d.resumeData = {
      basics: { name: 'Aarav Mehta', email: 'aarav.mehta@bits-pilani.ac.in', phone: '+91 98765 43210', summary: 'Final year CS student with experience in full-stack development, ML, and open source. Passionate about building scalable products.', location: 'Pilani, Rajasthan' },
      education: [{ school: 'BITS Pilani', degree: 'B.Tech Computer Science', year: '2022-2026', gpa: '8.56' }],
      experience: [{ company: 'Razorpay', role: 'SDE Intern', duration: 'May 2025 – Jul 2025', desc: 'Built internal dashboard for payment reconciliation. Reduced manual work by 40%.' }],
      skills: ['React', 'Node.js', 'Python', 'Java', 'SQL', 'Git', 'Docker', 'System Design'],
      projects: [
        { name: 'StudyBuddy AI', desc: 'AI study planner · React, FastAPI, OpenAI', link: 'github.com/aarav-dev/studybuddy' },
        { name: 'Campus Connect', desc: 'College event app · React Native, Firebase · 500+ users', link: 'github.com/aarav-dev/campus-connect' },
      ],
    };

    // ── Internships ───────────────────────────────────────────────
    d.internships = [
      { id: 'i1', company: 'Razorpay', role: 'SDE Intern', duration: 'May 2025 – Jul 2025', stipend: '₹60,000/mo', status: 'Completed', notes: 'Worked on payment reconciliation dashboard. Got PPO offer.' },
    ];

    // ── Certs ─────────────────────────────────────────────────────
    d.certs = [
      { id: 'c1', name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024-11', link: '' },
      { id: 'c2', name: 'Deep Learning Specialization', issuer: 'Coursera (deeplearning.ai)', date: '2025-01', link: '' },
    ];

    // ── Recent Activity ───────────────────────────────────────────
    d.recentActivity = [
      { text: 'Completed CN Lab Report', date: new Date().toLocaleDateString(), time: '10:30 AM' },
      { text: 'Added 3 new tasks for this week', date: new Date().toLocaleDateString(), time: '9:00 AM' },
      { text: 'Updated portfolio website', date: daysAgo(1), time: '11:00 PM' },
      { text: 'Marked present for all subjects', date: daysAgo(1), time: '9:15 AM' },
    ];

    // ── Settings ──────────────────────────────────────────────────
    d.settings.onboardingComplete = true;
    d.settings.aiProvider = 'groq';
    d.xp = 340;
    d.level = 4;
  }, 'Loaded demo data');
}

export function getOpenAIApiKey() {
  return localStorage.getItem('studentos_openai_key') || '';
}

export function setOpenAIApiKey(apiKey) {
  localStorage.setItem('studentos_openai_key', String(apiKey || '').trim());
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

// Auto-login listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await initFirebaseUser(user.uid, user);
  }
});


export function mutateDB(updater, activityText = null) {
  if (!db) db = migrateDB(defaultDB);
  if (!Array.isArray(db.recentActivity)) db.recentActivity = [];
  if (!Array.isArray(db.productivity)) db.productivity = [];
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
  db = migrateDB({ ...defaultDB, productivity: [] });
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
    } catch {
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
    if (sem && sem.subjects && Array.isArray(sem.subjects)) {
      sem.subjects.forEach(sub => {
        const gp = GRADE_POINTS[sub.grade] || 0;
        const credits = Number(sub.credits) || 0;
        totalPoints += gp * credits;
        totalCredits += credits;
      });
    }
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

    // Track real productivity
    if (!d.productivity) d.productivity = [];
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = d.productivity.find(p => p.date === today);
    if (todayRecord) {
      todayRecord.count += 1;
    } else {
      d.productivity.push({ date: today, count: 1 });
    }
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

export async function searchWeb(query) {
  try {
    // We use Wikipedia API as a highly reliable free search API for academic topics
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data[1] || data[1].length === 0) {
      // Fallback to DuckDuckGo abstract search proxy
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
      const res2 = await fetch(ddgUrl);
      const data2 = await res2.json();
      return data2.AbstractText || "No search results found.";
    }

    // Fetch summaries for the top Wikipedia results
    const titles = data[1].join('|');
    const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=3&exlimit=3&exintro=1&explaintext=1&titles=${encodeURIComponent(titles)}&format=json&origin=*`;
    const sumRes = await fetch(summaryUrl);
    const sumData = await sumRes.json();
    
    const pages = sumData.query?.pages;
    if (!pages) return "No results.";
    
    let result = "Web Search Results:\n";
    Object.values(pages).forEach(p => {
      result += `- ${p.title}: ${p.extract}\n`;
    });
    return result;
  } catch (err) {
    console.error('Search failed:', err);
    return "Search failed due to network error.";
  }
}

export async function callGrok(messages, systemPrompt = '') {
  const groqKey = getGroqApiKey();
  const openAIKey = getOpenAIApiKey();

  if (!groqKey && !openAIKey) {
    return Promise.reject(new Error("Please connect your Groq or OpenAI API key in Identity & Settings to use AI features."));
  }

  const provider = openAIKey ? 'openai' : 'groq';
  const activeKey = openAIKey || groqKey;
  const activeModel = openAIKey ? 'gpt-4o-mini' : 'llama-3.1-8b-instant';
  const endpoint = openAIKey 
    ? 'https://api.openai.com/v1/chat/completions' 
    : 'https://api.groq.com/openai/v1/chat/completions';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API error');
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

export async function callOpenAI(messages, systemPrompt = '') {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) return "No OpenAI API key set. Add it in Settings or Code Studio to use Codex features.";
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages
      })
    });
    if (!response.ok) throw new Error((await response.json()).error?.message || 'OpenAI API error');
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
  } catch(err) {
    return `Error: ${err.message}`;
  }
}

export async function callAI(messages, systemPrompt = '') {
  const provider = getDB().settings?.aiProvider || 'grok';
  if (provider === 'openai') return callOpenAI(messages, systemPrompt);
  return callGrok(messages, systemPrompt);
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
  return callAI(
    [{ role: 'user', content: text }],
    `Summarize this content for a college student. Purpose: ${purpose}. Use concise bullets and include action items when useful.`
  );
}

export async function aiAnalyze(context, question) {
  const studentContext = buildStudentContext();
  const sysPrompt = `You are StudentOS academic intelligence. Use the student's real profile and records to give specific, practical guidance. Student context: ${JSON.stringify(studentContext)}`;
  const userPrompt = `Question: ${question}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  
  return callAI([{ role: 'user', content: userPrompt }], sysPrompt);
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
