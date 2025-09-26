import React from 'react';

export function useUserRole(apiBase?: string) {
  const [role, setRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const base = apiBase || (process.env.REACT_APP_API_URL || 'http://localhost:5001');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${base}/api/auth/me`, { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (!cancelled) setRole(data?.user?.role || null);
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [base]);

  return { role, loading } as const;
}


