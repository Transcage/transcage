import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Truck, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const STEPS = ['Identity', 'Role', 'Password'];

const ROLES = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    desc: 'Send parcels or receive deliveries',
    icon: User
  },
  {
    value: 'DRIVER',
    label: 'Driver',
    desc: 'Deliver intercity or local P2P parcels',
    icon: Truck
  }
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser } = useAuth();

  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState({
    full_name: '', phone: '', email: '',
    role: 'CUSTOMER',
    password: '', confirm_password: ''
  });
  const [showPass, setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]          = useState('');
  const [loading, setLoading]      = useState(false);

  const set = (k) => (e) => { setError(''); setForm(f => ({ ...f, [k]: e.target.value })); };
  const setRole = (r) => setForm(f => ({ ...f, role: r }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name.trim()) { setError('Full name is required'); return false; }
      if (!form.phone.trim())     { setError('Phone number is required'); return false; }
    }
    if (step === 2) {
      if (!form.password || form.password.length < 6)        { setError('Password must be at least 6 characters'); return false; }
      if (form.password !== form.confirm_password)           { setError('Passwords do not match'); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) { setError(''); setStep(s => s + 1); } };
  const back = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    const res = await registerUser({
      full_name: form.full_name.trim(),
      phone:     form.phone.trim(),
      email:     form.email.trim() || undefined,
      role:      form.role,
      password:  form.password
    });
    setLoading(false);
    if (res.success) {
      res.role === 'DRIVER' ? navigate('/driver') : navigate('/app/shipments');
    } else {
      setError('Registration failed. That phone/email may already be registered.');
    }
  };

  return (
    <div className="auth-page">
      {/* Hero */}
      <aside className="auth-hero">
        <div className="auth-hero-logo">
          <Link to="/" className="tc-logo">
            <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
            <span className="tc-logo-wordmark">Trans<span>cage</span></span>
          </Link>
        </div>
        <div className="auth-hero-body">
          <h2 className="auth-hero-title">Join <span>Transcage</span><br />today</h2>
          <p className="auth-hero-desc">
            Ghana's first OTP-verified parcel custody network — station-to-station intercity
            and direct home delivery.
          </p>
          <div className="auth-hero-features">
            {['Book in under 2 minutes', 'Know exactly who holds your parcel', 'Pay on drop-off or via platform'].map(f => (
              <div key={f} className="auth-hero-feature">
                <div className="auth-hero-feature-dot" /> {f}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-hero-footer">© 2026 Transcage · Ghana</div>
      </aside>

      {/* Form */}
      <div className="auth-form-col">
        <div className="auth-form-card animate-fade-in">
          <h1 className="auth-form-title">Create account</h1>
          <p className="auth-form-subtitle" style={{ marginBottom: 22 }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

          {/* Step indicators */}
          <div className="auth-steps" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length - 1} aria-valuenow={step}>
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`auth-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                  <div className="auth-step-dot">
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className="auth-step-label">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`auth-step-line ${i < step ? 'done' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="auth-global-error" id="register-error-msg">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Step 0 — Identity */}
          {step === 0 && (
            <div className="animate-fade-in">
              <div className="tc-field-group">
                <label htmlFor="reg-fullname" className="tc-label">Full Name</label>
                <input id="reg-fullname" className="tc-input" type="text"
                  placeholder="e.g. Kwasi Henri Mensah"
                  value={form.full_name} onChange={set('full_name')} autoFocus />
              </div>
              <div className="tc-field-group">
                <label htmlFor="reg-phone" className="tc-label">Phone Number <span style={{ color: 'var(--tc-teal)', fontSize: 11 }}>Required</span></label>
                <input id="reg-phone" className="tc-input" type="tel"
                  placeholder="e.g. 024 000 0000"
                  value={form.phone} onChange={set('phone')} />
              </div>
              <div className="tc-field-group">
                <label htmlFor="reg-email" className="tc-label">Email <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>Optional</span></label>
                <input id="reg-email" className="tc-input" type="email"
                  placeholder="you@example.com"
                  value={form.email} onChange={set('email')} />
              </div>
              <button id="reg-next-identity" className="tc-btn tc-btn-primary tc-btn-full tc-btn-lg" onClick={next}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 1 — Role */}
          {step === 1 && (
            <div className="animate-fade-in">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                How will you use Transcage?
              </p>
              <div className="role-cards-grid">
                {ROLES.map(({ value, label, desc, icon: Icon }) => (
                  <div
                    key={value}
                    id={`role-card-${value.toLowerCase()}`}
                    className={`role-card ${form.role === value ? 'selected' : ''}`}
                    onClick={() => setRole(value)}
                    role="radio"
                    aria-checked={form.role === value}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setRole(value)}
                  >
                    <div className="role-card-icon"><Icon size={20} /></div>
                    <div className="role-card-label">{label}</div>
                    <div className="role-card-desc">{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="tc-btn tc-btn-secondary" onClick={back}><ArrowLeft size={15} /> Back</button>
                <button id="reg-next-role" className="tc-btn tc-btn-primary" style={{ flex: 1 }} onClick={next}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Password */}
          {step === 2 && (
            <form className="animate-fade-in" onSubmit={handleSubmit} noValidate>
              <div className="tc-field-group">
                <label htmlFor="reg-password" className="tc-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    className="tc-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    tabIndex={-1} aria-label="Toggle password visibility">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="tc-field-group">
                <label htmlFor="reg-confirm-password" className="tc-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-confirm-password"
                    className="tc-input"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={form.confirm_password}
                    onChange={set('confirm_password')}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    tabIndex={-1} aria-label="Toggle confirm password visibility">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="tc-btn tc-btn-secondary" onClick={back}><ArrowLeft size={15} /> Back</button>
                <button
                  id="reg-submit-btn"
                  type="submit"
                  className="tc-btn tc-btn-primary tc-btn-lg"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight size={16} /></>}
                </button>
              </div>
            </form>
          )}

          <div className="auth-form-footer" style={{ marginTop: 20 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
