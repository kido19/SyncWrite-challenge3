import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { io } from 'socket.io-client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Toolbar from '../components/Toolbar';
import PresenceBar from '../components/PresenceBar';
import ShareModal from '../components/ShareModel';
import VersionHistory from '../components/VersionHistory';
import Comments from '../components/Comments';

const userColor = (id) => {
  const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

let editorStyleEl = null;
const injectEditorStyles = (isDark) => {
  if (!editorStyleEl) {
    editorStyleEl = window.document.createElement('style');
    editorStyleEl.id = 'syncwrite-editor-styles';
    window.document.head.appendChild(editorStyleEl);
  }
  editorStyleEl.textContent = `
    .ProseMirror {
      outline: none;
      min-height: 480px;
      font-size: 1rem;
      line-height: 1.8;
      color: ${isDark ? '#e8e8e8' : '#111111'};
      font-family: 'Georgia', 'Times New Roman', serif;
    }
    .ProseMirror p { margin: 0 0 0.875em; }
    .ProseMirror h1 { font-size: 1.875rem; font-weight: 700; margin: 0 0 0.75em; color: ${isDark ? '#f0f0f0' : '#111111'}; }
    .ProseMirror h2 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.6em; color: ${isDark ? '#e0e0e0' : '#222222'}; }
    .ProseMirror strong { font-weight: 700; color: ${isDark ? '#ffffff' : '#000000'}; }
    .ProseMirror em { font-style: italic; opacity: 0.9; }
    .ProseMirror u { text-decoration: underline; }
    .ProseMirror a { color: ${isDark ? '#c0c0c0' : '#333333'}; text-decoration: underline; }
    .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin: 0 0 0.875em; }
    .ProseMirror li { margin-bottom: 0.3em; }
    .ProseMirror blockquote {
      border-left: 3px solid ${isDark ? 'rgba(192,192,192,0.35)' : 'rgba(0,0,0,0.2)'};
      padding-left: 1rem;
      color: ${isDark ? '#c0c0c0' : '#444444'};
      margin: 0 0 0.875em;
      font-style: italic;
    }
    .ProseMirror .collaboration-cursor__caret { border-left: 2px solid; margin-left: -1px; }
    .ProseMirror .collaboration-cursor__label {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 4px;
      color: white;
      white-space: nowrap;
    }
  `;
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme, current } = useTheme();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [document, setDocument] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved');

  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const socketRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const seededRef = useRef(false);

  useEffect(() => {
    injectEditorStyles(isDark);
  }, [isDark]);

  useEffect(() => {
    api
      .get(`/documents/${id}`)
      .then((res) => {
        setDocument(res.data.document);
        setRole(res.data.role);
        setCollaborators(res.data.document.collaborators || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load document');
      });
  }, [id]);

  useEffect(() => {
    if (!document || !role) return;
    const token = localStorage.getItem('token');
    const newYdoc = new Y.Doc();
    const newProvider = new SocketIOProvider('http://localhost:5000', id, newYdoc, { auth: { token } });
    setYdoc(newYdoc);
    setProvider(newProvider);
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join-document', { documentId: id, token, name: user?.name || 'Anonymous' });
    });
    socket.on('presence-update', (users) => setOnlineUsers(users));
    return () => {
      newProvider.disconnect();
      newYdoc.destroy();
      socket.disconnect();
      setYdoc(null);
      setProvider(null);
      seededRef.current = false;
    };
  }, [document, role, id]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false, link: { openOnClick: false } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ...(ydoc && provider
          ? [
              Collaboration.configure({ document: ydoc }),
              CollaborationCaret.configure({
                provider,
                user: { name: user?.name || 'Anonymous', color: userColor(user?.id || 'x') },
              }),
            ]
          : []),
      ],
      editable: role === 'owner' || role === 'editor',
      onUpdate: ({ editor: editorInstance }) => {
        if (editorInstance && !editorInstance.isDestroyed) scheduleAutosave();
      },
    },
    [ydoc, provider, role]
  );

  const scheduleAutosave = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!editor || editor.isDestroyed) return;
        await api.patch(`/documents/${id}/content`, { content: editor.getHTML() });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('saved');
      }
    }, 1500);
  }, [editor, id]);

  useEffect(() => {
    if (!editor || !document || !provider || seededRef.current) return;
    const handleSync = (isSynced) => {
      if (!isSynced || seededRef.current || !editor) return;
      try {
        if (editor.isEmpty && document.content) editor.commands.setContent(document.content);
        seededRef.current = true;
      } catch {
        seededRef.current = true;
      }
    };
    provider.on('sync', handleSync);
    return () => provider.off('sync', handleSync);
  }, [editor, document, provider]);

  const saveTitle = async () => {
    setEditingTitle(false);
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === document.title) return;
    try {
      await api.patch(`/documents/${id}/rename`, { title: trimmed });
      setDocument((prev) => ({ ...prev, title: trimmed }));
    } catch (err) {
      console.error('Failed to rename', err);
    }
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: current.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: isDark ? 'rgba(14,14,14,0.95)' : 'rgba(255,255,255,0.95)',
          border: `1px solid ${current.border}`,
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          maxWidth: 420,
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠</div>
          <p style={{ color: current.text, marginBottom: '1.5rem', fontSize: '1rem' }}>{error}</p>
          <button onClick={() => navigate('/dashboard')} style={silverBtn(isDark)}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!document || !editor) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: current.gradient }}>
        <div className="magical-glow" style={{
          background: current.surface,
          padding: '1.75rem 2.5rem',
          borderRadius: '14px',
          border: `1px solid ${current.border}`,
          color: current.textSecondary,
          fontSize: '0.9375rem',
        }}>
          Loading document...
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? '' : 'light-theme'} style={{ minHeight: '100vh', background: current.gradient }}>

      <nav style={{
        background: isDark ? 'rgba(8,8,8,0.95)' : 'rgba(248,248,248,0.96)',
        borderBottom: `1px solid ${isDark ? 'rgba(192,192,192,0.12)' : 'rgba(0,0,0,0.1)'}`,
        padding: '0.75rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1100px',
          margin: '0 auto',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} style={outlineBtn(isDark)}>
              ← Back
            </button>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              background: isDark
                ? 'linear-gradient(135deg, #c0c0c0, #f0f0f0)'
                : 'linear-gradient(135deg, #333, #666)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}>
              SyncWrite
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <PresenceBar users={onlineUsers} current={current} isDark={isDark} />

            {(role === 'owner' || role === 'editor' || role === 'commenter') && (
              <button onClick={() => setShowComments(true)} style={navBtn(isDark)}>
                Comments
              </button>
            )}

            <button onClick={() => setShowVersionHistory(true)} style={navBtn(isDark)}>
              History
            </button>

            {role === 'owner' && (
              <button onClick={() => setShowShareModal(true)} style={silverBtn(isDark)}>
                Share
              </button>
            )}

            <button
              onClick={toggleTheme}
              style={{ ...outlineBtn(isDark), padding: '0.45rem 0.7rem', fontSize: '1rem' }}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        <div style={card(isDark, '0 0 1.25rem')}>
          {editingTitle ? (
            <input
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              style={{
                fontSize: '1.625rem',
                fontWeight: 700,
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: `1.5px solid ${isDark ? 'rgba(192,192,192,0.3)' : 'rgba(0,0,0,0.2)'}`,
                borderRadius: '8px',
                color: isDark ? '#f0f0f0' : '#111111',
                outline: 'none',
                fontFamily: 'inherit',
                marginBottom: '0.5rem',
              }}
            />
          ) : (
            <h1
              onClick={() => {
                if (role !== 'owner' && role !== 'editor') return;
                setTitleInput(document.title);
                setEditingTitle(true);
              }}
              title={role === 'owner' || role === 'editor' ? 'Click to rename' : ''}
              style={{
                margin: '0 0 0.5rem',
                fontSize: '1.625rem',
                fontWeight: 700,
                color: isDark ? '#f0f0f0' : '#111111',
                cursor: role === 'owner' || role === 'editor' ? 'pointer' : 'default',
                lineHeight: 1.3,
              }}
            >
              {document.title}
            </h1>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.8rem',
              color: isDark ? '#aaaaaa' : '#666666',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              padding: '0.2rem 0.65rem',
              borderRadius: '20px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              fontWeight: 500,
              textTransform: 'capitalize',
            }}>
              {role}
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: saveStatus === 'saving'
                ? (isDark ? '#aaaaaa' : '#666666')
                : '#4ade80',
            }}>
              {saveStatus === 'saving' ? 'Saving...' : '✓ Saved'}
            </span>
            <span style={{ fontSize: '0.8rem', color: isDark ? '#666' : '#999' }}>
              Last modified {new Date(document.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>

        {(role === 'owner' || role === 'editor') && (
          <div style={card(isDark, '0 0 1rem')}>
            <Toolbar editor={editor} current={current} isDark={isDark} />
          </div>
        )}

        <div style={{ ...card(isDark, '0'), minHeight: 520, padding: '2rem 2.5rem' }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {showShareModal && (
        <ShareModal
          documentId={id}
          collaborators={collaborators}
          onClose={() => setShowShareModal(false)}
          onUpdate={setCollaborators}
        />
      )}
      {showVersionHistory && (
        <VersionHistory
          documentId={id}
          onClose={() => setShowVersionHistory(false)}
          onRestore={() => window.location.reload()}
        />
      )}
      {showComments && (
        <Comments documentId={id} onClose={() => setShowComments(false)} />
      )}
    </div>
  );
};

const silverBtn = (isDark) => ({
  padding: '0.45rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  borderRadius: '8px',
  border: 'none',
  background: isDark
    ? 'linear-gradient(135deg, #888, #c0c0c0)'
    : 'linear-gradient(135deg, #444, #777)',
  color: isDark ? '#0a0a0a' : '#ffffff',
  cursor: 'pointer',
  boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
  transition: 'all 0.2s ease',
});

const outlineBtn = (isDark) => ({
  padding: '0.45rem 0.9rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  borderRadius: '8px',
  border: `1px solid ${isDark ? 'rgba(192,192,192,0.25)' : 'rgba(0,0,0,0.18)'}`,
  background: 'transparent',
  color: isDark ? '#c0c0c0' : '#333333',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

const navBtn = (isDark) => ({
  padding: '0.45rem 0.9rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  borderRadius: '8px',
  border: `1px solid ${isDark ? 'rgba(192,192,192,0.15)' : 'rgba(0,0,0,0.12)'}`,
  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  color: isDark ? '#c0c0c0' : '#333333',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

const card = (isDark, margin) => ({
  background: isDark ? 'rgba(14,14,14,0.92)' : '#ffffff',
  border: `1px solid ${isDark ? 'rgba(192,192,192,0.1)' : 'rgba(0,0,0,0.09)'}`,
  borderRadius: '14px',
  padding: '1.5rem',
  margin,
  backdropFilter: 'blur(16px)',
  boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.06)',
});

export default DocumentEditor;
