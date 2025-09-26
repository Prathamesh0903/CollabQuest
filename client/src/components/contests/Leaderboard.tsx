import React from 'react';
import io from 'socket.io-client';

type Entry = {
  _id: string;
  userId: { _id: string; displayName: string; avatar?: string | null };
  totalScore: number;
};

type Props = {
  contestId: string;
  apiBase?: string;
  socketUrl?: string;
};

export const Leaderboard: React.FC<Props> = ({ contestId, apiBase, socketUrl }) => {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const socketRef = React.useRef<ReturnType<typeof io> | null>(null);
  const base = React.useMemo(() => {
    if (apiBase) return apiBase.replace(/\/$/, '');
    const server = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace(/\/$/, '');
    return server.endsWith('/api') ? server : `${server}/api`;
  }, [apiBase]);

  const fetchBoard = React.useCallback(async () => {
    const attempt = async (b: string) => {
      const url = `${b}/contests/${contestId}/leaderboard`;
      const res = await fetch(url, { credentials: 'include' });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        // eslint-disable-next-line no-console
        console.error('[Leaderboard] fetch error at', url, res.status, text);
        try {
          const json = JSON.parse(text);
          return { ok: false, json, status: res.status } as const;
        } catch {
          return { ok: false, text, status: res.status } as const;
        }
      }
      if (!ct.includes('application/json')) {
        const text = await res.text();
        // eslint-disable-next-line no-console
        console.error('[Leaderboard] non-JSON at', url, text.slice(0, 120));
        return { ok: false, text, status: res.status } as const;
      }
      const json = await res.json();
      return { ok: true, json, status: res.status } as const;
    };

    try {
      const first = await attempt(base);
      let data: any | null = null;
      if (first.ok) data = first.json;
      else if (
        first.status === 404 &&
        first.json &&
        typeof first.json === 'object' &&
        (first.json.code === 'ROUTE_NOT_FOUND' || first.json.error === 'Route not found')
      ) {
        const altBase = base.endsWith('/api') ? base.replace(/\/api$/, '') : `${base}/api`;
        const second = await attempt(altBase);
        if (second.ok) data = second.json;
        else throw new Error(`Request failed (${second.status}).`);
      } else {
        throw new Error(`Request failed (${first.status}).`);
      }
      setEntries((data && data.leaderboard) || []);
    } catch {
      // Demo fallback entries
      setEntries([
        { _id: 'p1', userId: { _id: 'u1', displayName: 'Demo User 1' }, totalScore: 300 },
        { _id: 'p2', userId: { _id: 'u2', displayName: 'Demo User 2' }, totalScore: 220 },
        { _id: 'p3', userId: { _id: 'u3', displayName: 'Demo User 3' }, totalScore: 180 },
      ]);
    }
  }, [base, contestId]);

  React.useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  React.useEffect(() => {
    const url = socketUrl || window.location.origin;
    const s = io(url);
    socketRef.current = s;
    s.emit('contest:join', contestId);
    s.on('contest:leaderboard:update', fetchBoard);
    return () => {
      s.emit('contest:leave', contestId);
      s.off('contest:leaderboard:update', fetchBoard);
      s.disconnect();
    };
  }, [contestId, fetchBoard, socketUrl]);

  return (
    <div style={{ width: '100%' }}>
      {entries.map((e, idx) => (
        <div key={e._id} className="cq-section cq-row" style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px' }}>
          <div className="cq-rank">{idx + 1}</div>
          <div>{e.userId?.displayName || 'User'}</div>
          <div className="cq-score" style={{ textAlign: 'right' }}>{e.totalScore}</div>
        </div>
      ))}
      {entries.length === 0 && <div className="cq-section cq-muted">No entries yet</div>}
    </div>
  );
};

export default Leaderboard;


