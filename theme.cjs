const fs = require('fs');
let content = fs.readFileSync('./src/index.css', 'utf8');

const newThemes = `
/* ================================
   NEW AI THEMES (ChatGPT, Claude, Gemini)
   ================================ */

:root, [data-theme="chatgpt-style"] {
  /* ChatGPT Dark Mode Style */
  --bg: #212121;
  --surface: #2f2f2f;
  --surface2: #3a3a3a;
  --surface-hover: #40414f;
  
  --text: #ececec;
  --text2: #d1d5db;
  --text3: #9ca3af;
  
  --border: rgba(255, 255, 255, 0.1);
  --border-focus: rgba(255, 255, 255, 0.25);
  
  --violet: #10a37f;
  --violet2: #10a37f;
  --mint: #1a7f64;
  --mint2: #1a7f64;
  
  --amber: #f59e0b;
  --red: #ef4444;
  --glow: rgba(16, 163, 127, 0.2);
  --font-base: 'Inter', system-ui, -apple-system, sans-serif;
  --radius: 8px;
}

[data-theme="claude-style"] {
  /* Claude Light/Parchment Style */
  --bg: #faf9f5;
  --surface: #ffffff;
  --surface2: #f3f1eb;
  --surface-hover: #eae7df;
  
  --text: #2a2825;
  --text2: #524f4a;
  --text3: #7d7971;
  
  --border: rgba(0, 0, 0, 0.08);
  --border-focus: rgba(0, 0, 0, 0.15);
  
  --violet: #d97757;
  --violet2: #d97757;
  --mint: #b85e42;
  --mint2: #b85e42;
  
  --amber: #f59e0b;
  --red: #dc2626;
  --glow: rgba(217, 119, 87, 0.15);
  --radius: 6px;
}

[data-theme="claude-style"] .card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid var(--border);
}

[data-theme="gemini-style"] {
  /* Gemini Light Soft Style */
  --bg: #ffffff;
  --surface: #f0f4f9;
  --surface2: #e8ebf0;
  --surface-hover: #dfe3e8;
  
  --text: #1f1f1f;
  --text2: #444746;
  --text3: #747775;
  
  --border: transparent;
  --border-focus: rgba(0, 0, 0, 0.1);
  
  --violet: #1a73e8;
  --violet2: #1a73e8;
  --mint: #a8c7fa;
  --mint2: #0b57d0;
  
  --amber: #f9ab00;
  --red: #ea4335;
  --glow: rgba(26, 115, 232, 0.2);
  --radius: 24px;
}

[data-theme="gemini-style"] .card {
  border-radius: var(--radius);
  border: none;
  background: var(--surface);
}

[data-theme="gemini-style"] .input, [data-theme="gemini-style"] .btn {
  border-radius: 99px;
}
`;

const startIndex = content.indexOf(':root, [data-theme="cyberpunk-hacker"]');
const endIndex = content.indexOf('/* Layout & Reset */');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newThemes + '\n\n' + content.substring(endIndex);
  
  const lightModeIndex = content.indexOf('[data-theme="light-mode"]');
  if (lightModeIndex !== -1) {
    content = content.substring(0, lightModeIndex);
  }
  
  fs.writeFileSync('./src/index.css', content);
}
