import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Comments = ({ documentId, onClose }) => {
  const { user } = useAuth();
  const { isDark, current } = useTheme();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [documentId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/documents/${documentId}/comments`);
      setComments(res.data.comments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/documents/${documentId}/comments`, {
        text: newComment,
        parentComment: replyTo
      });
      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      await api.patch(`/documents/${documentId}/comments/${commentId}/resolve`);
      fetchComments();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/documents/${documentId}/comments/${commentId}`);
      fetchComments();
    } catch (error) {
      console.error(error);
    }
  };

  const organizeComments = (comments) => {
    const organized = [];
    const commentMap = new Map();
    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] });
    });
    comments.forEach(comment => {
      if (comment.parentComment) {
        const parent = commentMap.get(comment.parentComment);
        if (parent) {
          parent.replies.push(commentMap.get(comment._id));
        }
      } else {
        organized.push(commentMap.get(comment._id));
      }
    });
    return organized;
  };

  const smallBtn = {
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    borderRadius: '8px',
    border: `1px solid ${current.border}`,
    background: current.surfaceLight,
    color: current.textSecondary,
    cursor: 'pointer',
  };

  const renderComment = (comment, isReply = false) => (
    <div
      key={comment._id}
      style={{
        border: `1px solid ${current.border}`,
        borderRadius: '12px',
        padding: '0.875rem',
        marginBottom: '0.5rem',
        marginLeft: isReply ? 20 : 0,
        background: comment.resolved ? 'rgba(74, 222, 128, 0.08)' : current.surfaceLight
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
        <div>
          <strong style={{ fontSize: 14, color: current.text }}>{comment.author?.name || 'Unknown'}</strong>
          <span style={{ fontSize: 12, color: current.textMuted, marginLeft: 8 }}>
            {new Date(comment.createdAt).toLocaleString()}
          </span>
          {comment.resolved && (
            <span style={{ fontSize: 12, color: '#4ade80', marginLeft: 8 }}>
              ✓ Resolved
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isReply && (
            <button onClick={() => setReplyTo(comment._id)} style={smallBtn}>
              Reply
            </button>
          )}
          <button onClick={() => handleResolveComment(comment._id)} style={smallBtn}>
            {comment.resolved ? 'Unresolve' : 'Resolve'}
          </button>
          {comment.author?._id === user?.id && (
            <button
              onClick={() => handleDeleteComment(comment._id)}
              style={{ ...smallBtn, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.4, color: current.text }}>
        {comment.text}
      </div>
      {comment.replies?.map(reply => renderComment(reply, true))}
    </div>
  );

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
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem', color: current.text }}>Comments</h2>

        <form onSubmit={handleAddComment} style={{ marginBottom: 16 }}>
          {replyTo && (
            <div style={{ fontSize: 12, color: current.textMuted, marginBottom: 8 }}>
              Replying to comment...
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                style={{ ...smallBtn, marginLeft: 8 }}
              >
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="magical-input"
            style={{
              width: '100%',
              minHeight: 80,
              padding: '0.75rem',
              marginBottom: 8,
              resize: 'vertical'
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="magical-button"
            style={{ padding: '0.625rem 1rem', borderRadius: '12px', fontSize: '0.875rem', opacity: newComment.trim() ? 1 : 0.5 }}
          >
            {replyTo ? 'Reply' : 'Add Comment'}
          </button>
        </form>

        <div style={{ flex: 1, overflow: 'auto', marginBottom: 16 }}>
          {loading ? (
            <div style={{ color: current.textSecondary }}>Loading comments...</div>
          ) : organizeComments(comments).length === 0 ? (
            <div style={{ color: current.textMuted, textAlign: 'center', padding: 20 }}>
              No comments yet.
            </div>
          ) : (
            organizeComments(comments).map(comment => renderComment(comment))
          )}
        </div>

        <button
          onClick={onClose}
          className="magical-button"
          style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.875rem', alignSelf: 'flex-start' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Comments;
