const fs = require('fs');
let code = fs.readFileSync('src/panels/CareerPredictor.jsx', 'utf8');

const oldFunc = `  const runGapAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = \`Analyze user profile: GPA \${radarData.datasets[0].data[0].toFixed(1)}/10, Projects \${radarData.datasets[0].data[1]}, Skills \${radarData.datasets[0].data[2]}, Internships \${radarData.datasets[0].data[3]}, Certifications \${radarData.datasets[0].data[4]}. Provide a concise, harsh but actionable gap analysis for getting a FAANG software engineering job. Give 3 bullet points on what to improve.\`;
      const text = await callGroq([{ role: 'user', content: prompt }]);
      setGapAnalysis(text);
      toast.success('Gap Analysis Complete!');
    } catch (e) {
      console.error(e);
      toast.error('Gap analysis failed');
    } finally {
      setLoading(false);
    }
  };`;

const newFunc = `  const runGapAnalysis = async () => {
    setLoading(true);
    try {
      const skillsList = db.certs?.filter(c => c.type === 'skill').map(c => c.name).join(', ') || 'None';
      const prompt = \`Analyze user profile: GPA \${radarData.datasets[0].data[0].toFixed(1)}/10, Projects \${radarData.datasets[0].data[1]}, Skills: \${skillsList}, Internships \${radarData.datasets[0].data[3]}, Certifications \${radarData.datasets[0].data[4]}.
      
Output ONLY a JSON object with this exact structure:
{
  "matches": ["Top Industry Match 1", "Match 2", "Match 3"],
  "gaps": ["Critical missing skill 1", "Gap 2", "Gap 3"],
  "steps": ["Recommended step 1", "Step 2", "Step 3"]
}\`;
      const text = await callGroq([{ role: 'user', content: prompt }]);
      const jsonStr = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      setGapAnalysis(parsed);
      toast.success('Gap Analysis Complete!');
    } catch (e) {
      console.error(e);
      toast.error('Gap analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(oldFunc, newFunc);

// Also need to update the UI where gapAnalysis is displayed
// Currently it's a string, so we need to render the JSON object
// Let's find where it's rendered. It's likely `{gapAnalysis && <div className="card">...{gapAnalysis}</div>}`
const uiOld = `        <div className="card card-glow" style={{ background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>AI Gap Analysis</div>
            <button className="btn btn-primary" onClick={runGapAnalysis} disabled={loading} style={{ background: 'var(--red)', color: '#fff' }}>
              {loading ? 'Analyzing...' : 'Run FAANG Audit'}
            </button>
          </div>
          {gapAnalysis ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem', color: 'var(--text2)' }}>
              {gapAnalysis}
            </div>
          ) : (
            <div className="empty-state">Click run to analyze your missing skills.</div>
          )}
        </div>`;

const uiNew = `        <div className="card card-glow" style={{ background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>AI Career Predictor</div>
            <button className="btn btn-primary" onClick={runGapAnalysis} disabled={loading} style={{ background: 'var(--violet2)', color: '#fff' }}>
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
          {gapAnalysis && typeof gapAnalysis === 'object' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ color: 'var(--mint)', marginBottom: 8 }}>🎯 Top Matches</h4>
                <ul style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: '0.9rem' }}>
                  {gapAnalysis.matches.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
              <div>
                <h4 style={{ color: 'var(--red)', marginBottom: 8 }}>⚠️ Skill Gaps</h4>
                <ul style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: '0.9rem' }}>
                  {gapAnalysis.gaps.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
              <div>
                <h4 style={{ color: 'var(--violet2)', marginBottom: 8 }}>🚀 Next Steps</h4>
                <ul style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: '0.9rem' }}>
                  {gapAnalysis.steps.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="empty-state">Click run to predict your career matches and find missing skills.</div>
          )}
        </div>`;

code = code.replace(uiOld, uiNew);

fs.writeFileSync('src/panels/CareerPredictor.jsx', code);
console.log('CareerPredictor updated');
