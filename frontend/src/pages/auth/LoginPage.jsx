import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();

  const [form, setForm]       = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.identifier.trim()) { setError('Phone or email is required'); return; }
    if (!form.password)           { setError('Password is required'); return; }

    setLoading(true);
    const res = await loginWithCredentials(form.identifier.trim(), form.password);
    setLoading(false);

    if (res.success) {
      const role = res.role;
      if (role === 'PLATFORM_ADMIN') navigate('/admin');
      else if (role === 'STATION_CLERK' || role === 'OVERSEER' || role === 'COMPANY_ADMIN') navigate('/station');
      else if (role === 'DRIVER') navigate('/driver');
      else navigate('/app/shipments');
    } else {
      setError('Invalid phone/email or password.');
    }
  };

  return (
    <div className="auth-page">
      {/* Left hero */}
      <aside className="auth-hero">
        <div className="auth-hero-logo">
          <Link to="/" className="tc-logo">
            <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
            <span className="tc-logo-wordmark">Trans<span>cage</span></span>
          </Link>
        </div>
        <div className="auth-hero-body">
          <h2 className="auth-hero-title">
            Welcome back to<br /><span>Transcage</span>
          </h2>
          <p className="auth-hero-desc">
            Log in to manage your parcels, track deliveries, and access your dashboard.
          </p>
          <div className="auth-hero-features">
            {['OTP-secured parcel handovers', 'Real-time custody tracking', 'Multi-role dashboard access'].map(f => (
              <div key={f} className="auth-hero-feature">
                <div className="auth-hero-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-hero-footer">© 2026 Transcage · Ghana</div>
      </aside>

      {/* Right form */}
      <div className="auth-form-col">
        <div className="auth-form-card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--tc-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={18} color="var(--tc-teal)" />
            </div>
            <div>
              <h1 className="auth-form-title" style={{ fontSize: 20, marginBottom: 0 }}>Sign in</h1>
            </div>
          </div>
          <p className="auth-form-subtitle">Enter your phone or email to continue</p>

          {error && (
            <div className="auth-global-error" id="login-error-msg">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="tc-field-group">
              <label htmlFor="login-identifier" className="tc-label">Phone or Email</label>
              <input
                id="login-identifier"
                className="tc-input"
                type="text"
                placeholder="e.g. 024 000 0000 or you@email.com"
                value={form.identifier}
                onChange={set('identifier')}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="tc-field-group">
              <label htmlFor="login-password" className="tc-label">
                Password
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--tc-teal)', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  className="tc-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2
                  }}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="tc-btn tc-btn-primary tc-btn-full tc-btn-lg"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Signing in…' : (
                <><span>Sign in</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="auth-form-footer">
            Don't have an account?{' '}
            <Link to="/register">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
