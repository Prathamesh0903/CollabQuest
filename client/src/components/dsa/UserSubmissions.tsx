import React, { useEffect, useState } from 'react';
import './dsa.css';
import { API_BASE } from '../../utils/api';

type Submission = {
  _id: string;
  language: string;
  status: string;
  executionTime: number;
  memoryUsage: number;
  score: number;
  submitted_at: string;
};

type Resp = {
  page: number;
  limit: number;
  total: number;
  items: Submission[];
};

type Props = {
  userId: string | null;
};

export default function UserSubmissions({ userId }: Props) {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/dsa/users/${userId}/submissions`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: Resp) => {
        if (mounted) setData(json);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (!userId) return null;
  if (loading) return <div>Loading submissions…</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="dsa-list">
      {data.items.map((s) => (
        <div key={s._id} className="dsa-submission dsa-card">
          <div className="dsa-row">
            <div className="dsa-meta">{new Date(s.submitted_at).toLocaleString()}</div>
            <div className="dsa-badge" style={{ background: 'rgba(255,255,255,.08)' }}>{s.status}</div>
          </div>
          <div className="dsa-meta">{s.language} • {s.executionTime}ms • {s.memoryUsage}MB • score {Math.round(s.score)}</div>
        </div>
      ))}
    </div>
  );
}


