import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const VersionHistory = ({ documentId, onClose, onRestore }) => {
  const { isDark, current } = useTheme();
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      const res = await api.get(`/documents/${documentId}/versions`);
      setVersions(res.data.versions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = async (versionId) => {
    try {
      const res = await api.get(`/documents/${documentId}/versions/${versionId}`);
      setSelectedVersion(res.data.version);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('Restore this version? This will replace the current content.')) return;
    try {
      await api.post(`/documents/${documentId}/versions/${versionId}/restore`);
      onRestore?.();
      onClose();
    } catch (error) {
      console.error(error);
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
        style={{
          padding: '2rem',
          width: selectedVersion ? '90%' : '600px',
          maxWidth: selectedVersion ? '1100px' : '600px',
          height: selectedVersion ? '80%' : 'auto',
          maxHeight: '90vh',
          display: 'flex',
          gap: '1rem',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flex: selectedVersion ? '0 0 280px' : '1', overflow: 'auto' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.25rem', color: current.text }}>Version History</h2>

          {loading ? (
            <div style={{ color: current.textSecondary }}>Loading versions...</div>
          ) : versions.length === 0 ? (
            <div style={{ color: current.textMuted }}>No versions found.</div>
          ) : (
            <div>
              {versions.map((version) => (
                <div
                  key={version._id}
                  style={{
                    padding: '0.875rem',
                    border: `1px solid ${selectedVersion?._id === version._id ? current.accent : current.border}`,
                    borderRadius: '12px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    background: selectedVersion?._id === version._id
                      ? (isDark ? 'rgba(192,192,192,0.12)' : 'rgba(0,0,0,0.06)')
                      : current.surfaceLight,
                  }}
                  onClick={() => handleViewVersion(version._id)}
                >
                  <div style={{ fontSize: 14, marginBottom: 4, color: current.text }}>
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: current.textMuted }}>
                    By {version.createdBy?.name || 'Unknown'}
                  </div>
                  {selectedVersion?._id === version._id && (
                    <button
                      className="magical-button"
                      style={{ marginTop: 8, padding: '0.375rem 0.75rem', fontSize: 12, borderRadius: '8px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreVersion(version._id);
                      }}
                    >
                      Restore This Version
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="magical-button"
            style={{ marginTop: '1rem', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.875rem' }}
          >
            Close
          </button>
        </div>

        {selectedVersion && (
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '1rem',
              border: `1px solid ${current.border}`,
              borderRadius: '16px',
              background: current.surfaceLight,
            }}
          >
            <h3 style={{ color: current.text, marginTop: 0 }}>Version Preview</h3>
            <div style={{ fontSize: 12, color: current.textMuted, marginBottom: 16 }}>
              Created: {new Date(selectedVersion.createdAt).toLocaleString()} by {selectedVersion.createdBy?.name}
            </div>
            <div
              className="document-editor-content"
              style={{
                background: current.surface,
                padding: '1rem',
                borderRadius: '12px',
                minHeight: 200,
                color: current.text,
                border: `1px solid ${current.border}`,
              }}
              dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
