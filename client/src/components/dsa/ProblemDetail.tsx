import React, { useEffect, useState } from 'react';
import './dsa.css';
import { API_BASE } from '../../utils/api';

type Category = { _id: string; name: string; slug: string };
type Problem = {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: Category;
  testCases?: { input: string; expectedOutput: string; isHidden?: boolean; description?: string }[];
};

type Props = {
  problemId: string | null;
};

export default function ProblemDetail({ problemId }: Props) {
  const [data, setData] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'statement' | 'examples' | 'constraints'>('statement');

  useEffect(() => {
    if (!problemId) return;
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/dsa/problems/${problemId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: Problem) => {
        if (mounted) setData(json);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [problemId]);

  if (!problemId) return <div>Select a problem</div>;
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="dsa-card" style={{ display: 'grid', gap: 12 }}>
      <h2 className="dsa-title">{data.title}</h2>
      <div className="dsa-meta">{data.category?.name} • {data.difficulty}</div>

      <div className="dsa-tabs" style={{ display: 'flex', gap: 8 }}>
        {(['statement','examples','constraints'] as const).map((tab) => (
          <button
            key={tab}
            className={`dsa-chip ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'statement' && (
        <div>{data.description}</div>
      )}

      {activeTab === 'examples' && data.testCases && data.testCases.length > 0 && (
        <div>
          <h4 className="dsa-subtitle">Examples</h4>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.testCases
              .filter((t) => !t.isHidden)
              .map((t, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  <div>
                    <strong>Input:</strong> <code>{t.input}</code>
                  </div>
                  <div>
                    <strong>Output:</strong> <code>{t.expectedOutput}</code>
                  </div>
                  {t.description && <div className="dsa-meta">{t.description}</div>}
                </li>
              ))}
          </ul>
        </div>
      )}

      {activeTab === 'constraints' && (
        <div className="dsa-meta">See examples and problem statement for constraints.</div>
      )}
    </div>
  );
}


