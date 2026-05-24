import { useState } from 'react';
import { useDB, mutateDB, toast } from '../store';
import { GitBranch, Search, Star, GitFork, ExternalLink, Activity } from 'lucide-react';

export default function GitHubTracker() {
  const db = useDB();
  const [username, setUsername] = useState(db.github?.username || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(db.github?.trackedData || null);

  const fetchGitHub = async () => {
    if (!username.trim()) { toast.error('Enter a username'); return; }
    setLoading(true);
    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=12`),
      ]);
      if (!userRes.ok) throw new Error('User not found');
      const user = await userRes.json();
      const repos = await reposRes.json();

      const langCounts = {};
      repos.forEach(r => { if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1; });
      const topLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const tracked = { user, repos: repos.slice(0, 8), topLangs, fetchedAt: new Date().toISOString() };
      setData(tracked);
      mutateDB(d => { d.github = { username, trackedData: tracked }; }, `Fetched GitHub: ${username}`);
      toast.success(`Loaded ${repos.length} repos for ${username}`);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch');
    }
    setLoading(false);
  };

  const LANG_COLORS = { JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219', 'C++': '#f34b7d', Rust: '#dea584', Go: '#00ADD8' };

  return (
    <div className="animate-fade">
      <h1 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 24 }}>GitHub Tracker</h1>

      <div className="card mb-6">
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <GitBranch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input className="input" style={{ paddingLeft: 38 }} placeholder="GitHub username..." value={username}
              onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchGitHub()} />
          </div>
          <button className="btn btn-primary" onClick={fetchGitHub} disabled={loading}>
            {loading ? <span className="spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #fff3', borderTopColor: '#fff', borderRadius: '50%' }} /> : <><Search size={16} /> Search</>}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* User info */}
          <div className="card mb-4">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <img src={data.user.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--border2)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{data.user.name || data.user.login}</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: 2 }}>@{data.user.login}</div>
                {data.user.bio && <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginTop: 6 }}>{data.user.bio}</div>}
              </div>
              <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                {[
                  { label: 'Repos', val: data.user.public_repos },
                  { label: 'Followers', val: data.user.followers },
                  { label: 'Following', val: data.user.following },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Instrument Serif, serif', fontStyle: 'italic' }}>{s.val}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-2 mb-4">
            {/* Top Languages */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={16} /> Top Languages</div>
              {data.topLangs.map(([lang, count]) => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: LANG_COLORS[lang] || 'var(--violet2)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>{lang}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{count} repo{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
              {data.topLangs.length === 0 && <div className="empty-state" style={{ padding: 12 }}>No language data</div>}
            </div>

            {/* Profile link */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              <GitBranch size={48} style={{ opacity: 0.3 }} />
              <a href={`https://github.com/${data.user.login}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                <ExternalLink size={14} /> View on GitHub
              </a>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Last fetched: {new Date(data.fetchedAt).toLocaleString()}</div>
            </div>
          </div>

          {/* Repos */}
          <div className="grid-2">
            {data.repos.map(repo => (
              <div key={repo.id} className="card card-glow" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <a href={repo.html_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--violet2)' }}>{repo.name}</a>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: 'var(--text3)' }}>
                    <span><Star size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {repo.stargazers_count}</span>
                    <span><GitFork size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {repo.forks_count}</span>
                  </div>
                </div>
                {repo.description && <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{repo.description}</div>}
                {repo.language && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--text3)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[repo.language] || 'var(--violet2)' }} />
                    {repo.language}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!data && (
        <div className="empty-state">
          <GitBranch size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }} />
          Enter a GitHub username to load profile and repositories
        </div>
      )}
    </div>
  );
}
