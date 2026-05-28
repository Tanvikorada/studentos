const fs = require('fs');
let code = fs.readFileSync('src/Shell.jsx', 'utf8');

if (!code.includes('const StudyRooms = lazy(')) {
  code = code.replace(
    /const ResumeBuilder = lazy\(\(\) => import\('\.\/panels\/ResumeBuilder'\)\);/,
    "const ResumeBuilder = lazy(() => import('./panels/ResumeBuilder'));\nconst StudyRooms = lazy(() => import('./panels/StudyRooms'));"
  );
}

// We need to add it to the NAV array under the Academics or Overview section.
// Let's add it under Academics, after focus timer.
if (!code.includes("{ id: 'studyrooms', label: 'Study Rooms', icon: Users }")) {
  // First, we need to import Users from lucide-react if it's not imported.
  if (!code.includes('Users,')) {
    code = code.replace(/from 'lucide-react';/, "Users,\n} from 'lucide-react';");
  }
  
  code = code.replace(
    /{ id: 'focus', label: 'Focus Timer', icon: Timer },/,
    "{ id: 'focus', label: 'Focus Timer', icon: Timer },\n      { id: 'studyrooms', label: 'Study Rooms', icon: Users },"
  );
}

// Add it to the render switch inside ActivePanel
if (!code.includes("case 'studyrooms': return <StudyRooms />;")) {
  code = code.replace(
    /case 'focus': return <FocusTimer \/>;/,
    "case 'focus': return <FocusTimer />;\n    case 'studyrooms': return <StudyRooms />;"
  );
}

fs.writeFileSync('src/Shell.jsx', code);
console.log('Shell.jsx patched for Study Rooms');
