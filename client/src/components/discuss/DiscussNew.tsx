import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createThread } from '../../services/discuss';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '../Dashboard/Navbar';
import './discuss.css';

const DiscussNew: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [preview, setPreview] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const t = await createThread({ title, content, tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [] });
      navigate(`/discuss/${t._id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="discuss-new">
      <Navbar />
      <div className="discuss-container">
        <div className="discuss-header">
          <h2>Start a New Discussion</h2>
          <div className="header-actions">
            <button className="secondary" onClick={() => navigate('/discuss')}>← All Discussions</button>
            <button className="secondary" onClick={() => navigate('/')}>Dashboard</button>
          </div>
        </div>
        <div className="discuss-filters">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="📝 Discussion Title" />
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="🏷️ Tags (comma separated)" />
        </div>
        <div className="editor">
          <div className="editor-toolbar">
            <span style={{fontWeight: 600, color: 'var(--dq-text)'}}>📝 Write Your Discussion</span>
            <button onClick={() => setPreview(p => !p)}>{preview ? '✏️ Edit' : '👁️ Preview'}</button>
          </div>
        {preview ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || 'Nothing to preview'}</ReactMarkdown>
          </div>
        ) : (
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write in Markdown..." />
        )}
      </div>
        <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px'}}>
          <button className="secondary" onClick={() => navigate('/discuss')}>Cancel</button>
          <button className="primary" disabled={submitting} onClick={submit}>
            <span style={{marginRight: '8px'}}>🚀</span>
            {submitting ? 'Posting…' : 'Post Discussion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussNew;


