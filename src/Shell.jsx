import { lazy, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, GraduationCap, Code,
  Briefcase, GitBranch, User, Settings, ChevronLeft,
  Search, Bell, Sparkles, X, Calendar, Cpu,
} from 'lucide-react';
import { useDB, calcAttendance, calcCGPA } from './store';

import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/Toast';
import StyledText from './components/StyledText';
import VoiceOS from './components/VoiceOS';

const Dashboard = lazy(() => import('./panels/Dashboard'));
const AIChat = lazy(() => import('./panels/AIChat'));
const CodeStudio = lazy(() => import('./panels/CodeStudio'));

const PlannerHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.PlannerHub })));
const AcademicsHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.AcademicsHub })));
const CareerInternshipsHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.CareerInternshipsHub })));
const ProjectsHub = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.ProjectsHub })));
const ProfileSettings = lazy(() => import('./panels/GroupedPanels').then(m => ({ default: m.ProfileSettings })));

// 7-section AI-native OS navigation
const NAV = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'academics', label: 'Academics', icon: GraduationCap },
  { id: 'career', label: 'Career', icon: Briefcase },
  { id: 'chat', label: 'AI Assistant', icon: Sparkles },
  { id: 'planner', label: 'Smart Planner', icon: Calendar },
  { id: 'code', label: 'Code Studio', icon: Code },
  { id: 'projects', label: 'Portfolio', icon: GitBranch },
];

const NAV_FOOTER = [
  { id: 'profile', label: 'Identity & Settings', icon: User },
];

const PANELS = {
  dashboard: Dashboard,
  chat: AIChat,
  planner: PlannerHub,
  academics: AcademicsHub,
  code: CodeStudio,
  career: CareerInternshipsHub,
  projects: ProjectsHub,
  profile: ProfileSettings,
  settings: ProfileSettings,
};

const PANEL_LABELS = {
  dashboard: 'Home',
  chat: 'AI Assistant',
  planner: 'Smart Planner',
  academics: 'Academics',
  code: 'Code Studio',
  career: 'Career',
  projects: 'Portfolio',
  profile: 'Identity & Settings',
  settings: 'Settings',
};

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <Cpu size={28} color="var(--violet)" />
        <span style={{ fontSize: '0.8rem', color: 'var(--text3)', fontWeight: 600 }}>Loading...</span>
      </motion.div>
    </div>
  );
}

export default function Shell() {
  const [panel, setPanel] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handlePanelChange = (p) => { setPanel(p); setMobileDrawerOpen(false); };

  const db = useDB();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', db.settings?.theme || 'chatgpt-style');
  }, [db.settings?.theme]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const ActivePanel = PANELS[panel] || Dashboard;
  const panelLabel = PANEL_LABELS[panel] || 'Home';
  const unreadCount = (db.notifications || []).filter(n => !n.read).length;

  const semesters = db.gpa?.semesters || [];
  const cgpa = parseFloat(calcCGPA(semesters)) || 0;

  // Mobile nav (5 most important)
  const MOBILE_NAV = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'academics', label: 'Academics', icon: GraduationCap },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'chat', label: 'AI', icon: Sparkles },
    { id: 'planner', label: 'Planner', icon: Calendar },
  ];

  const theme = db.settings?.theme || 'chatgpt-style';

  // --- Shared components ---
  const SidebarLogo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Sparkles size={16} color="#fff" />
      </div>
      {!collapsed && (
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', lineHeight: 1 }}>StudentOS</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Academic OS</div>
        </div>
      )}
    </div>
  );

  const MobileDrawer = () => (
    <>
      {mobileDrawerOpen && <div className="mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)} />}
      <div className={`mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <SidebarLogo />
          <button onClick={() => setMobileDrawerOpen(false)} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>
        <div className="mobile-drawer-nav">
          {[...NAV, ...NAV_FOOTER].map(item => (
            <button key={item.id} className={`mobile-drawer-item ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const MobileHeader = () => (
    <header className="mobile-top-header">
      <button className="btn btn-ghost btn-icon" onClick={() => setMobileDrawerOpen(o => !o)}>
        <Search size={20} />
      </button>
      <span style={{ fontSize: '0.95rem', fontWeight: 700, flex: 1 }}>{panelLabel}</span>
      <button className="btn btn-ghost btn-icon" onClick={() => setAiOpen(o => !o)} style={{ position: 'relative' }}>
        <Sparkles size={20} />
      </button>
    </header>
  );

  const MobileBottomNav = () => (
    <nav className="mobile-bottom-nav">
      {MOBILE_NAV.map(item => (
        <button key={item.id} className={`mobile-nav-btn ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  // --- Layout renderers ---
  const renderChatGPTLayout = () => (
    <div className="chatgpt-layout">
      <MobileDrawer />
      <nav className={`cgpt-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="cgpt-sidebar-header">
          <button className="cgpt-new-chat-btn" onClick={() => handlePanelChange('chat')}>
            <SidebarLogo />
          </button>
          <button className="cgpt-collapse-btn" onClick={() => setCollapsed(c => !c)}>
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        <div className="cgpt-nav">
          {NAV.map(item => (
            <div
              key={item.id}
              className={`cgpt-nav-item ${panel === item.id ? 'active' : ''}`}
              onClick={() => handlePanelChange(item.id)}
              title={collapsed ? item.label : ''}
            >
              <item.icon size={16} />
              {!collapsed && <span>{item.label}</span>}
              {item.id === 'chat' && !collapsed && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px',
                  background: 'linear-gradient(135deg, var(--violet), var(--mint))',
                  borderRadius: 10, color: '#fff', fontWeight: 700,
                }}>AI</span>
              )}
            </div>
          ))}
        </div>

        <div className="cgpt-sidebar-footer">
          {NAV_FOOTER.map(item => (
            <div key={item.id} className={`cgpt-nav-item ${panel === item.id || panel === 'settings' ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
              <item.icon size={16} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
          <div className="cgpt-user-item" onClick={() => handlePanelChange('profile')}>
            <div className="cgpt-avatar">{db.profile.name?.[0] || 'S'}</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div className="cgpt-username" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {db.profile.name || 'Student'}
                </div>
                {cgpa > 0 && <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>CGPA {cgpa.toFixed(2)}</div>}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="cgpt-main">
        <MobileHeader />
        <div className="cgpt-content-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={panel}
              className="cgpt-content-inner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Suspense fallback={<LoadingFallback />}>
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
          <div className="claude-logo">
            {!collapsed && <StyledText text="StudentOS" />}
          </div>
          <button className="claude-collapse-btn" onClick={() => setCollapsed(c => !c)}><ChevronLeft size={16} /></button>
        </div>
        <div className="claude-nav-container">
          {[...NAV, ...NAV_FOOTER].map(item => (
            <div key={item.id} className={`claude-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
              <item.icon size={14} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>
        <div className="claude-sidebar-footer">
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
            <Suspense fallback={<LoadingFallback />}>
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
          <button className="gemini-menu-btn" onClick={() => setCollapsed(c => !c)}><ChevronLeft size={20} /></button>
          {!collapsed && <div className="gemini-logo"><StyledText text="StudentOS" /></div>}
        </div>
        <div className="gemini-nav">
          {[...NAV, ...NAV_FOOTER].map(item => (
            <div key={item.id} className={`gemini-nav-item ${panel === item.id ? 'active' : ''}`} onClick={() => handlePanelChange(item.id)}>
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
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
              <Suspense fallback={<LoadingFallback />}>
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

      {/* Persistent AI Copilot Panel */}
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
                <Sparkles size={16} color="var(--violet)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Assistant</span>
              </div>
              <button onClick={() => setAiOpen(false)} className="btn btn-ghost btn-icon"><X size={16} /></button>
            </div>
            <div className="ai-panel-body">
              <Suspense fallback={<LoadingFallback />}>
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
