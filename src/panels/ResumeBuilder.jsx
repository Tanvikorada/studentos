import { useRef, useState } from 'react';
import { useDB, toast } from '../store';
import html2pdf from 'html2pdf.js';
import { Download, FileText, LayoutTemplate, Sparkles } from 'lucide-react';
import StyledText from '../components/StyledText';

export default function ResumeBuilder() {
  const db = useDB();
  const resumeRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('modern');

  const { profile = {}, resumeData = {}, projects = [], certs = [], internships = [] } = db;
  const skills = certs.filter(c => c.type === 'skill');

  const downloadPDF = () => {
    if (!resumeRef.current) return;
    setLoading(true);
    toast.success('Generating PDF...');
    const opt = {
      margin: 10,
      filename: `${profile.name?.replace(/\s+/g, '_') || 'Student'}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(resumeRef.current).save().then(() => {
      setLoading(false);
      toast.success('Resume downloaded!');
    });
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <StyledText text="AI Resume Builder" style={{ fontSize: '2rem', display: 'block' }} />
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>Instantly generate an ATS-friendly PDF from your data.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="input" style={{ width: 150 }} value={template} onChange={e => setTemplate(e.target.value)}>
            <option value="modern">Modern</option>
            <option value="classic">Classic ATS</option>
          </select>
          <button className="btn btn-primary" onClick={downloadPDF} disabled={loading} style={{ minWidth: 160 }}>
            {loading ? <Sparkles size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div style={{ background: '#e5e5e5', padding: '30px', borderRadius: 12, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        {/* The Actual PDF Document Template */}
        <div ref={resumeRef} style={{
          width: '210mm', minHeight: '297mm', background: '#ffffff', color: '#000000',
          padding: '20mm', boxSizing: 'border-box', fontFamily: template === 'classic' ? '"Times New Roman", Times, serif' : '"Inter", "Plus Jakarta Sans", sans-serif',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          {/* Header */}
          <div style={{ borderBottom: `2px solid ${template === 'modern' ? 'var(--violet2)' : '#000'}`, paddingBottom: 16, marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: '24pt', fontWeight: template === 'classic' ? 'bold' : 800, color: template === 'modern' ? 'var(--violet2)' : '#000', textTransform: 'uppercase' }}>
              {profile.name || 'Your Name'}
            </h1>
            <div style={{ fontSize: '11pt', marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#444' }}>
              {resumeData?.basics?.email && <span>📧 {resumeData.basics.email}</span>}
              {resumeData?.basics?.phone && <span>📱 {resumeData.basics.phone}</span>}
              {resumeData?.basics?.location && <span>📍 {resumeData.basics.location}</span>}
              {profile.college && <span>🎓 {profile.college}</span>}
            </div>
            {profile.bio && <p style={{ fontSize: '10pt', marginTop: 12, lineHeight: 1.5, color: '#333' }}>{profile.bio}</p>}
          </div>

          {/* Education */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', color: template === 'modern' ? 'var(--violet2)' : '#000', textTransform: 'uppercase' }}>Education</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{profile.college || 'University Name'}</div>
              <div style={{ fontSize: '10pt', fontStyle: 'italic' }}>{profile.gradYear ? `Expected ${profile.gradYear}` : ''}</div>
            </div>
            <div style={{ fontSize: '11pt', marginTop: 4 }}>{profile.degree || 'Bachelor of Technology'} in {profile.dept || 'Computer Science'}</div>
            {db.gpa?.semesters?.length > 0 && <div style={{ fontSize: '10pt', marginTop: 4, color: '#444' }}>CGPA: {(db.gpa.semesters.reduce((a, b) => a + Number(b.cgpa || 0), 0) / db.gpa.semesters.length).toFixed(2)}</div>}
          </div>

          {/* Experience / Internships */}
          {internships.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', color: template === 'modern' ? 'var(--violet2)' : '#000', textTransform: 'uppercase' }}>Experience</h2>
              {internships.map(int => (
                <div key={int.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{int.company} - {int.role}</div>
                    <div style={{ fontSize: '10pt', fontStyle: 'italic' }}>{int.duration}</div>
                  </div>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '10pt', color: '#333' }}>
                    <li>{int.desc || 'Developed internal tools and optimized performance.'}</li>
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', color: template === 'modern' ? 'var(--violet2)' : '#000', textTransform: 'uppercase' }}>Projects</h2>
              {projects.map(p => (
                <div key={p.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{p.name} {p.repo && <span style={{ fontWeight: 'normal', fontSize: '9pt' }}> | {p.repo}</span>}</div>
                  </div>
                  <div style={{ fontSize: '9pt', color: '#555', fontStyle: 'italic', marginBottom: 4 }}>Tech Stack: {p.tech.join(', ')}</div>
                  <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '10pt', color: '#333' }}>
                    <li>{p.desc}</li>
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '14pt', fontWeight: 'bold', color: template === 'modern' ? 'var(--violet2)' : '#000', textTransform: 'uppercase' }}>Technical Skills</h2>
              <div style={{ fontSize: '10pt', lineHeight: 1.6 }}>
                <strong>Technologies: </strong> {skills.map(s => s.name).join(', ')}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
