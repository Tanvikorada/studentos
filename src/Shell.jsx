import { lazy, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FileText, CheckSquare, Calculator,
  BarChart3, Calendar, Code, Timer, User, FileCode, Briefcase,
  Award, GitBranch, Globe, Mic, TrendingUp, Settings, ChevronLeft,
  ChevronRight, Search, GraduationCap, Bell, Sparkles, MessageCircle, X
} from 'lucide-react';
import { useDB, calcAttendance, calcCGPA } from './store';

import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/Toast';

const Dashboard = lazy(() => import('./panels/Dashboard'));
const AIChat = lazy(() => import('./panels/AIChat'));
const Notes = lazy(() => import('./panels/Notes'));
const Tasks = lazy(() => import('./panels/Tasks'));
const GPA = lazy(() => import('./panels/GPA'));
const Attendance = lazy(() => import('./panels/Attendance'));
const Timetable = lazy(() => import('./panels/Timetable'));
const CodeStudio = lazy(() => import('./panels/CodeStudio'));
const FocusTimer = lazy(() => import('./panels/FocusTimer'));
const Profile = lazy(() => import('./panels/Profile'));
const Projects = lazy(() => import('./panels/Projects'));
const CareerPredictor = lazy(() => import('./panels/CareerPredictor'));
const CertsSkills = lazy(() => import('./panels/CertsSkills'));
const GitHubTracker = lazy(() => import('./panels/GitHubTracker'));
const ResumeBuilder = lazy(() => import('./panels/misc').then(m => ({ default: m.ResumeBuilder })));
const Portfolio = lazy(() => import('./panels/misc').then(m => ({ default: m.Portfolio })));
const MockInterview = lazy(() => import('./panels/misc').then(m => ({ default: m.MockInterview })));
const MarketTrends = lazy(() => import('./panels/misc').then(m => ({ default: m.MarketTrends })));
const SettingsPanel = lazy(() => import('./panels/misc').then(m => ({ default: m.Settings })));

const NAV = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Academics',
    items: [
      { id: 'chat', label: 'AI Chat', icon: MessageSquare },
      { id: 'notes', label: 'Notes', icon: FileText },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'gpa', label: 'GPA Calc', icon: Calculator },
      { id: 'attendance', label: 'Attendance', icon: BarChart3 },
      { id: 'timetable', label: 'Timetable', icon: Calendar },
      { id: 'code', label: 'Code Studio', icon: Code },
      { id: 'focus', label: 'Focus Timer', icon: Timer },
    ]
  },
  {
    group: 'Career',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'resume', label: 'Resume Builder', icon: FileCode },
      { id: 'projects', label: 'Projects', icon: Briefcase },
      { id: 'internships', label: 'Career', icon: Briefcase },
      { id: 'certs', label: 'Certs & Skills', icon: Award },
      { id: 'github', label: 'GitHub', icon: GitBranch },
      { id: 'portfolio', label: 'Portfolio', icon: Globe },
      { id: 'interview', label: 'Mock Interview', icon: Mic },
      { id: 'trends', label: 'Market Trends', icon: TrendingUp },
    ]
  },
];

const PANEL_LABELS = {};
NAV.forEach(g => g.items.forEach(i => { PANEL_LABELS[i.id] = i.label; }));

const PANELS = {
  dashboard: Dashboard, chat: AIChat, notes: Notes, tasks: Tasks,
  gpa: GPA, attendance: Attendance, timetable: Timetable, code: CodeStudio,
  focus: FocusTimer, profile: Profile, resume: ResumeBuilder, projects: Projects,
  internships: CareerPredictor, certs: CertsSkills, github: GitHubTracker,
  portfolio: Portfolio, interview: MockInterview, trends: MarketTrends,
  settings: SettingsPanel,
};

export default function Shell() {
  const [panel, setPanel] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const db = useDB();

  // Bind theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', db.settings?.theme || 'cyberpunk-hacker');
  }, [db.settings?.theme]);

  // Cmd+K
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const ActivePanel = PANELS[panel] || Dashboard;
  const panelLabel = panel === 'settings' ? 'Settings' : PANEL_LABELS[panel] || 'Dashboard';
  const unreadNotifications = (db.notifications || []).filter(n => !n.read);

  // Calculate live stats
  const semesters = db.gpa?.semesters || [];
  const cgpa = parseFloat(calcCGPA(semesters)) || 0;

  const attRecords = db.attendance || [];
  let totalPresent = 0;
  let totalClasses = 0;
  attRecords.forEach(subj => {
    const { present, total } = calcAttendance(subj.records);
    totalPresent += present;
    totalClasses += total;
  });
  const avgAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;

  return (
    <div className="shell">
      {/* Background Glow Spheres */}
      <div className="bg-glow-sphere bg-glow-sphere-1" />
      <div className="bg-glow-sphere bg-glow-sphere-2" />

      {/* Sidebar */}
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <GraduationCap size={18} />
          </div>
          {!collapsed && <span className="sidebar-title">StudentOS</span>}
          <button className="btn btn-ghost btn-icon" onClick={() => setCollapsed(c => !c)}
            style={{ marginLeft: 'auto', color: 'var(--text3)', flexShrink: 0 }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="sidebar-nav">
          {NAV.map(group => (
            <div key={group.group} className="nav-group">
              <div className="nav-group-label">{group.group}</div>
              {group.items.map(item => (
                <div key={item.id} className={`nav-item ${panel === item.id ? 'active' : ''}`}
                  onClick={() => setPanel(item.id)} title={collapsed ? item.label : ''}>
                  <item.icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className={`nav-item ${panel === 'settings' ? 'active' : ''}`} onClick={() => setPanel('settings')} title="Settings">
            <Settings className="nav-icon" />
            <span className="nav-label">Settings</span>
          </div>
        </div>
      </nav>

      {/* Main & AI Split Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Main Canvas */}
        <div className="main">
          {/* Header */}
          <div className="header">
            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span>{panelLabel}</span>
              
              {/* Dynamic GPA Capsule */}
              {cgpa > 0 && (
                <div className="header-badge info">
                  <Calculator size={12} />
                  <span>{cgpa.toFixed(2)} CGPA</span>
                </div>
              )}

              {/* Dynamic Attendance Capsule */}
              {attRecords.length > 0 && (
                <div className={`header-badge ${avgAttendance < 75 ? 'warning animate-pulse' : 'success'}`}>
                  <BarChart3 size={12} />
                  <span>{avgAttendance}% Attendance</span>
                </div>
              )}

              {/* XP and Level Capsule */}
              <div className="header-badge info" style={{ background: 'var(--violet2)', color: 'white' }}>
                <Award size={12} />
                <span>Lv {db.level || 1} • {db.xp || 0} XP</span>
              </div>
            </div>

            <div className="header-actions">
              {/* Search Bar */}
              <button className="btn btn-secondary btn-sm" onClick={() => setCmdOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text3)' }}>
                <Search size={14} />
                <span>Search</span>
                <kbd style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'var(--surface3)', borderRadius: 4, fontFamily: 'monospace' }}>⌘K</kbd>
              </button>

              {/* AI Copilot Sidebar Toggle */}
              <button
                className={`btn btn-sm ${aiOpen ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAiOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={14} className={aiOpen ? 'animate-spin' : ''} />
                <span>Copilot</span>
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => setNotificationsOpen(o => !o)}
                  title="Notifications"
                  style={{ position: 'relative' }}
                >
                  <Bell size={16} />
                  {unreadNotifications.length > 0 && (
                    <span className="notification-dot">{Math.min(unreadNotifications.length, 9)}</span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="notification-menu">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <strong>Notifications</strong>
                      <span className="text-faint" style={{ fontSize: '0.75rem' }}>{unreadNotifications.length} unread</span>
                    </div>
                    {(db.notifications || []).length === 0 ? (
                      <div className="empty-state" style={{ padding: 18 }}>No alerts yet</div>
                    ) : (
                      (db.notifications || []).slice(0, 6).map(n => (
                        <div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{n.title}</div>
                          <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: 4 }}>{n.body}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div 
                onClick={() => setPanel('profile')}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--violet),var(--mint))', display: 'flex', alignItems: 'center', justifycontent: 'center', display: 'flex', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {db.profile.name?.[0] || 'S'}
              </div>
            </div>
          </div>

          {/* Content Canvas */}
          <div className="content">
            <AnimatePresence mode="wait">
              <motion.div key={panel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}>
                <Suspense fallback={<div className="empty-state">Loading panel...</div>}>
                  <ActivePanel onNavigate={setPanel} onOpenAI={() => setAiOpen(true)} />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Persistent Right AI Assistant Drawer */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="ai-panel"
            >
              <div className="ai-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} className="text-violet" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Study Copilot</span>
                </div>
                <button onClick={() => setAiOpen(false)} className="btn btn-ghost btn-icon" style={{ padding: 4, minWidth: 28, height: 28 }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'hidden', padding: '0 20px 20px' }}>
                <Suspense fallback={<div className="empty-state">Loading copilot...</div>}>
                  <AIChat compact={true} />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={setPanel} />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
