const fs = require('fs');

const css = `
/* =========================================================
   DEEP UI CHAT STYLING
   ========================================================= */

/* ---------------------------------------------------------
   ChatGPT Chat Styles
   --------------------------------------------------------- */
.chat-container.chatgpt-style {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.chatgpt-style .chat-bubble.user {
  background: transparent;
  color: #ececec;
  font-weight: 500;
  font-size: 1rem;
  padding: 0;
  text-align: left;
}

.chatgpt-style .chat-bubble.ai {
  background: transparent;
  color: #d1d5db;
  border: none;
  padding: 0;
  font-size: 1rem;
}

.chatgpt-style .chat-ai-header,
.chatgpt-style .chat-user-header {
  justify-content: flex-start !important;
  margin-bottom: 4px;
}

.chatgpt-style .user-name-label,
.chatgpt-style .ai-name-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #ececec;
}

.chatgpt-style .ai-avatar-box {
  width: 24px;
  height: 24px;
  background: #10a37f;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chatgpt-style .chat-input-bar {
  background: #2f2f2f;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 0 15px rgba(0,0,0,0.1);
}

.chatgpt-style .chat-input-bar .input {
  background: transparent;
  border: none;
  color: #ececec;
}

/* ---------------------------------------------------------
   Claude Chat Styles
   --------------------------------------------------------- */
.chat-container.claude-style {
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.claude-style .chat-bubble.user {
  background: #f2efe8;
  color: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  font-family: 'Instrument Serif', serif;
  font-size: 1.15rem;
  text-align: left;
}

.claude-style .chat-bubble.ai {
  background: transparent;
  color: #1a1a1a;
  border: none;
  padding: 16px 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.95rem;
  line-height: 1.6;
}

.claude-style .chat-ai-header {
  margin-bottom: 0;
}

.claude-style .ai-avatar-box {
  width: 28px;
  height: 28px;
  background: #e27d5f;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.claude-style .ai-name-label,
.claude-style .user-name-label {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  color: #444;
}

.claude-style .chat-input-bar {
  background: #ffffff;
  border: 1px solid #e5e1d8;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}

.claude-style .chat-input-bar .input {
  background: transparent;
  border: none;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ---------------------------------------------------------
   Gemini Chat Styles
   --------------------------------------------------------- */
.chat-container.gemini-style {
  max-width: 840px;
  margin: 0 auto;
  width: 100%;
}

.gemini-style .chat-bubble.user {
  background: #f0f4f9;
  color: #1f1f1f;
  border-radius: 24px;
  padding: 12px 20px;
  font-size: 0.95rem;
  box-shadow: none;
}

.gemini-style .chat-bubble.ai {
  background: transparent;
  color: #1f1f1f;
  border: none;
  padding: 12px 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.gemini-style .chat-ai-header {
  margin-bottom: 0;
}

.gemini-style .ai-avatar-box {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1a73e8, #a8c7fa);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gemini-style .ai-name-label,
.gemini-style .user-name-label {
  display: none; /* Gemini usually just shows bubbles or avatars without names */
}

.gemini-style .chat-input-bar {
  background: #ffffff;
  border: 1px solid #e9eef6;
  border-radius: 32px;
  padding: 8px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.gemini-style .chat-input-bar .input {
  background: transparent;
  border: none;
  color: #1f1f1f;
  border-radius: 32px;
}
`;

fs.appendFileSync('src/index.css', '\n' + css, 'utf8');
console.log('Appended chat styles successfully');
