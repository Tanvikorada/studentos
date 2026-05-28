const fs = require('fs');
let code = fs.readFileSync('src/Shell.jsx', 'utf8');

if (!code.includes('import VoiceOS')) {
  code = code.replace(
    /import StyledText from '.\/components\/StyledText';/,
    "import StyledText from './components/StyledText';\nimport VoiceOS from './components/VoiceOS';"
  );
}

if (!code.includes('<VoiceOS')) {
  code = code.replace(
    /<ToastContainer \/>\s*<\/div>\s*\);\s*}/,
    "<ToastContainer />\n      <VoiceOS onNavigate={setPanel} />\n    </div>\n  );\n}"
  );
}

fs.writeFileSync('src/Shell.jsx', code);
console.log('Shell patched successfully.');
