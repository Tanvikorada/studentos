import React from 'react';

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
      // Default: highlight the last word if it's long enough, else the first word
      const words = text.split(' ');
      targetHighlight = words[words.length - 1];
    }
  }

  // Helper to split the text around the target highlight
  const highlightIndex = text.toLowerCase().indexOf(targetHighlight.toLowerCase());

  if (highlightIndex === -1) {
    return <span className={`styled-heading ${className}`} style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', ...style }}>{text}</span>;
  }

  const firstPart = text.slice(0, highlightIndex);
  const highlightedPart = text.slice(highlightIndex, highlightIndex + targetHighlight.length);
  const lastPart = text.slice(highlightIndex + targetHighlight.length);

  return (
    <span className={`styled-heading ${className}`} style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', ...style }}>
      {firstPart}
      <span style={{ color: 'var(--red)', fontWeight: 700, fontStyle: 'normal' }}>
        {highlightedPart}
      </span>
      {lastPart}
    </span>
  );
}
