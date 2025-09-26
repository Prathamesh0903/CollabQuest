import React from 'react';
import ContestTimer from './ContestTimer';

type Contest = {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
};

type Props = { apiBase?: string; onSelect?: (contestId: string) => void; filter?: 'all' | 'live' | 'upcoming' | 'ended' };

export const ContestList: React.FC<Props> = ({ apiBase, onSelect, filter = 'all' }) => {
  const [contests, setContests] = React.useState<Contest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const base = React.useMemo(() => {
    if (apiBase) return apiBase.replace(/\/$/, '');
    const server = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace(/\/$/, '');
    return server.endsWith('/api') ? server : `${server}/api`;
  }, [apiBase]);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const attempt = async (b: string) => {
          const url = `${b}/contests?status=all`;
          const res = await fetch(url, { credentials: 'include' });
          const ct = res.headers.get('content-type') || '';
          if (!res.ok) {
            const text = await res.text();
            // eslint-disable-next-line no-console
            console.error('[ContestList] fetch error at', url, res.status, text);
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
            console.error('[ContestList] non-JSON at', url, text.slice(0, 120));
            return { ok: false, text, status: res.status } as const;
          }
          const json = await res.json();
          return { ok: true, json, status: res.status } as const;
        };

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

        const list = (data && data.contests) || [];
        if (!Array.isArray(list) || list.length === 0) {
          throw new Error('Empty list');
        }
        setContests(list);
      } catch (e: any) {
        // Fallback to demo data to keep UI visible without backend
        const now = Date.now();
        const hour = 3600000;
        const demo: Contest[] = [
          {
            _id: 'demo-1',
            title: 'Weekly Contest (Demo) #1',
            description: 'This is a demo contest entry.',
            startTime: new Date(now - hour).toISOString(),
            endTime: new Date(now + 2 * hour).toISOString(),
          },
          {
            _id: 'demo-2',
            title: 'Weekly Contest (Demo) #2',
            description: 'Upcoming demo contest.',
            startTime: new Date(now + hour).toISOString(),
            endTime: new Date(now + 3 * hour).toISOString(),
          },
        ];
        setContests(demo);
        setError(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [base]);

  if (loading) return <div>Loading contests…</div>;

  const now = Date.now();
  const filtered = contests.filter((c) => {
    const start = new Date(c.startTime).getTime();
    const end = new Date(c.endTime).getTime();
    const isLive = now >= start && now <= end;
    const isUpcoming = now < start;
    const isEnded = now > end;
    if (filter === 'live') return isLive;
    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'ended') return isEnded;
    return true;
  });

  return (
    <div className="cq-list">
      {filtered.map((c) => {
        const start = new Date(c.startTime).getTime();
        const end = new Date(c.endTime).getTime();
        const isLive = now >= start && now <= end;
        const isUpcoming = now < start;
        const statusClass = isLive ? 'cq-status cq-status-live' : isUpcoming ? 'cq-status cq-status-upcoming' : 'cq-status cq-status-ended';
        const statusText = isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Ended';
        return (
        <div key={c._id} className="cq-section cq-item">
          <div className="cq-row-between">
            <div>
              <div className="cq-title">{c.title}</div>
              <div className="cq-desc">{c.description}</div>
            </div>
            <div className={statusClass}>{statusText}</div>
          </div>
          <div className="cq-spacer" />
          <div className="cq-row-between">
            <ContestTimer startTime={c.startTime} endTime={c.endTime} />
            {!!onSelect && (
              <div className="cq-actions">
                <button className="cq-btn cq-btn-primary" onClick={() => onSelect(c._id)}>View Leaderboard</button>
              </div>
            )}
          </div>
        </div>
        );
      })}
      {filtered.length === 0 && <div className="cq-section cq-muted">No contests</div>}
    </div>
  );
};

export default ContestList;


