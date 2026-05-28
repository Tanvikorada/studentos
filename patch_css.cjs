const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// Add ChatGPT/Claude style
const chatgptStyle = `
/* CHATGPT / CLAUDE STYLE: Premium, minimalist, pure */
[data-theme="chatgpt-style"] {
  --bg:          #212121;
  --bg-gradient: none;
  --surface:     #212121;
  --surface2:    #171717; /* Sidebar */
  --surface3:    #2f2f2f;
  --border:      rgba(255, 255, 255, 0.1);
  --border2:     rgba(255, 255, 255, 0.15);
  --violet:      #ececec;
  --violet2:     #ffffff;
  --mint:        #10a37f;
  --mint2:       #1a7f64;
  --amber:       #d4d4d4;
  --red:         #ef4444;
  --text:        #ececec;
  --text2:       #b4b4b4;
  --text3:       #8e8e8e;
  --sidebar-w:   260px;
  --sidebar-c:   0px;
  --header-h:    60px;
  --radius:      12px;
  --radius-sm:   8px;
  --radius-lg:   16px;
  --shadow:      0 0 15px rgba(0,0,0,0.1);
  --glow:        none;
}

[data-theme="chatgpt-style"] body {
  background: var(--bg);
}

[data-theme="chatgpt-style"] .sidebar {
  background: var(--surface2);
  border-right: none;
}

[data-theme="chatgpt-style"] .main-content {
  background: var(--bg);
}

[data-theme="chatgpt-style"] .card {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: none;
}

[data-theme="chatgpt-style"] .btn-primary {
  background: var(--text);
  color: #171717;
  border: none;
  font-weight: 500;
  border-radius: var(--radius-sm);
}

[data-theme="chatgpt-style"] .btn-primary:hover {
  background: #ffffff;
}

[data-theme="chatgpt-style"] .bg-glow-sphere { display: none; }
[data-theme="chatgpt-style"] .card-glow { box-shadow: none; }
[data-theme="chatgpt-style"] .nav-item.active { background: rgba(255,255,255,0.1); border-left: none; border-radius: var(--radius-sm); }
`;

if (!code.includes('data-theme="chatgpt-style"')) {
  code = code + '\n' + chatgptStyle;
  fs.writeFileSync('src/index.css', code);
  console.log('Appended chatgpt-style');
} else {
  console.log('chatgpt-style already exists');
}
