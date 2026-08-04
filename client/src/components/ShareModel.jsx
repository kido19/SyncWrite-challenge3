import { useState } from 'react';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const ShareModal = ({ documentId, collaborators, onClose, onUpdate }) => {
  const { isDark, current } = useTheme();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/documents/${documentId}/share`, { email, role });
      onUpdate(res.data.collaborators);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      const res = await api.delete(`/documents/${documentId}/share/${userId}`);
      onUpdate(res.data.collaborators);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={isDark ? '' : 'light-theme'}
      style={{
        position: 'fixed',
        inset: 0,
        background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="magical-card static-card"
        style={{ padding: '2rem', width: '100%', maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem', color: current.text, fontSize: '1.5rem' }}>
          Share document
        </h2>

        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="magical-input"
            style={{ flex: 1, minWidth: 160, padding: '0.75rem' }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="magical-input"
            style={{ padding: '0.75rem', minWidth: 110 }}
          >
            <option value="viewer">Viewer</option>
            <option value="commenter">Commenter</option>
            <option value="editor">Editor</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="magical-button"
            style={{ padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem' }}
          >
            {loading ? '...' : 'Invite'}
          </button>
        </form>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</p>
        )}

        <h4 style={{ color: current.textSecondary, marginBottom: '0.75rem' }}>People with access</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {collaborators.length === 0 && (
            <p style={{ color: current.textMuted, fontSize: '0.875rem' }}>Not shared with anyone yet.</p>
          )}
          {collaborators.map((c) => (
            <li
              key={c.user._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: `1px solid ${current.border}`,
              }}
            >
              <div>
                <div style={{ color: current.text }}>{c.user.name}</div>
                <div style={{ fontSize: '0.75rem', color: current.textMuted }}>
                  {c.user.email} · {c.role}
                </div>
              </div>
              <button
                onClick={() => handleRemove(c.user._id)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '0.375rem 0.75rem',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="magical-button"
          style={{ marginTop: '1.25rem', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.875rem' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
