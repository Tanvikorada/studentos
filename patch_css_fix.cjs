const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// Fix select options clash
code = code.replace(
  /select\.input option\s*\{\s*background:\s*#0d0d18;\s*color:\s*var\(--text\);\s*\}/g,
  `select.input option {\n    background: var(--surface);\n    color: var(--text);\n  }`
);

// Fix btn-secondary in light themes
code = code.replace(
  /\.btn-secondary\s*\{\s*background:\s*rgba\(255,\s*255,\s*255,\s*0\.04\);\s*color:\s*var\(--text\);\s*border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.06\);\s*\}/g,
  `.btn-secondary {\n    background: var(--surface2);\n    color: var(--text);\n    border: 1px solid var(--border);\n  }`
);

// Add global chatgpt-style inputs if not already there
if (!code.includes('[data-theme="chatgpt-style"] .btn-secondary')) {
  code += `
[data-theme="chatgpt-style"] .sidebar {
  background: var(--surface2) !important;
}
[data-theme="chatgpt-style"] .input {
  color: var(--text);
}
`;
}

// Fix .input background fallback
code = code.replace(
  /\.input\s*\{\s*[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.01\);/g,
  (match) => match.replace('background: rgba(255, 255, 255, 0.01);', 'background: var(--surface2);')
);

// Fix .input focus fallback
code = code.replace(
  /\.input:focus\s*\{\s*[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\);/g,
  (match) => match.replace('background: rgba(255, 255, 255, 0.05);', 'background: var(--surface3);')
);

// Fix input borders
code = code.replace(
  /border-bottom: 1px solid rgba\(255, 255, 255, 0.08\);/g,
  'border-bottom: 1px solid var(--border);'
);

fs.writeFileSync('src/index.css', code);
console.log('Fixed UI global clashes');
