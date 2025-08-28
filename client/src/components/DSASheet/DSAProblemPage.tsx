import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../../utils/api';
import './DSASheet.css';
import Editor from '@monaco-editor/react';

type TestCase = { input: string; expectedOutput: string; isHidden?: boolean; description?: string };
type Problem = {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: { _id: string; name: string; slug: string };
  tags?: string[];
  testCases?: TestCase[];
};

type Submission = {
  _id: string;
  language: string;
  status: string;
  executionTime: number;
  memoryUsage: number;
  score: number;
  submitted_at: string;
};

const DSAProblemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dsaUserId, setDsaUserId] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState<boolean>(false);
  const pollRef = useRef<number | null>(null);

  const canSubmit = useMemo(() => Boolean(id && dsaUserId && code.trim().length >= 3), [id, dsaUserId, code]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/dsa/problems/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) setProblem(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
    return () => { mounted = false; };
  }, [id]);

  const refreshSubmissions = async (uid: string) => {
    if (!uid || !id) return;
    try {
      setLoadingSubs(true);
      const res = await fetch(`${API_BASE}/dsa/users/${uid}/submissions?problem_id=${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSubmissions(Array.isArray(json.items) ? json.items : []);
    } catch (e) {
      // swallow for now
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitMsg(null);
    if (!canSubmit) {
      setSubmitMsg('Select user, enter code (≥3 chars)');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/dsa/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: dsaUserId, problem_id: id, code, language })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      setSubmitMsg('Submitted successfully');
      refreshSubmissions(dsaUserId);
      // Start a lightweight poll to update status if it changes server-side
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(() => refreshSubmissions(dsaUserId), 2000);
      window.setTimeout(() => { if (pollRef.current) window.clearInterval(pollRef.current); }, 15000);
    } catch (e: any) {
      setSubmitMsg(e.message);
    }
  };

  return (
    <div className="dsa-sheet">
      <header className="dsa-header">
        <h1>Problem</h1>
        <p style={{ color: 'rgba(255,255,255,.7)' }}>Solve and submit your solution</p>
      </header>

      {loading && <div className="loading">Loading…</div>}
      {error && <div className="loading">{error}</div>}

      {problem && (
        <div className="topics-list">
          <div className="topic">
            <div className="topic-header">
              <div>
                <h3>{problem.title}</h3>
                <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,.7)' }}>{problem.description}</p>
              </div>
              <span className={`difficulty ${String(problem.difficulty).toLowerCase()}`}>{problem.difficulty}</span>
            </div>

            {/* 2-column layout: left problem; right editor/results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px' }}>
              <div>
                {Array.isArray(problem.testCases) && problem.testCases.some(t => !t.isHidden) && (
                  <div className="problem-card" style={{ marginBottom: '1rem' }}>
                    <strong>Examples</strong>
                    <ul style={{ margin: '0.5rem 0 0 1.25rem' }}>
                      {problem.testCases!.filter(t => !t.isHidden).map((t, i) => (
                        <li key={i} style={{ marginBottom: '0.5rem' }}>
                          <div><strong>Input:</strong> <code>{t.input}</code></div>
                          <div><strong>Output:</strong> <code>{t.expectedOutput}</code></div>
                          {t.description && <div style={{ color: 'rgba(255,255,255,.7)' }}>{t.description}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div className="problem-card" style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input className="difficulty-filter" value={dsaUserId} onChange={(e) => setDsaUserId(e.target.value)} placeholder="Paste a DSA user _id" />
                    <select className="difficulty-filter" value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="typescript">TypeScript</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="c">C</option>
                    </select>
                    <button className="action-button" onClick={handleSubmit} disabled={!canSubmit}>Submit</button>
                  </div>
                  <div style={{ height: 360 }}>
                    <Editor
                      height="100%"
                      defaultLanguage={language === 'cpp' ? 'cpp' : language === 'javascript' || language === 'typescript' ? 'javascript' : language}
                      language={language === 'cpp' ? 'cpp' : language === 'javascript' || language === 'typescript' ? 'javascript' : language}
                      theme="vs-dark"
                      value={code}
                      onChange={(v) => setCode(v || '')}
                      options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
                    />
                  </div>
                  {submitMsg && <div style={{ fontSize: '0.95rem' }}>{submitMsg}</div>}
                </div>

                <div className="problem-card">
                  <div className="topic-header"><h3>Your Submissions</h3></div>
                  {!dsaUserId && <div className="loading">Enter your DSA user id to see history</div>}
                  {dsaUserId && (
                    <>
                      <button className="action-button" onClick={() => refreshSubmissions(dsaUserId)} disabled={loadingSubs}>
                        {loadingSubs ? 'Loading…' : 'Refresh'}
                      </button>
                      {submissions.length === 0 && !loadingSubs && <div className="loading">No submissions yet.</div>}
                      {submissions.map(s => (
                        <div key={s._id} className="problem-card" style={{ marginTop: '0.5rem' }}>
                          <div className="problem-main" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="problem-title" style={{ cursor: 'default' }}>{s.language}</div>
                            <div className={`difficulty ${s.status === 'accepted' ? 'easy' : 'medium'}`}>{s.status}</div>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.95rem' }}>
                            {new Date(s.submitted_at).toLocaleString()} • {s.executionTime}ms • {s.memoryUsage}MB • score {Math.round(s.score)}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DSAProblemPage;


