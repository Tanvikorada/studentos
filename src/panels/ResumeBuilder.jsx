import { useRef, useState } from 'react';
import { useDB, calcCGPA, toast } from '../store';
import html2pdf from 'html2pdf.js';
import { Download, Sparkles } from 'lucide-react';
import StyledText from '../components/StyledText';

export function ResumeBuilder() {
  const db = useDB();
  const resumeRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('premium');

  const { profile = {}, resumeData = {}, projects = [], certs = [], internships = [] } = db;
  const skills = certs.filter(c => c.type === 'skill');
  
  // Calculate true CGPA using the centralized store function
  const semesters = db.gpa?.semesters || [];
  const cgpa = calcCGPA(semesters);

  const downloadPDF = () => {
    if (!resumeRef.current) return;
    setLoading(true);
    toast.success('Generating Premium PDF...');
    const opt = {
      margin: 0,
      filename: `${profile.name?.replace(/\s+/g, '_') || 'Student'}_Resume.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(resumeRef.current).save().then(() => {
      setLoading(false);
      toast.success('Resume downloaded successfully!');
    });
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Controls */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16, padding: '24px 32px' }}>
        <div>
          <StyledText text="Premium Resume Builder" style={{ fontSize: '2.2rem', display: 'block', fontWeight: 800, letterSpacing: '-0.02em' }} />
          <p className="text-muted" style={{ fontSize: '0.95rem', marginTop: 6, margin: 0 }}>
            Generate a stunning, ATS-friendly two-column resume instantly from your data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="input" style={{ width: 160, fontWeight: 600 }} value={template} onChange={e => setTemplate(e.target.value)}>
            <option value="premium">Premium Two-Column</option>
            <option value="classic">Classic ATS</option>
          </select>
          <button className="btn btn-primary btn-lg" onClick={downloadPDF} disabled={loading} style={{ minWidth: 180, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            {loading ? <Sparkles size={18} className="animate-spin" /> : <Download size={18} />}
            {loading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* PDF Container Wrapper */}
      <div style={{ background: 'var(--surface2)', padding: '40px', borderRadius: 16, display: 'flex', justifyContent: 'center', overflowX: 'auto', border: '1px solid var(--border)', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.05)' }}>
        
        {/* The Actual PDF Document */}
        <div ref={resumeRef} style={{
          width: '210mm', minHeight: '297mm', background: '#ffffff', color: '#111827',
          boxSizing: 'border-box', fontFamily: template === 'classic' ? '"Times New Roman", Times, serif' : '"Inter", -apple-system, sans-serif',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: template === 'premium' ? 'row' : 'column',
          overflow: 'hidden'
        }}>
          
          {template === 'premium' ? (
            // PREMIUM TWO-COLUMN LAYOUT
            <>
              {/* Left Column - Dark Theme */}
              <div style={{ width: '35%', background: '#111827', color: '#f3f4f6', padding: '12mm 8mm', display: 'flex', flexDirection: 'column', gap: '8mm' }}>
                
                {/* Profile Header */}
                <div>
                  <h1 style={{ margin: '0 0 4px 0', fontSize: '24pt', fontWeight: 800, lineHeight: 1.1, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {profile.name || 'Your Name'}
                  </h1>
                  <div style={{ fontSize: '11pt', color: '#9ca3af', fontWeight: 500, marginBottom: '4mm' }}>
                    {profile.degree || 'Bachelor of Technology'}
                  </div>
                  
                  {/* Contact Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm', fontSize: '9pt', color: '#d1d5db', marginTop: '6mm' }}>
                    {resumeData?.basics?.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✉️ {resumeData.basics.email}</div>}
                    {resumeData?.basics?.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📱 {resumeData.basics.phone}</div>}
                    {resumeData?.basics?.location && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📍 {resumeData.basics.location}</div>}
                    {profile.college && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🎓 {profile.college}</div>}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h2 style={{ fontSize: '12pt', fontWeight: 700, color: '#ffffff', borderBottom: '2px solid #374151', paddingBottom: '2mm', marginBottom: '4mm', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education</h2>
                  <div style={{ marginBottom: '3mm' }}>
                    <div style={{ fontWeight: 700, fontSize: '10pt', color: '#f3f4f6' }}>{profile.college || 'University Name'}</div>
                    <div style={{ fontSize: '9pt', color: '#9ca3af', margin: '2px 0' }}>{profile.degree} in {profile.dept}</div>
                    <div style={{ fontSize: '8.5pt', color: '#6b7280', fontStyle: 'italic' }}>{profile.gradYear ? `Class of ${profile.gradYear}` : ''}</div>
                    {cgpa > 0 && <div style={{ fontSize: '9pt', marginTop: '3px', fontWeight: 600, color: '#10b981' }}>CGPA: {cgpa}</div>}
                  </div>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: '12pt', fontWeight: 700, color: '#ffffff', borderBottom: '2px solid #374151', paddingBottom: '2mm', marginBottom: '4mm', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {skills.map(s => (
                        <span key={s.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '4px', fontSize: '8.5pt', color: '#e5e7eb' }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Light Theme */}
              <div style={{ width: '65%', background: '#ffffff', padding: '12mm', display: 'flex', flexDirection: 'column', gap: '8mm' }}>
                
                {/* Profile Summary */}
                {profile.bio && (
                  <div>
                    <h2 style={{ fontSize: '14pt', fontWeight: 800, color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '2mm', marginBottom: '4mm', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Profile</h2>
                    <p style={{ fontSize: '10pt', lineHeight: 1.6, color: '#4b5563', margin: 0 }}>{profile.bio}</p>
                  </div>
                )}

                {/* Experience */}
                {internships.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: '14pt', fontWeight: 800, color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '2mm', marginBottom: '4mm', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Experience</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6mm' }}>
                      {internships.map(int => (
                        <div key={int.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                            <div style={{ fontWeight: 700, fontSize: '11pt', color: '#111827' }}>{int.company}</div>
                            <div style={{ fontSize: '9pt', color: '#6b7280', fontWeight: 500 }}>{int.duration}</div>
                          </div>
                          <div style={{ fontSize: '10pt', color: '#6366f1', fontWeight: 600, marginBottom: '4px' }}>{int.role}</div>
                          <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '9.5pt', color: '#4b5563', lineHeight: 1.5 }}>
                            <li>{int.desc || 'Contributed to product development and optimized internal systems.'}</li>
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: '14pt', fontWeight: 800, color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '2mm', marginBottom: '4mm', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Projects</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6mm' }}>
                      {projects.map(p => (
                        <div key={p.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                            <div style={{ fontWeight: 700, fontSize: '11pt', color: '#111827' }}>
                              {p.name} {p.repo && <span style={{ fontWeight: 400, fontSize: '8.5pt', color: '#6b7280', marginLeft: '6px' }}>| {p.repo}</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: '8.5pt', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Tech: {p.tech.join(' • ')}</div>
                          <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '9.5pt', color: '#4b5563', lineHeight: 1.5 }}>
                            <li>{p.desc}</li>
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            // CLASSIC ATS LAYOUT
            <div style={{ padding: '20mm', width: '100%' }}>
              {/* Classic Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 16, marginBottom: 16 }}>
                <h1 style={{ margin: 0, fontSize: '24pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {profile.name || 'Your Name'}
                </h1>
                <div style={{ fontSize: '11pt', marginTop: 8, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', color: '#222' }}>
                  {resumeData?.basics?.email && <span>{resumeData.basics.email}</span>}
                  {resumeData?.basics?.email && resumeData?.basics?.phone && <span>|</span>}
                  {resumeData?.basics?.phone && <span>{resumeData.basics.phone}</span>}
                  {resumeData?.basics?.location && <span>|</span>}
                  {resumeData?.basics?.location && <span>{resumeData.basics.location}</span>}
                </div>
              </div>

              {/* Education */}
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc' }}>Education</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{profile.college || 'University Name'}</div>
                  <div style={{ fontSize: '10pt' }}>{profile.gradYear ? `Expected ${profile.gradYear}` : ''}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                  <div style={{ fontSize: '11pt' }}>{profile.degree || 'Bachelor of Technology'} in {profile.dept || 'Computer Science'}</div>
                  {cgpa > 0 && <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>CGPA: {cgpa}</div>}
                </div>
              </div>

              {/* Experience / Internships */}
              {internships.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc' }}>Experience</h2>
                  {internships.map(int => (
                    <div key={int.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{int.company} <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>- {int.role}</span></div>
                        <div style={{ fontSize: '10pt' }}>{int.duration}</div>
                      </div>
                      <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '10pt', color: '#222' }}>
                        <li>{int.desc || 'Developed internal tools and optimized performance.'}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc' }}>Projects</h2>
                  {projects.map(p => (
                    <div key={p.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{p.name} {p.repo && <span style={{ fontWeight: 'normal', fontSize: '9pt' }}> | {p.repo}</span>}</div>
                      </div>
                      <div style={{ fontSize: '9pt', color: '#444', fontStyle: 'italic', marginBottom: 4 }}>Technologies: {p.tech.join(', ')}</div>
                      <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '10pt', color: '#222' }}>
                        <li>{p.desc}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc' }}>Technical Skills</h2>
                  <div style={{ fontSize: '10pt', lineHeight: 1.6 }}>
                    <strong>Technologies: </strong> {skills.map(s => s.name).join(', ')}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
