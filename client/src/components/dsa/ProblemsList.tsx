import React, { useEffect, useState } from 'react';
import './dsa.css';
import { API_BASE } from '../../utils/api';

type Category = { _id: string; name: string; slug: string };
export type ProblemListItem = {
  _id: string;
  
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: Category;
  tags?: string[];
  acceptanceRate?: number;
};

type ProblemsResponse = {
  page: number;
  limit: number;
  total: number;
  items: ProblemListItem[];
};

type ProblemsListProps = {
  onSelect?: (problem: ProblemListItem) => void;
};

export default function ProblemsList({ onSelect }: ProblemsListProps) {
  const [data, setData] = useState<ProblemsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('All');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/dsa/problems`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: ProblemsResponse) => {
        if (mounted) setData(json);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (!data) return (
    <div className="dsa-card" style={{ padding: 12 }}>Loading…</div>
  );

  const filtered = (data.items || []).filter((p) => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff = difficulty === 'All' || p.difficulty === difficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div className="dsa-row" style={{ gap: 8 }}>
        <input
          className="dsa-input"
          placeholder="Search by title or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="dsa-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ maxWidth: 160 }}>
          <option>All</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>

      {loading && (
        <div className="dsa-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="dsa-item dsa-card" style={{ opacity: 0.6 }}>
              <div className="dsa-row"><div className="dsa-title" style={{ width: '60%', background: 'rgba(255,255,255,0.06)', height: 16 }} /></div>
              <div className="dsa-meta" style={{ width: '40%', background: 'rgba(255,255,255,0.04)', height: 12 }} />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="dsa-card" style={{ color: '#ff6b6b' }}>Error: {error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="dsa-card">No problems match your filters.</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="dsa-list">
          {filtered.map((p) => (
            <button key={p._id} onClick={() => onSelect?.(p)} className="dsa-item dsa-card">
              <div className="dsa-row">
                <h3 className="dsa-title" style={{ fontSize: 16 }}>{p.title}</h3>
                <span className={`dsa-badge ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
              </div>
              <div className="dsa-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span>{p.category?.name}</span>
                {(p.tags || []).map((tag) => (
                  <span key={tag} className="dsa-chip">{tag}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

