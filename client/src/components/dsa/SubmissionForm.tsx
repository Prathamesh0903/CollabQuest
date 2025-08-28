import React, { useState } from 'react';
import './dsa.css';
import { API_BASE } from '../../utils/api';

type Props = {
  userId: string;
  problemId: string | null;
  onSubmitted?: (submissionId: string) => void;
};

export default function SubmissionForm({ userId, problemId, onSubmitted }: Props) {
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const disabled = !problemId || !userId || loading;

  const submit = async () => {
    if (!problemId) {
      setError('Please select a problem first.');
      return;
    }
    if (!code || code.trim().length < 3) {
      setError('Please enter a longer solution before submitting.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/dsa/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, problem_id: problemId, code, language })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setSuccess('Submitted');
      onSubmitted?.(json._id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dsa-card" style={{ display: 'grid', gap: 8 }}>
      <div className="dsa-controls">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={disabled} className="dsa-select">
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="typescript">TypeScript</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="c">C</option>
        </select>
        <button onClick={submit} disabled={disabled} className="dsa-button">Submit</button>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your solution here..."
        rows={10}
        className="dsa-textarea"
      />
      {error && <div className="dsa-error">{error}</div>}
      {success && <div className="dsa-success">{success}</div>}
    </div>
  );
}


