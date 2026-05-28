const fs = require('fs');
let code = fs.readFileSync('src/store.js', 'utf8');

// Add searchWeb function before callGroq
const searchFunc = `
export async function searchWeb(query) {
  try {
    // We use Wikipedia API as a highly reliable free search API for academic topics
    const url = \`https://en.wikipedia.org/w/api.php?action=opensearch&search=\${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*\`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data[1] || data[1].length === 0) {
      // Fallback to DuckDuckGo abstract search proxy
      const ddgUrl = \`https://api.duckduckgo.com/?q=\${encodeURIComponent(query)}&format=json\`;
      const res2 = await fetch(ddgUrl);
      const data2 = await res2.json();
      return data2.AbstractText || "No search results found.";
    }

    // Fetch summaries for the top Wikipedia results
    const titles = data[1].join('|');
    const summaryUrl = \`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=3&exlimit=3&exintro=1&explaintext=1&titles=\${encodeURIComponent(titles)}&format=json&origin=*\`;
    const sumRes = await fetch(summaryUrl);
    const sumData = await sumRes.json();
    
    const pages = sumData.query?.pages;
    if (!pages) return "No results.";
    
    let result = "Web Search Results:\\n";
    Object.values(pages).forEach(p => {
      result += \`- \${p.title}: \${p.extract}\\n\`;
    });
    return result;
  } catch (err) {
    console.error('Search failed:', err);
    return "Search failed due to network error.";
  }
}
`;

if (!code.includes('export async function searchWeb')) {
  code = code.replace(
    /export async function callGroq\(/,
    searchFunc + '\nexport async function callGroq('
  );
  fs.writeFileSync('src/store.js', code);
  console.log('Added searchWeb to store.js');
}

let aiChat = fs.readFileSync('src/panels/AIChat.jsx', 'utf8');

// Modify AIChat to use the Web Agent
// If the user types a command starting with /search or the AI is prompted to search,
// We will intercept it.
if (!aiChat.includes('searchWeb')) {
  aiChat = aiChat.replace(
    /import \{ useDB, mutateDB, callGroq, buildStudentContext, toast \} from '\.\.\/store';/,
    "import { useDB, mutateDB, callGroq, buildStudentContext, toast, searchWeb } from '../store';"
  );
  
  const originalSend = `
    const reply = await callGroq(newMessages.map(m => ({ role: m.role, content: m.content })), systemPrompt);
    const aiMsg = { role: 'assistant', content: reply };
    const finalMessages = [...newMessages, aiMsg];
    setMessages(finalMessages);
    saveThreads(thread, finalMessages);
    setLoading(false);
  };`;

  const newSend = `
    let finalPrompt = systemPrompt;
    let messagesForAi = newMessages.map(m => ({ role: m.role, content: m.content }));
    
    // Autonomous Web Agent Interceptor
    if (msg.toLowerCase().includes('search') || msg.toLowerCase().includes('find internships')) {
       toast.info('Autonomous Agent is searching the web...');
       const searchResults = await searchWeb(msg);
       messagesForAi.push({ role: 'system', content: \`Autonomous Agent Web Results: \${searchResults}\` });
    }

    const reply = await callGroq(messagesForAi, finalPrompt);
    const aiMsg = { role: 'assistant', content: reply };
    const finalMessages = [...newMessages, aiMsg];
    setMessages(finalMessages);
    saveThreads(thread, finalMessages);
    setLoading(false);
  };`;

  aiChat = aiChat.replace(originalSend, newSend);
  fs.writeFileSync('src/panels/AIChat.jsx', aiChat);
  console.log('Added Autonomous Agent to AIChat.jsx');
}
