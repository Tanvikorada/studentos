const fs = require('fs');

const css = `
/* =========================================================
   DEEP UI REPLICATION CSS
   ========================================================= */

.shell-wrapper {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
}

/* ---------------------------------------------------------
   ChatGPT Layout
   --------------------------------------------------------- */
.chatgpt-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background: #212121; /* Main content bg */
}

.cgpt-sidebar {
  width: 260px;
  background: #171717;
  color: #ececec;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.cgpt-sidebar.collapsed {
  width: 0;
}

.cgpt-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.cgpt-new-chat-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  color: #fff;
  border: none;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
}

.cgpt-new-chat-btn .icon-box {
  background: #fff;
  border-radius: 50%;
  padding: 4px;
  color: #171717;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cgpt-collapse-btn {
  background: transparent;
  border: none;
  color: #b4b4b4;
  cursor: pointer;
}

.cgpt-collapse-btn:hover {
  color: #fff;
}

.cgpt-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cgpt-nav-label {
  font-size: 0.75rem;
  color: #b4b4b4;
  font-weight: 500;
  margin: 12px 8px 4px 8px;
}

.cgpt-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #ececec;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.cgpt-nav-item:hover {
  background: #212121;
}

.cgpt-nav-item.active {
  background: #212121;
  font-weight: 500;
}

.cgpt-sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cgpt-user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.cgpt-user-item:hover {
  background: #212121;
}

.cgpt-avatar {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: #10a37f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
}

.cgpt-username {
  font-size: 0.875rem;
  font-weight: 600;
}

.cgpt-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.cgpt-mobile-header {
  display: none;
}

.cgpt-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  padding: 20px;
}

.cgpt-content-inner {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* ---------------------------------------------------------
   Claude Layout
   --------------------------------------------------------- */
.claude-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background: #ffffff;
  color: #1a1a1a;
  font-family: 'Instrument Serif', serif;
}

.claude-sidebar {
  width: 280px;
  background: #f2efe8;
  border-right: 1px solid #e5e1d8;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.claude-sidebar.collapsed {
  width: 0;
  border-right: none;
}

.claude-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.claude-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1rem;
  color: #444;
}

.claude-collapse-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
}

.claude-nav-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.claude-nav-btn.new-chat {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e5e1d8;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  transition: background 0.2s;
}

.claude-nav-btn.new-chat:hover {
  background: #faf9f6;
}

.claude-group-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.claude-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #444;
  margin-bottom: 2px;
}

.claude-nav-item:hover {
  background: rgba(0,0,0,0.04);
}

.claude-nav-item.active {
  background: rgba(0,0,0,0.06);
  font-weight: 600;
  color: #1a1a1a;
}

.claude-sidebar-footer {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid #e5e1d8;
}

.claude-user-item, .claude-settings-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
  color: #444;
  cursor: pointer;
  padding: 6px 0;
}

.claude-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #e27d5f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.claude-main {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  padding: 40px;
}

.claude-content-inner {
  width: 100%;
  max-width: 760px;
}

/* ---------------------------------------------------------
   Gemini Layout
   --------------------------------------------------------- */
.gemini-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background: #f8f9fa; /* Google light gray */
  color: #202124;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.gemini-sidebar {
  width: 280px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  padding: 12px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.gemini-sidebar.collapsed {
  width: 72px;
}

.gemini-sidebar-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  margin-bottom: 24px;
}

.gemini-menu-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #5f6368;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
}

.gemini-menu-btn:hover {
  background: rgba(0,0,0,0.05);
}

.gemini-logo {
  font-size: 1.125rem;
  font-weight: 500;
  color: #5f6368;
}

.gemini-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gemini-new-chat {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #e9eef6;
  border: none;
  border-radius: 24px;
  padding: 14px 18px;
  cursor: pointer;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 16px;
  align-self: flex-start;
  transition: box-shadow 0.2s;
}

.gemini-new-chat:hover {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.gemini-nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  border-radius: 24px;
  cursor: pointer;
  color: #444746;
  font-size: 0.875rem;
  font-weight: 500;
}

.gemini-nav-item:hover {
  background: #f0f4f9;
}

.gemini-nav-item.active {
  background: #e9eef6;
  color: #0b57d0;
}

.gemini-sidebar-footer {
  padding-bottom: 12px;
}

.gemini-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  margin-top: 12px;
  margin-right: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.gemini-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.gemini-header-title {
  font-size: 1.125rem;
  font-weight: 500;
}

.gemini-header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.gemini-badge {
  background: #e9eef6;
  color: #0b57d0;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
}

.gemini-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0b57d0;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  cursor: pointer;
}

.gemini-content-inner {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
}

.gemini-content-inner > div {
  width: 100%;
  max-width: 840px;
}

/* AI Overlay */
.ai-panel-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
}
`;

fs.appendFileSync('src/index.css', '\n' + css, 'utf8');
console.log('Appended CSS successfully');
