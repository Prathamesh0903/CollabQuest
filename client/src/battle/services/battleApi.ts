
const BASE_URL = process.env.REACT_APP_SERVER_URL as string;

export type TokenProvider = () => Promise<string | null> | string | null | undefined;

async function resolveToken(tokenOrGetter?: string | null | TokenProvider): Promise<string | null> {
  if (typeof tokenOrGetter === 'function') {
    const t = (tokenOrGetter as TokenProvider)();
    return t instanceof Promise ? await t : (t as string | null);
  }
  return (tokenOrGetter as string | null) ?? null;
}

async function authorizedFetch(input: RequestInfo, init: RequestInit = {}, token?: string | null) {
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}

export const battleApi = {
  async createBattle(payload: any, tokenOrGetter?: string | TokenProvider | null) {
    const idToken = await resolveToken(tokenOrGetter);
    if (!idToken) throw new Error('Auth token not ready');
    const res = await authorizedFetch(`${BASE_URL}/battle/create`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, idToken);
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create battle');
    return res.json();
  },

  async joinBattle(sessionId: string, tokenOrGetter?: string | TokenProvider | null) {
    const idToken = await resolveToken(tokenOrGetter);
    if (!idToken) throw new Error('Auth token not ready');
    const res = await authorizedFetch(`${BASE_URL}/battle/${sessionId}/join`, { method: 'POST' }, idToken);
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to join battle');
    return res.json();
  },

  async getBattle(sessionId: string, tokenOrGetter?: string | TokenProvider | null) {
    const idToken = await resolveToken(tokenOrGetter);
    if (!idToken) throw new Error('Auth token not ready');
    const res = await authorizedFetch(`${BASE_URL}/battle/${sessionId}`, { method: 'GET' }, idToken);
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to get battle');
    return res.json();
  },

  async leaveBattle(sessionId: string, tokenOrGetter?: string | TokenProvider | null) {
    const idToken = await resolveToken(tokenOrGetter);
    if (!idToken) throw new Error('Auth token not ready');
    const res = await authorizedFetch(`${BASE_URL}/battle/${sessionId}/leave`, { method: 'POST' }, idToken);
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to leave battle');
    return res.json();
  }
};
