const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/api/discuss';

export type Thread = {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  repliesCount: number;
  createdAt: string;
};

export type Reply = {
  _id: string;
  threadId: string;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
};

export async function listThreads(params: { q?: string; tags?: string[]; sort?: 'new'|'top'; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.tags?.length) query.set('tags', params.tags.join(','));
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const res = await fetch(`${API_URL}/threads?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch threads');
  return res.json() as Promise<{ items: Thread[]; total: number; page: number; pageSize: number; hasMore: boolean }>;
}

export async function createThread(input: { title: string; content: string; tags: string[] }) {
  const res = await fetch(`${API_URL}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-guest': 'true' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Failed to create thread');
  return res.json() as Promise<Thread>;
}

export async function getThread(id: string) {
  const res = await fetch(`${API_URL}/threads/${id}`);
  if (!res.ok) throw new Error('Thread not found');
  return res.json() as Promise<Thread>;
}

export async function voteThread(id: string, value: 1 | -1) {
  const res = await fetch(`${API_URL}/threads/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });
  if (!res.ok) throw new Error('Failed to vote');
  return res.json() as Promise<{ upvotes: number; downvotes: number }>;
}

export async function listReplies(threadId: string, params: { page?: number; limit?: number; sort?: 'new'|'top' } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sort) query.set('sort', params.sort);
  const res = await fetch(`${API_URL}/threads/${threadId}/replies?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch replies');
  return res.json() as Promise<{ items: Reply[]; total: number; page: number; pageSize: number; hasMore: boolean }>;
}

export async function createReply(threadId: string, input: { content: string; parentReplyId?: string | null }) {
  const res = await fetch(`${API_URL}/threads/${threadId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-guest': 'true' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Failed to create reply');
  return res.json() as Promise<Reply>;
}

export async function voteReply(replyId: string, value: 1 | -1) {
  const res = await fetch(`${API_URL}/replies/${replyId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });
  if (!res.ok) throw new Error('Failed to vote');
  return res.json() as Promise<{ upvotes: number; downvotes: number }>;
}

// New function to get discussion statistics (similar to DSA progress)
export async function getDiscussionStats() {
  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch discussion statistics');
  return res.json() as Promise<{
    success: boolean;
    stats: {
      threads: {
        totalThreads: number;
        totalUpvotes: number;
        totalDownvotes: number;
        avgRepliesPerThread: number;
        mostActiveThread: number;
      };
      replies: {
        totalReplies: number;
        totalReplyUpvotes: number;
        totalReplyDownvotes: number;
      };
      popularTags: Array<{ _id: string; count: number }>;
      recentActivity: Array<{
        _id: string;
        title: string;
        createdAt: string;
        repliesCount: number;
      }>;
    };
  }>;
}


