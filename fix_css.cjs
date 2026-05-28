const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const additionalStyles = `
/* Theme Variables for deep layouts */
[data-theme="claude-style"] {
  --bg: #ffffff;
  --surface: #f2efe8;
  --surface2: #ffffff;
  --surface3: #e5e1d8;
  --border: #e5e1d8;
  --border2: #d9d4c7;
  --text: #1a1a1a;
  --text2: #444444;
  --text3: #666666;
  --violet: #d97757;
  --violet2: #c46042;
  --mint: #8c7e6c;
}

[data-theme="gemini-style"] {
  --bg: #f8f9fa;
  --surface: #ffffff;
  --surface2: #f0f4f9;
  --surface3: #e9eef6;
  --border: #e9eef6;
  --border2: #d3e3fd;
  --text: #1f1f1f;
  --text2: #444746;
  --text3: #5f6368;
  --violet: #0b57d0;
  --violet2: #0842a0;
  --mint: #1a73e8;
}

/* Gemini sidebar scroll fix */
.gemini-sidebar {
  overflow-y: auto !important;
}

/* Chat text visibility fix */
.claude-style .chat-bubble.user {
  color: #1a1a1a !important;
  background: #f2efe8 !important;
}

.claude-style .chat-bubble.ai {
  color: #1a1a1a !important;
}

.gemini-style .chat-bubble.user {
  color: #1f1f1f !important;
  background: #f0f4f9 !important;
}

.gemini-style .chat-bubble.ai {
  color: #1f1f1f !important;
}
`;

fs.appendFileSync('src/index.css', '\n' + additionalStyles, 'utf8');
console.log('Appended additional styles.');
