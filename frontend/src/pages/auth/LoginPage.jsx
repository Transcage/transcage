import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCredentials, loading, authError, setAuthError, isAuthenticated, activeRole } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || null;

  // Clear any previous error on visit
  useEffect(() => {
    setAuthError(null);
  }, [setAuthError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (activeRole === 'PLATFORM_ADMIN') navigate('/admin', { replace: true });
      else if (activeRole === 'STATION_STAFF') navigate('/station', { replace: true });
      else if (activeRole === 'DRIVER') navigate('/driver', { replace: true });
      else navigate('/app/shipments', { replace: true });
    }
  }, [isAuthenticated, activeRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    const result = await loginWithCredentials(identifier.trim(), password);
    if (result.success) {
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      const role = result.role;
      if (role === 'PLATFORM_ADMIN') navigate('/admin');
      else if (role === 'STATION_STAFF') navigate('/station');
      else if (role === 'DRIVER') navigate('/driver');
      else navigate('/app/shipments');
    }
  };

  return (
    <div className="auth-page">
      {/* Top Navbar */}
      <header className="auth-nav">
        <Link to="/" className="tc-logo">
          <img src="/transcage_logo.png" alt="Transcage Logo" className="tc-logo-img" />
          <span className="tc-logo-wordmark">Trans<span>cage</span></span>
        </Link>

        <div className="auth-nav-right">
          <Link to="/" className="auth-nav-home-link">
            Home
          </Link>
          <Link to="/register" className="tc-btn tc-btn-primary tc-btn-sm">
            Create account
          </Link>
        </div>
      </header>

      {/* Main Central Section */}
      <main className="auth-main-wrap">
        <div className="auth-card">
          {/* Left Hero Column (Hidden on mobile) */}
          <aside className="auth-left-col">
            <div className="auth-left-content">
              <span className="auth-hero-badge">FROM SENDER TO RECIPIENT</span>
              <h2 className="auth-hero-heading">
                Your verified <span>delivery awaits.</span>
              </h2>
              <p className="auth-hero-sub">
                Send parcels across Ghana seamlessly, pay securely, and get verified OTP delivery right to the recipient.
              </p>
            </div>

            <div className="auth-hero-img-box">
              <img
                src="/transcage-hero.jpg"
                alt="Transcage Verified Parcel Delivery Ghana"
                className="auth-hero-img"
              />
            </div>

            <div className="auth-pillars-row">
              <div className="auth-pillar">
                <span className="auth-pillar-title">Fast</span>
                <span className="auth-pillar-desc">Courier Delivery</span>
              </div>
              <div className="auth-pillar">
                <span className="auth-pillar-title">Secure</span>
                <span className="auth-pillar-desc">OTP Handover</span>
              </div>
              <div className="auth-pillar">
                <span className="auth-pillar-title">Live</span>
                <span className="auth-pillar-desc">Order Tracking</span>
              </div>
            </div>
          </aside>

          {/* Right Form Column */}
          <section className="auth-right-col">
            <div>
              <div className="auth-eyebrow">WELCOME BACK</div>
              <h1 className="auth-title">Sign in to your account</h1>
            </div>

            {authError && (
              <div className="auth-error-alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field-box">
                <div className="auth-field">
                  <label className="auth-label">Phone number or email</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="0244 000 000 or you@email.com"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    autoFocus
                  />
                </div>

                <div className="auth-field">
                  <div className="auth-label-row">
                    <label className="auth-label">Password</label>
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => alert('Password reset is available via your registered SMS phone.')}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="auth-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="tc-btn tc-btn-primary auth-submit-btn"
                disabled={loading}
              >
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              </button>
            </form>

            <div className="auth-bottom-switch">
              Don't have an account?{' '}
              <Link to="/register" className="auth-switch-link">
                Create one
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Auth Page Footer */}
      <footer className="auth-page-footer">
        <div className="auth-page-footer-content">
          <div>
            © 2026 Transcage · From Sender to Recipient
          </div>
          <div className="auth-page-footer-right">
            <Link to="/privacy" className="auth-page-footer-link">Privacy</Link>
            <Link to="/terms" className="auth-page-footer-link">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
