import React from 'react';

type ContestPayload = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  problems: { problemId: string; problemType: 'dsa' | 'quiz' | 'custom'; points?: number }[];
  visibility?: 'public' | 'private';
  maxParticipants?: number;
};

type Props = { apiBase?: string };

export const AdminContestPanel: React.FC<Props> = ({ apiBase = '/api' }) => {
  const [payload, setPayload] = React.useState<ContestPayload>({
    title: '',
    description: '',
    startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    problems: [],
    visibility: 'public',
  });
  const [creating, setCreating] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const createContest = async () => {
    // Demo no-op creation to keep UI functional without backend
    setCreating(true);
    setMessage(null);
    setTimeout(() => {
      setCreating(false);
      setMessage('Contest created (demo)');
    }, 600);
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input placeholder="Title" value={payload.title} onChange={(e) => setPayload({ ...payload, title: e.target.value })} />
      <textarea placeholder="Description" value={payload.description} onChange={(e) => setPayload({ ...payload, description: e.target.value })} />
      <label>Start</label>
      <input type="datetime-local" value={payload.startTime.slice(0, 16)} onChange={(e) => setPayload({ ...payload, startTime: new Date(e.target.value).toISOString() })} />
      <label>End</label>
      <input type="datetime-local" value={payload.endTime.slice(0, 16)} onChange={(e) => setPayload({ ...payload, endTime: new Date(e.target.value).toISOString() })} />
      <button disabled={creating} onClick={createContest}>{creating ? 'Creating…' : 'Create contest'}</button>
      {message && <div>{message}</div>}
    </div>
  );
};

export default AdminContestPanel;


