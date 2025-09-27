import React from 'react';
import { useNavigate } from 'react-router-dom';
import { listThreads, voteThread, Thread } from '../../services/discuss';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import Navbar from '../Dashboard/Navbar';
import './discuss.css';

// Utility function for better date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const PAGE_SIZE = 10;

const DiscussList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [tags, setTags] = React.useState<string>('');
  const [sort, setSort] = React.useState<'new'|'top'>('new');
  const loaderRef = React.useRef<HTMLDivElement | null>(null);

  const fetchThreads = React.useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await listThreads({ 
        q, 
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [], 
        sort, 
        page: reset ? 1 : page, 
        limit: PAGE_SIZE 
      });
      setThreads(prev => reset ? res.items : [...prev, ...res.items]);
      setHasMore(res.hasMore);
      if (reset) setPage(1);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load discussions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [q, tags, sort, page, loading]);

  React.useEffect(() => { fetchThreads(true); }, [q, tags, sort]);

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    setPage(p => p + 1);
  };

  React.useEffect(() => {
    if (page > 1) fetchThreads(false);
  }, [page]);

  React.useEffect(() => {
    if (!loaderRef.current) return;
    const el = loaderRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) handleLoadMore(); });
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loaderRef.current, hasMore, loading]);

  const upvote = async (id: string, val: 1|-1) => {
    try {
      const res = await voteThread(id, val);
      setThreads(ts => ts.map(t => t._id === id ? { ...t, upvotes: res.upvotes, downvotes: res.downvotes } : t));
    } catch (e) {
      console.error('Error voting on thread:', e);
      toast.error('Failed to vote. Please try again.');
    }
  };

  return (
    <div className="discuss-page">
      <Navbar />
      <div className="discuss-hero">
        <div className="discuss-hero-content">
          <h1>Community Discussions</h1>
          <p>Share ideas, ask questions, and collaborate with fellow developers</p>
        </div>
      </div>
      <div className="discuss-container">
        <div className="discuss-header">
          <h2>Latest Discussions</h2>
          <div className="header-actions">
            <button className="secondary" onClick={() => navigate('/')}>← Dashboard</button>
            <button className="primary" onClick={() => navigate('/discuss/new')}>
              <span style={{marginRight: '8px'}}>💬</span>
              New Thread
            </button>
          </div>
        </div>
        <div className="discuss-filters">
          <input placeholder="🔍 Search discussions..." value={q} onChange={e => setQ(e.target.value)} />
          <input placeholder="🏷️ Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
          <div style={{display:'flex', gap:8}}>
            <button className="secondary" style={{opacity: sort==='new'?1:.5}} onClick={() => setSort('new')}>📅 Newest</button>
            <button className="secondary" style={{opacity: sort==='top'?1:.5}} onClick={() => setSort('top')}>🔥 Top</button>
          </div>
        </div>
      <div className="thread-list">
        {loading && threads.length === 0 && Array.from({length: 4}).map((_,i) => <div key={i} className="dq-skeleton" />)}
        {!loading && threads.length === 0 && <div className="dq-empty">No discussions yet. Be the first to start one!</div>}
        {threads.map(t => (
          <div key={t._id} className="thread-card" onClick={() => navigate(`/discuss/${t._id}`)}>
            <h3>{t.title}</h3>
            <div className="thread-meta">
              <span title={formatFullDate(t.createdAt)}>🕒 {formatDate(t.createdAt)}</span>
              <span>💬 {t.repliesCount} replies</span>
              <span style={{display:'inline-flex', gap:6}}>
                {t.tags.slice(0,4).map(tag => <span key={tag} className="dq-chip">#{tag}</span>)}
              </span>
            </div>
            <div className="thread-excerpt">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.content.length > 240 ? t.content.slice(0, 240) + '…' : t.content}</ReactMarkdown>
            </div>
            <div className="thread-actions" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => upvote(t._id, 1)}>👍 {t.upvotes}</button>
              <button onClick={() => upvote(t._id, -1)}>👎 {t.downvotes}</button>
            </div>
          </div>
        ))}
        </div>
        <div ref={loaderRef} style={{height: 1}} />
      </div>
    </div>
  );
};

export default DiscussList;


