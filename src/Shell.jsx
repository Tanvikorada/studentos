import { lazy, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FileText, CheckSquare, Calculator,
  BarChart3, Calendar, Code, Timer, User, FileCode, Briefcase,
  Award, GitBranch, Globe, Mic, TrendingUp, Settings, ChevronLeft,
  ChevronRight, Search, GraduationCap, Bell, Sparkles, MessageCircle, X, Users
} from 'lucide-react';
import { useDB, calcAttendance, calcCGPA } from './store';

import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/Toast';
import StyledText from './components/StyledText';
import VoiceOS from './components/VoiceOS';

const Dashboard = lazy(() => import('./panels/Dashboard'));
const AIChat = lazy(() => import('./panels/AIChat'));
const CodeStudio = lazy(() => import('./panels/CodeStudio'));
const StudyRooms = lazy(() => import('./panels/StudyRooms'));

const PlannerHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.PlannerHub })));
const StudySpace = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.StudySpace })));
const AcademicsHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.AcademicsHub })));
const CareerInternshipsHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.CareerInternshipsHub })));
const ProjectsHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.ProjectsHub })));
const InterviewPrep = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.InterviewPrep })));
const ProfileSettings = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.ProfileSettings })));

const NAV = [
  {
    group: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'chat', label: 'AI Chat', icon: MessageSquare },
      { id: 'planner', label: 'Planner', icon: Calendar },
      { id: 'studyspace', label: 'Study Space', icon: FileText },
      { id: 'academics', label: 'Academics', icon: GraduationCap },
      { id: 'code', label: 'Code Studio', icon: Code },
      { id: 'studyrooms', label: 'Study Rooms', icon: Users },
      { id: 'career', label: 'Career & Internships', icon: Briefcase },
      { id: 'projects', label: 'Portfolio & Projects', icon: GitBranch },
      { id: 'interview', label: 'Resume & Interview', icon: Mic },
      { id: 'profile', label: 'Profile & Settings', icon: User },
    ]
  }
];

const PANEL_LABELS = {};
NAV.forEach(g => g.items.forEach(i => { PANEL_LABELS[i.id] = i.label; }));

const PANELS = {
  dashboard: Dashboard,
  chat: AIChat,
  planner: PlannerHub,
  studyspace: StudySpace,
  academics: AcademicsHub,
  code: CodeStudio,
  studyrooms: StudyRooms,
  career: CareerInternshipsHub,
  projects: ProjectsHub,
  interview: InterviewPrep,
  profile: ProfileSettings,
  settings: ProfileSettings,
};

export default function Shell() {
  const [panel, setPanel] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on panel change
  const handlePanelChange = (p) => { setPanel(p); setMobileDrawerOpen(false); };

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
    return () => window.removeEventListener('keydown', h);
  }, []);

  const ActivePanel = PANELS[panel] || Dashboard;
  const panelLabel = panel === 'settings' ? 'Settings' : PANEL_LABELS[panel] || 'Dashboard';
  const unreadNotifications = (db.notifications || []).filter(n => !n.read);

  // Mobile NAV items (first 5 most-used + more button)
  const MOBILE_NAV = NAV.flatMap(g => g.items).slice(0, 4);

  const MobileBottomNav = () => (
    <nav className="mobile-bottom-nav">
      {MOBILE_NAV.map(item => (
        <button key={item.id} className={`mobile-nav-btn ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
      <button className={`mobile-nav-btn ${mobileDrawerOpen ? 'active' : ''}`} onClick={() => setMobileDrawerOpen(o => !o)}>
        <Search size={20} />
        <span>More</span>
      </button>
    </nav>
  );

  const MobileDrawer = () => (
    <>
      {mobileDrawerOpen && <div className="mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)} />}
      <div className={`mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sidebar-logo"><GraduationCap size={14} /></div>
            <StyledText text="StudentOS" style={{ fontSize: '1rem' }} />
          </div>
          <button onClick={() => setMobileDrawerOpen(false)} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>
        <div className="mobile-drawer-nav">
          {NAV.flatMap(g => g.items).map(item => (
            <button key={item.id} className={`mobile-drawer-item ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
          <button className="mobile-drawer-item" onClick={() => handlePanelChange('settings')}><Settings size={16} /><span>Settings</span></button>
          <button className="mobile-drawer-item" onClick={() => handlePanelChange('profile')}>
            <div className="cgpt-avatar" style={{ width: 24, height: 24, fontSize: '0.7rem' }}>{db.profile.name?.[0] || 'S'}</div>
            <span>{db.profile.name || 'Student'}</span>
          </button>
        </div>
      </div>
    </>
  );

  const MobileHeader = () => (
    <header className="mobile-top-header">
      <button className="btn btn-ghost btn-icon" onClick={() => setMobileDrawerOpen(o => !o)}>
        <Search size={20} />
      </button>
      <StyledText text={panelLabel} style={{ fontSize: '1rem', fontWeight: 700, flex: 1 }} />
      <button className="btn btn-ghost btn-icon" onClick={() => setAiOpen(o => !o)}>
        <Sparkles size={20} />
      </button>
    </header>
  );

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

    const theme = db.settings?.theme || 'chatgpt-style';

  const renderChatGPTLayout = () => (
    <div className="chatgpt-layout">
      <MobileDrawer />
      <nav className={`cgpt-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="cgpt-sidebar-header">
          <button className="cgpt-new-chat-btn" onClick={() => handlePanelChange('chat')}>
            <div className="icon-box"><GraduationCap size={16} color="#fff" /></div>
            {!collapsed && <span>New chat</span>}
          </button>
          <button className="cgpt-collapse-btn" onClick={() => setCollapsed(c => !c)}>
            <ChevronLeft size={16} />
          </button>
        </div>
        
        <div className="cgpt-nav">
          {NAV.flatMap(g => g.items).map(item => (
            <div key={item.id} className={`cgpt-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)} title={collapsed ? item.label : ''}>
              <item.icon size={16} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>

        <div className="cgpt-sidebar-footer">
           <div className="cgpt-nav-item" onClick={() => handlePanelChange('settings')}>
             <Settings size={16}/>
             {!collapsed && <span>Settings</span>}
           </div>
           <div className="cgpt-user-item" onClick={() => handlePanelChange('profile')}>
             <div className="cgpt-avatar">{db.profile.name?.[0] || 'S'}</div>
             {!collapsed && <span className="cgpt-username">{db.profile.name || 'Student'}</span>}
           </div>
        </div>
      </nav>
      
      <div className="cgpt-main">
        <MobileHeader />
        
        <div className="cgpt-content-wrapper">
          <AnimatePresence mode="wait">
            <motion.div key={panel} className="cgpt-content-inner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Suspense fallback={<div className="empty-state">Loading...</div>}>
                <ActivePanel onNavigate={handlePanelChange} onOpenAI={() => setAiOpen(true)} activePanel={panel} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
        <MobileBottomNav />
      </div>
    </div>
  );

  const renderClaudeLayout = () => (
    <div className="claude-layout">
      <MobileDrawer />
      <nav className={`claude-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="claude-sidebar-header">
          <div className="claude-logo"><GraduationCap size={16}/> {!collapsed && <StyledText text="StudentOS" />}</div>
          <button className="claude-collapse-btn" onClick={() => setCollapsed(c => !c)}><ChevronLeft size={16}/></button>
        </div>
        <div className="claude-nav-container">
          <div className="claude-nav-btn new-chat" onClick={() => handlePanelChange('chat')}>
            <MessageSquare size={14}/> {!collapsed && <span>New chat</span>}
          </div>
          {NAV.map(group => (
            <div key={group.group} className="claude-nav-group">
              {!collapsed && <div className="claude-group-label">{group.group}</div>}
              {group.items.map(item => (
                <div key={item.id} className={`claude-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
                  <item.icon size={14} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="claude-sidebar-footer">
           <div className="claude-settings-item" onClick={() => handlePanelChange('settings')}><Settings size={14}/> {!collapsed && <span>Settings</span>}</div>
           <div className="claude-user-item" onClick={() => handlePanelChange('profile')}>
             <div className="claude-avatar">{db.profile.name?.[0] || 'S'}</div>
             {!collapsed && <span>{db.profile.name || 'Student'}</span>}
           </div>
        </div>
      </nav>
      <div className="claude-main">
        <MobileHeader />
         <AnimatePresence mode="wait">
            <motion.div key={panel} className="claude-content-inner" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <Suspense fallback={<div className="empty-state">Loading...</div>}>
                <ActivePanel onNavigate={handlePanelChange} onOpenAI={() => setAiOpen(true)} activePanel={panel} />
              </Suspense>
            </motion.div>
         </AnimatePresence>
        <MobileBottomNav />
      </div>
    </div>
  );

  const renderGeminiLayout = () => (
    <div className="gemini-layout">
      <MobileDrawer />
      <nav className={`gemini-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="gemini-sidebar-header">
          <button className="gemini-menu-btn" onClick={() => setCollapsed(c => !c)}><ChevronLeft size={20}/></button>
          {!collapsed && <div className="gemini-logo"><StyledText text="StudentOS" /></div>}
        </div>
        <div className="gemini-nav">
           <button className="gemini-new-chat" onClick={() => handlePanelChange('chat')}>
             <Sparkles size={20}/> {!collapsed && <span>New chat</span>}
           </button>
           {NAV.flatMap(g => g.items).map(item => (
            <div key={item.id} className={`gemini-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </div>
           ))}
        </div>
        <div className="gemini-sidebar-footer">
           <div className="gemini-nav-item" onClick={() => handlePanelChange('settings')}>
              <Settings size={20} />
              {!collapsed && <span>Settings</span>}
           </div>
        </div>
      </nav>
      <div className="gemini-main">
        <MobileHeader />
        <header className="gemini-header">
           <div className="gemini-header-title"><StyledText text={panelLabel} /></div>
           <div className="gemini-header-actions">
             {cgpa > 0 && <span className="gemini-badge">{cgpa.toFixed(2)} CGPA</span>}
             <div className="gemini-avatar" onClick={() => handlePanelChange('profile')}>{db.profile.name?.[0] || 'S'}</div>
           </div>
        </header>
        <div className="gemini-content-inner">
           <AnimatePresence mode="wait">
              <motion.div key={panel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<div className="empty-state">Loading...</div>}>
                  <ActivePanel onNavigate={handlePanelChange} onOpenAI={() => setAiOpen(true)} activePanel={panel} />
                </Suspense>
              </motion.div>
           </AnimatePresence>
        </div>
        <MobileBottomNav />
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
      <VoiceOS onNavigate={setPanel} />
    </div>
  );
}
