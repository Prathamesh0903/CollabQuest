import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createThread } from '../../services/discuss';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
      <div className="discuss-header" style={{marginBottom:12}}>
        <h2>Start a Discussion</h2>
        <div style={{display:'inline-flex', gap:8}}>
          <button className="secondary" onClick={() => navigate('/')}>← Dashboard</button>
          <button className="secondary" onClick={() => navigate('/discuss')}>All Threads</button>
        </div>
      </div>
      <div className="discuss-filters" style={{marginBottom:8}}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" />
      </div>
      <div className="editor">
        <div className="editor-toolbar">
          <button onClick={() => setPreview(p => !p)}>{preview ? 'Edit' : 'Preview'}</button>
        </div>
        {preview ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || 'Nothing to preview'}</ReactMarkdown>
          </div>
        ) : (
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write in Markdown..." />
        )}
      </div>
      <div>
        <button className="primary" disabled={submitting} onClick={submit}>{submitting ? 'Posting…' : 'Post'}</button>
        <button onClick={() => navigate('/discuss')}>Cancel</button>
      </div>
    </div>
  );
};

export default DiscussNew;


