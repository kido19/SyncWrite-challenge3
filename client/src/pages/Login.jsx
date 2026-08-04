import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { isDark, toggleTheme, current } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={isDark ? '' : 'light-theme'}
      style={{
        minHeight: '100vh',
        background: current.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
      }}
    >
      
      
      <button
        onClick={toggleTheme}
        className="magical-button"
        style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '0.5rem 0.75rem', fontSize: '1rem', borderRadius: '8px' }}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? '☀' : '🌙'}
      </button>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: isDark ? 'rgba(14,14,14,0.92)' : 'rgba(255,255,255,0.95)',
        border: `1px solid ${current.border}`,
        borderRadius: '18px',
        padding: '2.5rem',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.08)',
      }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="magical-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            SyncWrite
          </h1>
          <p style={{ color: current.textSecondary, fontSize: '0.875rem', margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: current.textSecondary, marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="magical-input"
              placeholder="you@example.com"
              style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '0.9375rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: current.textSecondary, marginBottom: '0.5rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="magical-input"
              placeholder="Enter your password"
              style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '0.9375rem' }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#ef4444',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="magical-button"
            style={{
              width: '100%',
              padding: '0.875rem',
              fontSize: '0.9375rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: current.textMuted, fontSize: '0.8125rem', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: current.accent, textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
