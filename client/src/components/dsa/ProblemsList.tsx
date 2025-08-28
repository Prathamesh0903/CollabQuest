import React, { useEffect, useState } from 'react';
import './dsa.css';
import { API_BASE } from '../../utils/api';

type Category = { _id: string; name: string; slug: string };
type ProblemListItem = {
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

type Props = {
  onSelect?: (problem: ProblemListItem) => void;
};

export default function ProblemsList({ onSelect }: Props) {
  const [data, setData] = useState<ProblemsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div>Loading problems…</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="dsa-list">
      {data.items.map((p) => (
        <button key={p._id} onClick={() => onSelect?.(p)} className="dsa-item dsa-card">
          <div className="dsa-row">
            <h3 className="dsa-title" style={{ fontSize: 16 }}>{p.title}</h3>
            <span className={`dsa-badge ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
          </div>
          <div className="dsa-meta">
            {p.category?.name} {p.tags?.length ? `• ${p.tags.join(', ')}` : ''}
          </div>
        </button>
      ))}
    </div>
  );
}


