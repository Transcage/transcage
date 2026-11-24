import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Package, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser, loading, authError, setAuthError, isAuthenticated, activeRole } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (activeRole === 'PLATFORM_ADMIN') navigate('/admin', { replace: true });
      else if (activeRole === 'STATION_STAFF') navigate('/station', { replace: true });
      else if (activeRole === 'DRIVER') navigate('/driver', { replace: true });
      else navigate('/app/shipments', { replace: true });
    }
  }, [isAuthenticated, activeRole, navigate]);

  // Progressive segment index: 0 | 1 | 2 (no step numbers shown to user)
  const [segment, setSegment] = useState(0);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'DRIVER'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Validate segment 0
  const handleNextFromIdentity = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!fullName.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setLocalError('Please enter a valid Ghana phone number');
      return;
    }
    setSegment(1);
  };

  // Validate segment 1
  const handleNextFromProfile = (e) => {
    e.preventDefault();
    setLocalError('');
    setSegment(2);
  };

  // Submit complete form
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const result = await registerUser({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      password,
      role
    });

    if (result.success) {
      if (role === 'DRIVER') navigate('/driver');
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
          <Link to="/login" className="tc-btn tc-btn-primary tc-btn-sm ">
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Central Section */}
      <main className="auth-main-wrap">
        <div className="auth-card">
          {/* Left Hero Column (Hidden on mobile) */}
          <aside className="auth-left-col">
            <div className="auth-left-content">
              <span className="auth-hero-badge">GHANA'S UNIFIED NETWORK</span>
              <h2 className="auth-hero-heading">
                Join Ghana's verified <span>parcel logistics.</span>
              </h2>
              <p className="auth-hero-sub">
                Send and track parcels nationwide or earn as an authorized courier with verified OTP.
              </p>
            </div>

            <div className="auth-hero-img-box">
              <img
                src="/transcage-station.jpg"
                alt="Transcage Terminal Logistics Station Ghana"
                className="auth-hero-img"
              />
            </div>

            <div className="auth-pillars-row">
              <div className="auth-pillar">
                <span className="auth-pillar-title">Direct</span>
                <span className="auth-pillar-desc">P2P Delivery</span>
              </div>
              <div className="auth-pillar">
                <span className="auth-pillar-title">Intercity</span>
                <span className="auth-pillar-desc">Station Coach</span>
              </div>
              <div className="auth-pillar">
                <span className="auth-pillar-title">Verified</span>
                <span className="auth-pillar-desc">OTP Security</span>
              </div>
            </div>
          </aside>

          {/* Right Form Column */}
          <section className="auth-right-col">
            <div>
              <div className="auth-eyebrow">GET STARTED</div>
              <h1 className="auth-title">Create your account</h1>
            </div>

            {(localError || authError) && (
              <div className="auth-error-alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{localError || authError}</span>
              </div>
            )}

            {/* ─── Segment 0: Name & Phone ─────────────────────────────────── */}
            {segment === 0 && (
              <form onSubmit={handleNextFromIdentity} className="auth-form animate-fade-in">
                <div className="auth-field-box">
                  <div className="auth-field">
                    <label className="auth-label">Full Name</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Ama Osei"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (localError) setLocalError('');
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Mobile Phone Number</label>
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="e.g. 0244 000 000 or +233240000001"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (localError) setLocalError('');
                      }}
                    />
                  </div>
                </div>

                <button type="submit" className="tc-btn tc-btn-primary auth-submit-btn">
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* ─── Segment 1: Email & Role ─────────────────────────────────── */}
            {segment === 1 && (
              <form onSubmit={handleNextFromProfile} className="auth-form animate-fade-in">
                <div className="auth-field-box">
                  <div className="auth-field">
                    <label className="auth-label">Email Address (Optional)</label>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="e.g. ama.osei@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">I want to use Transcage as</label>
                    <div className="auth-role-grid">
                      <div
                        className={`auth-role-card ${role === 'CUSTOMER' ? 'selected' : ''}`}
                        onClick={() => setRole('CUSTOMER')}
                      >
                        <Package size={22} className="auth-role-icon" color="var(--tc-teal)" />
                        <span className="auth-role-name">Personal</span>
                        <span className="auth-role-sub">Send &amp; Receive parcels</span>
                      </div>

                      <div
                        className={`auth-role-card ${role === 'DRIVER' ? 'selected' : ''}`}
                        onClick={() => setRole('DRIVER')}
                      >
                        <Truck size={22} className="auth-role-icon" color="#002050" />
                        <span className="auth-role-name">Courier / Driver</span>
                        <span className="auth-role-sub">Earn on delivery gigs</span>
                      </div>
                    </div>
                    <Link to="/agency-request" className="auth-role-card auth-label">We are a transport Agency</Link>
                  </div>
                </div>

                <div className="auth-btn-row">
                  <button
                    type="button"
                    className="tc-btn tc-btn-outline"
                    onClick={() => setSegment(0)}
                  >
                    <ArrowLeft size={15} />
                    <span>Back</span>
                  </button>
                  <button type="submit" className="tc-btn tc-btn-primary">
                    <span>Continue</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* ─── Segment 2: Password ────────────────────────────────────── */}
            {segment === 2 && (
              <form onSubmit={handleFinalSubmit} className="auth-form animate-fade-in">
                <div className="auth-field-box">
                  <div className="auth-field">
                    <label className="auth-label">Create Password</label>
                    <div className="auth-input-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (localError) setLocalError('');
                        }}
                        autoFocus
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

                  <div className="auth-field">
                    <label className="auth-label">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (localError) setLocalError('');
                      }}
                    />
                  </div>
                </div>

                <div className="auth-btn-row">
                  <button
                    type="button"
                    className="tc-btn tc-btn-outline"
                    onClick={() => setSegment(1)}
                    disabled={loading}
                  >
                    <ArrowLeft size={15} />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="tc-btn tc-btn-primary"
                    disabled={loading}
                  >
                    <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="auth-bottom-switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Sign in
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
