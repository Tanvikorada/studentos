const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// Replace backgrounds
code = code.replace(/background:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\s*\);/g, 'background: var(--surface2);');

// Replace borders
code = code.replace(/border:\s*1px\s*solid\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\s*\);/g, 'border: 1px solid var(--border);');
code = code.replace(/border-([a-z]+):\s*1px\s*solid\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\s*\);/g, 'border-$1: 1px solid var(--border);');
code = code.replace(/border-color:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\s*\);/g, 'border-color: var(--border2);');

fs.writeFileSync('src/index.css', code);
console.log('Fixed hardcoded rgba whites');
