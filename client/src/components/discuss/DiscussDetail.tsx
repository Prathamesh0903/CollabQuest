import React from 'react';
import { useParams } from 'react-router-dom';
import { getThread, listReplies, createReply, voteReply, voteThread, Thread, Reply } from '../../services/discuss';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

const socketUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/discuss';

const DiscussDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = React.useState<Thread | null>(null);
  const [replies, setReplies] = React.useState<Reply[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [content, setContent] = React.useState('');
  const socketRef = React.useRef<Socket | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const t = await getThread(id);
        setThread(t);
        const res = await listReplies(id, { page: 1, limit: 20 });
        setReplies(res.items);
        setHasMore(res.hasMore);
      } catch (error) {
        console.error('Error loading thread:', error);
        // Handle error appropriately - could show error message to user
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    const socket = io(socketUrl, { query: { threadId: id }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('discuss:reply:new', (payload: { threadId: string; reply: Reply }) => {
      if (payload.threadId === id) {
        setReplies(prev => [payload.reply, ...prev]);
        setThread(prev => prev ? { ...prev, repliesCount: prev.repliesCount + 1 } : prev);
      }
    });
    return () => { socket.disconnect(); };
  }, [id]);

  const loadMore = async () => {
    if (!id || !hasMore || loading) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await listReplies(id, { page: next, limit: 20 });
      setReplies(prev => [...prev, ...res.items]);
      setPage(next);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error('Error loading more replies:', error);
      // Handle error appropriately
    } finally { 
      setLoading(false); 
    }
  };

  const submitReply = async () => {
    if (!id || !content.trim()) return;
    const created = await createReply(id, { content });
    setContent('');
    setReplies(prev => [created, ...prev]);
    setThread(prev => prev ? { ...prev, repliesCount: prev.repliesCount + 1 } : prev);
  };

  const voteThreadAction = async (value: 1 | -1) => {
    if (!thread) return;
    const res = await voteThread(thread._id, value);
    setThread({ ...thread, upvotes: res.upvotes, downvotes: res.downvotes });
  };

  const voteReplyAction = async (rid: string, value: 1 | -1) => {
    const res = await voteReply(rid, value);
    setReplies(prev => prev.map(r => r._id === rid ? { ...r, upvotes: res.upvotes, downvotes: res.downvotes } : r));
  };

  if (!thread) return null;

  return (
    <div className="discuss-detail">
      <Navbar />
      <div className="discuss-container">
        <div className="discuss-header">
          <h2>Discussion Thread</h2>
          <div className="header-actions">
            <button className="secondary" onClick={() => window.history.back()}>← Back</button>
            <button className="secondary" onClick={() => (window.location.href = '/discuss')}>All Discussions</button>
            <button className="secondary" onClick={() => (window.location.href = '/')}>Dashboard</button>
          </div>
        </div>
      <div className="thread">
        <h2>{thread.title}</h2>
        <div className="thread-meta">
          <span title={formatFullDate(thread.createdAt)}>🕒 Posted {formatDate(thread.createdAt)}</span>
          <span>💬 {thread.repliesCount} replies</span>
          <span style={{display:'inline-flex', gap:6}}>
            {thread.tags.map(tag => <span key={tag} className="dq-chip">#{tag}</span>)}
          </span>
        </div>
        <div className="thread-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.content}</ReactMarkdown>
        </div>
        <div className="thread-actions">
          <button onClick={() => voteThreadAction(1)}>👍 {thread.upvotes}</button>
          <button onClick={() => voteThreadAction(-1)}>👎 {thread.downvotes}</button>
        </div>
      </div>

      <div className="reply-editor">
        <div className="editor">
          <div className="editor-toolbar">
            <span style={{fontWeight: 600, color: 'var(--dq-text)'}}>💬 Write a Reply</span>
            <button onClick={() => setShowPreview(p => !p)}>{showPreview ? '✏️ Edit' : '👁️ Preview'}</button>
          </div>
          {showPreview ? (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || 'Nothing to preview'}</ReactMarkdown>
            </div>
          ) : (
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a reply (Markdown supported)" />
          )}
        </div>
        <div style={{marginTop:8, textAlign: 'right'}}>
          <button className="primary" onClick={submitReply}>
            <span style={{marginRight: '8px'}}>📝</span>
            Post Reply
          </button>
        </div>
      </div>

      <div className="replies">
        {replies.map(r => (
          <div key={r._id} className="reply">
            <div className="reply-meta">
              <span title={formatFullDate(r.createdAt)}>🕒 Replied {formatDate(r.createdAt)}</span>
            </div>
            <div className="reply-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.content}</ReactMarkdown>
            </div>
            <div className="reply-actions">
              <button onClick={() => voteReplyAction(r._id, 1)}>👍 {r.upvotes}</button>
              <button onClick={() => voteReplyAction(r._id, -1)}>👎 {r.downvotes}</button>
            </div>
          </div>
        ))}
      </div>
        {hasMore && (
          <div className="load-more">
            <button disabled={loading} onClick={loadMore}>
              {loading ? '⏳ Loading…' : '📄 Load More Replies'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussDetail;


