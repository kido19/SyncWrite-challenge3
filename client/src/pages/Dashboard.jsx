import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const previewText = (html, maxLength = 90) => {
  if (!html) return 'No content yet.';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'No content yet.';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, current } = useTheme();
  const navigate = useNavigate();

  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setOwned(res.data.owned);
      setShared(res.data.shared);
      setRecent(res.data.recent);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post('/documents', { title: 'Untitled Document' });
      navigate(`/documents/${res.data.document._id}`);
    } catch (err) {
      console.error('Failed to create document', err);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: current.gradient,
      }}>
        <div className="magical-glow" style={{
          background: current.surface,
          padding: '1.75rem 2.5rem',
          borderRadius: '14px',
          border: `1px solid ${current.border}`,
          color: current.textSecondary,
          fontSize: '0.9375rem',
        }}>
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? '' : 'light-theme'} style={{
      minHeight: '100vh',
      background: current.gradient,
      position: 'relative',
    }}>

      <nav className="glass-morphism" style={{
        background: isDark ? 'rgba(10,10,10,0.92)' : 'rgba(248,248,248,0.92)',
        borderBottom: `1px solid ${current.border}`,
        padding: '0.875rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span className="magical-title" style={{ fontSize: '1.375rem' }}>
              SyncWrite
            </span>
            <span style={{
              fontSize: '0.8125rem',
              color: current.textSecondary,
              background: current.surfaceLight,
              border: `1px solid ${current.border}`,
              padding: '0.3rem 0.875rem',
              borderRadius: '20px',
              fontWeight: 500,
            }}>
              {user?.name}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              className="magical-button"
              style={{ padding: '0.5rem 0.75rem', fontSize: '1rem', borderRadius: '8px' }}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀' : '🌙'}
            </button>
            <button
              onClick={logout}
              className="magical-button"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', borderRadius: '8px' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        <div style={{
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: current.text,
              marginBottom: '0.375rem',
            }}>
              Your Documents
            </h1>
            <p style={{ color: current.textSecondary, fontSize: '0.9rem', margin: 0 }}>
              Create, manage, and collaborate on documents in real time.
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="magical-button"
            style={{
              padding: '0.75rem 1.75rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              borderRadius: '10px',
              opacity: creating ? 0.6 : 1,
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Creating...' : '+ New Document'}
          </button>
        </div>

        <DocList title="Recent" docs={recent} onRefresh={fetchDocuments} current={current} isDark={isDark} />
        <DocList title="My Documents" docs={owned} showSharedWith onRefresh={fetchDocuments} current={current} isDark={isDark} />
        <DocList title="Shared with Me" docs={shared} showOwner onRefresh={fetchDocuments} current={current} isDark={isDark} />
      </div>
    </div>
  );
};

const DocList = ({ title, docs, showSharedWith, showOwner, onRefresh, current, isDark }) => {
  const navigate = useNavigate();
  const [editingDoc, setEditingDoc] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const handleRename = async (docId) => {
    if (!newTitle.trim()) return;
    try {
      await api.patch(`/documents/${docId}/rename`, { title: newTitle });
      setEditingDoc(null);
      setNewTitle('');
      onRefresh?.();
    } catch (err) {
      console.error('Failed to rename', err);
    }
  };

  const handleDelete = async (docId, docTitle) => {
    if (!window.confirm(`Delete "${docTitle}"?`)) return;
    try {
      await api.delete(`/documents/${docId}`);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleDuplicate = async (docId) => {
    try {
      const res = await api.post(`/documents/${docId}/duplicate`);
      navigate(`/documents/${res.data.document._id}`);
    } catch (err) {
      console.error('Failed to duplicate', err);
    }
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: current.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '1rem',
      }}>
        {title}
      </h2>

      {docs.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: current.textMuted,
          fontSize: '0.875rem',
          background: current.surface,
          border: `1px solid ${current.border}`,
          borderRadius: '12px',
        }}>
          No documents here yet.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {docs.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/documents/${doc._id}`)}
              className="magical-card"
              style={{
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
                minHeight: '160px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(192,192,192,0.1)' : 'rgba(0,0,0,0.06)',
                  border: `1px solid ${current.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  📄
                </div>

                <div onClick={stop} style={{ display: 'flex', gap: '0.375rem' }}>
                  {[
                    { icon: '✏', title: 'Rename', action: () => { setEditingDoc(doc._id); setNewTitle(doc.title); } },
                    { icon: '⧉', title: 'Duplicate', action: () => handleDuplicate(doc._id) },
                    ...(!showOwner ? [{ icon: '✕', title: 'Delete', action: () => handleDelete(doc._id, doc.title), danger: true }] : []),
                  ].map((btn) => (
                    <button
                      key={btn.title}
                      onClick={btn.action}
                      title={btn.title}
                      style={{
                        background: btn.danger ? 'rgba(239,68,68,0.08)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                        border: `1px solid ${btn.danger ? 'rgba(239,68,68,0.2)' : current.border}`,
                        borderRadius: '6px',
                        padding: '0.3rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: btn.danger ? '#ef4444' : current.textSecondary,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>

              {editingDoc === doc._id ? (
                <div onClick={stop}>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(doc._id);
                      if (e.key === 'Escape') { setEditingDoc(null); setNewTitle(''); }
                    }}
                    autoFocus
                    className="magical-input"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.375rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => handleRename(doc._id)} className="magical-button" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}>Save</button>
                    <button onClick={() => { setEditingDoc(null); setNewTitle(''); }} style={{ background: current.surface, color: current.textSecondary, border: `1px solid ${current.border}`, padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: current.text, lineHeight: 1.4 }}>
                  {doc.title}
                </h3>
              )}

              <p style={{
                color: current.textMuted,
                fontSize: '0.8125rem',
                lineHeight: 1.55,
                flex: 1,
                overflow: 'hidden',
              }}>
                {previewText(doc.content)}
              </p>

              <div style={{ fontSize: '0.75rem', color: current.textMuted, borderTop: `1px solid ${current.border}`, paddingTop: '0.5rem' }}>
                {new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {showOwner && doc.owner && <span> · {doc.owner.name}</span>}
                {showSharedWith && doc.collaborators?.length > 0 && (
                  <span> · {doc.collaborators.length} collaborator{doc.collaborators.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
