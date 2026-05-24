import React from 'react';

/**
 * Applies the iconic StudentOS typography style to any text heading.
 * It automatically extracts 1-3 letters from the middle of the word and highlights them.
 */
export default function StyledText({ text, style = {}, className = "" }) {
  if (!text) return null;

  // Split into words to handle multi-word headers
  const words = text.split(' ');

  return (
    <span className={`styled-heading ${className}`} style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', ...style }}>
      {words.map((word, index) => {
        if (word.length <= 3) {
          return <span key={index}>{word} </span>;
        }

        // Highlight a chunk in the middle of the word
        const startIdx = Math.floor(word.length / 3);
        const endIdx = startIdx + Math.min(2, Math.ceil(word.length / 3));

        const firstPart = word.slice(0, startIdx);
        const highlightPart = word.slice(startIdx, endIdx);
        const lastPart = word.slice(endIdx);

        return (
          <span key={index} style={{ marginRight: index < words.length - 1 ? '8px' : '0' }}>
            {firstPart}
            <span style={{ color: 'var(--red)', fontWeight: 700, fontStyle: 'normal' }}>
              {highlightPart}
            </span>
            {lastPart}
          </span>
        );
      })}
    </span>
  );
}
