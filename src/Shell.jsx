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
import StyledText from './components/StyledText';

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
    document.documentElement.setAttribute('data-theme', db.settings?.theme || 'chatgpt-style');
  }, [db.settings?.theme]);

  // Cmd+K
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener('keydown', h);
    
  const theme = db.settings?.theme || 'chatgpt-style';

  const renderChatGPTLayout = () => (
    <div className="chatgpt-layout">
      <nav className={`cgpt-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="cgpt-sidebar-header">
          <button className="cgpt-new-chat-btn" onClick={() => setPanel('chat')}>
            <div className="icon-box"><GraduationCap size={16} color="#fff" /></div>
            {!collapsed && <span>New chat</span>}
          </button>
          <button className="cgpt-collapse-btn" onClick={() => setCollapsed(c => !c)}>
            <ChevronLeft size={16} />
          </button>
        </div>
        
        <div className="cgpt-nav">
          {NAV.flatMap(g => g.items).map(item => (
            <div key={item.id} className={`cgpt-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => setPanel(item.id)} title={collapsed ? item.label : ''}>
              <item.icon size={16} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>

        <div className="cgpt-sidebar-footer">
           <div className="cgpt-nav-item" onClick={() => setPanel('settings')}>
             <Settings size={16}/>
             {!collapsed && <span>Settings</span>}
           </div>
           <div className="cgpt-user-item" onClick={() => setPanel('profile')}>
             <div className="cgpt-avatar">{db.profile.name?.[0] || 'S'}</div>
             {!collapsed && <span className="cgpt-username">{db.profile.name || 'Student'}</span>}
           </div>
        </div>
      </nav>
      
      <div className="cgpt-main">
        <div className="cgpt-mobile-header">
           <button onClick={() => setCollapsed(c => !c)}><ChevronRight size={20}/></button>
           <span>{panelLabel}</span>
        </div>
        
        <div className="cgpt-content-wrapper">
          <AnimatePresence mode="wait">
            <motion.div key={panel} className="cgpt-content-inner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Suspense fallback={<div className="empty-state">Loading...</div>}>
                <ActivePanel onNavigate={setPanel} onOpenAI={() => setAiOpen(true)} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderClaudeLayout = () => (
    <div className="claude-layout">
      <nav className={`claude-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="claude-sidebar-header">
          <div className="claude-logo"><GraduationCap size={16}/> {!collapsed && <span>StudentOS</span>}</div>
          <button className="claude-collapse-btn" onClick={() => setCollapsed(c => !c)}><ChevronLeft size={16}/></button>
        </div>
        <div className="claude-nav-container">
          <div className="claude-nav-btn new-chat" onClick={() => setPanel('chat')}>
            <MessageSquare size={14}/> {!collapsed && <span>New chat</span>}
          </div>
          {NAV.map(group => (
            <div key={group.group} className="claude-nav-group">
              {!collapsed && <div className="claude-group-label">{group.group}</div>}
              {group.items.map(item => (
                <div key={item.id} className={`claude-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => setPanel(item.id)}>
                  <item.icon size={14} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="claude-sidebar-footer">
           <div className="claude-settings-item" onClick={() => setPanel('settings')}><Settings size={14}/> {!collapsed && <span>Settings</span>}</div>
           <div className="claude-user-item" onClick={() => setPanel('profile')}>
             <div className="claude-avatar">{db.profile.name?.[0] || 'S'}</div>
             {!collapsed && <span>{db.profile.name || 'Student'}</span>}
           </div>
        </div>
      </nav>
      <div className="claude-main">
         <AnimatePresence mode="wait">
            <motion.div key={panel} className="claude-content-inner" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <Suspense fallback={<div className="empty-state">Loading...</div>}>
                <ActivePanel onNavigate={setPanel} onOpenAI={() => setAiOpen(true)} />
              </Suspense>
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );

  const renderGeminiLayout = () => (
    <div className="gemini-layout">
      <nav className={`gemini-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="gemini-sidebar-header">
          <button className="gemini-menu-btn" onClick={() => setCollapsed(c => !c)}><ChevronLeft size={20}/></button>
          {!collapsed && <span className="gemini-logo">StudentOS</span>}
        </div>
        <div className="gemini-nav">
           <button className="gemini-new-chat" onClick={() => setPanel('chat')}>
             <Sparkles size={20}/> {!collapsed && <span>New chat</span>}
           </button>
           {NAV.flatMap(g => g.items).map(item => (
            <div key={item.id} className={`gemini-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => setPanel(item.id)}>
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </div>
           ))}
        </div>
        <div className="gemini-sidebar-footer">
           <div className="gemini-nav-item" onClick={() => setPanel('settings')}>
              <Settings size={20} />
              {!collapsed && <span>Settings</span>}
           </div>
        </div>
      </nav>
      <div className="gemini-main">
        <header className="gemini-header">
           <div className="gemini-header-title">{panelLabel}</div>
           <div className="gemini-header-actions">
             {cgpa > 0 && <span className="gemini-badge">{cgpa.toFixed(2)} CGPA</span>}
             <div className="gemini-avatar" onClick={() => setPanel('profile')}>{db.profile.name?.[0] || 'S'}</div>
           </div>
        </header>
        <div className="gemini-content-inner">
           <AnimatePresence mode="wait">
              <motion.div key={panel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<div className="empty-state">Loading...</div>}>
                  <ActivePanel onNavigate={setPanel} onOpenAI={() => setAiOpen(true)} />
                </Suspense>
              </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="shell-wrapper">
      {theme === 'chatgpt-style' ? renderChatGPTLayout() : theme === 'claude-style' ? renderClaudeLayout() : renderGeminiLayout()}
      
      {/* Persistent Copilot */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="ai-panel-overlay"
          >
            <div className="ai-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} />
                <span style={{ fontWeight: 700 }}>Copilot</span>
              </div>
              <button onClick={() => setAiOpen(false)} className="btn btn-ghost btn-icon" style={{color: 'var(--text)'}}><X size={16} /></button>
            </div>
            <div className="ai-panel-body">
               <Suspense fallback={<div className="empty-state">Loading copilot...</div>}>
                  <AIChat compact={true} />
               </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={setPanel} />
      <ToastContainer />
    </div>
  );

}
