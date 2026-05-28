/**
 * Applies the iconic StudentOS typography style to any text heading.
 * It highlights a specific, meaningful substring of the text based on predefined rules.
 */
export default function StyledText({ text, highlight, style = {}, className = "" }) {
  if (!text) return null;

  // Pre-defined intelligent highlights for known panel headers
  const highlightMap = {
    'Attendance Tracker': 'Tracker',
    'Career & Placement AI Predictor': 'AI',
    'Focus Timer': 'Timer',
    'GPA Calculator': 'GPA',
    'GitHub Tracker': 'Hub',
    'Internship Tracker': 'Tracker',
    'Projects': 'Pro',
    'Tasks & Schedule': 'Tasks',
    'Weekly Timetable': 'Time',
    'Resume Builder': 'Builder',
    'AI Mock Interviewer': 'AI',
    'Career & Market Trends': 'Trends',
    'System Settings': 'Sys',
    'StudentOS': 'OS',
    'Dashboard': 'Dash',
    'Good morning': 'morning',
    'Good afternoon': 'afternoon',
    'Good evening': 'evening'
  };

  // If a highlight prop is explicitly passed, use it.
  // Otherwise, check our map. If not in the map, default to the last word.
  let targetHighlight = highlight;
  
  if (!targetHighlight) {
    const matchingKey = Object.keys(highlightMap).find(key => text.includes(key));
    if (matchingKey) {
      targetHighlight = highlightMap[matchingKey];
    } else {
      // Default fallback: if it's exactly two words, highlight the second. 
      // If it's more than two, don't highlight anything to avoid awkwardness.
      const words = text.split(' ').filter(Boolean);
      if (words.length === 2) {
        targetHighlight = words[1];
      } else {
        return <span className={`styled-heading ${className}`} style={{ fontWeight: 600, ...style }}>{text}</span>;
      }
    }
  }

  const highlightIndex = text.toLowerCase().indexOf(targetHighlight.toLowerCase());

  if (highlightIndex === -1) {
    return <span className={`styled-heading ${className}`} style={{ ...style }}>{text}</span>;
  }

  const firstPart = text.slice(0, highlightIndex);
  const highlightedPart = text.slice(highlightIndex, highlightIndex + targetHighlight.length);
  const lastPart = text.slice(highlightIndex + targetHighlight.length);

  // If the highlighted word is OS or a known purple keyword, use violet
  const isViolet = ['OS', 'Studio', 'Rooms', 'Hub', 'Trends', 'Prep', 'Settings'].includes(targetHighlight) || (text.split(' ').length === 2 && targetHighlight === text.split(' ')[1]);

  return (
    <span className={`styled-heading ${className}`} style={{ fontWeight: 600, ...style }}>
      {firstPart}
      <span style={{ color: isViolet ? 'var(--violet)' : 'var(--red)', fontWeight: 800 }}>
        {highlightedPart}
      </span>
      {lastPart}
    </span>
  );
}
