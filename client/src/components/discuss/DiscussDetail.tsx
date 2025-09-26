import React from 'react';
import { useParams } from 'react-router-dom';
import { getThread, listReplies, createReply, voteReply, voteThread, Thread, Reply } from '../../services/discuss';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './discuss.css';

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
      const t = await getThread(id);
      setThread(t);
      const res = await listReplies(id, { page: 1, limit: 20 });
      setReplies(res.items);
      setHasMore(res.hasMore);
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
    } finally { setLoading(false); }
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
      <div className="discuss-header" style={{marginBottom:12}}>
        <div style={{display:'inline-flex', gap:8}}>
          <button className="secondary" onClick={() => window.history.back()}>← Back</button>
          <button className="secondary" onClick={() => (window.location.href = '/')}>Dashboard</button>
        </div>
      </div>
      <div className="thread">
        <h2>{thread.title}</h2>
        <div className="thread-meta">
          <span>{new Date(thread.createdAt).toLocaleString()}</span>
          <span>• {thread.tags.join(', ')}</span>
        </div>
        <div className="thread-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.content}</ReactMarkdown>
        </div>
        <div className="thread-actions">
          <button onClick={() => voteThreadAction(1)}>▲ {thread.upvotes}</button>
          <button onClick={() => voteThreadAction(-1)}>▼ {thread.downvotes}</button>
        </div>
      </div>

      <div className="reply-editor">
        <div className="editor">
          <div className="editor-toolbar">
            <div className="bar">
              <button onClick={() => setShowPreview(p => !p)}>{showPreview ? 'Edit' : 'Preview'}</button>
            </div>
          </div>
          {showPreview ? (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || 'Nothing to preview'}</ReactMarkdown>
            </div>
          ) : (
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a reply (Markdown supported)" />
          )}
        </div>
        <div style={{marginTop:8}}>
          <button className="primary" onClick={submitReply}>Reply</button>
        </div>
      </div>

      <div className="replies">
        {replies.map(r => (
          <div key={r._id} className="reply">
            <div className="reply-meta">
              <span>{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <div className="reply-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.content}</ReactMarkdown>
            </div>
            <div className="reply-actions">
              <button onClick={() => voteReplyAction(r._id, 1)}>▲ {r.upvotes}</button>
              <button onClick={() => voteReplyAction(r._id, -1)}>▼ {r.downvotes}</button>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="load-more">
          <button disabled={loading} onClick={loadMore}>{loading ? 'Loading…' : 'Load more'}</button>
        </div>
      )}
    </div>
  );
};

export default DiscussDetail;


