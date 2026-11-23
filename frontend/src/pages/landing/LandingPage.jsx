import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Package, Building2, Truck, Shield, MapPin } from 'lucide-react';
import './LandingPage.css';

const STEPS = [
  { num: '01', title: 'Book Your Shipment', desc: "Tell us what you're sending, where from, and where to. Choose station drop-off or home pickup." },
  { num: '02', title: 'Drop at Station / Driver Collects', desc: 'Drop your item at the nearest partner station, or a verified driver picks up from your location.' },
  { num: '03', title: 'OTP Handover at Every Point', desc: 'Every custody transfer — station, driver, or destination — requires a one-time code. Your parcel never disappears.' },
  { num: '04', title: 'Real-time Tracking', desc: "Track your parcel's exact status and custody chain live. Know who has it at every moment." }
];

const STATION_FEATURES = [
  'Drop-off at any partner station near you',
  'Intercity relay between station network',
  'OTP-secured station-to-station handover',
  'Lower rates for non-urgent parcels'
];

const P2P_FEATURES = [
  'Driver picks up from your doorstep',
  "Delivered directly to recipient's location",
  'GPS-tracked driver the whole journey',
  'Price agreed upfront, no hidden fees'
];

const STATS = [
  { num: '12+', label: 'Partner Stations' },
  { num: '100%', label: 'OTP-Verified' },
  { num: '24h', label: 'Intercity Delivery' },
  { num: 'GHS 0', label: 'Hidden Fees' }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [trackInput, setTrackInput] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    const clean = trackInput.replace(/[-\s]/g, '').trim().toUpperCase();
    if (clean) navigate(`/track/${clean}`);
  };

  return (
    <div className="lp-page">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <Link to="/" className="tc-logo">
          <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
          <span className="tc-logo-wordmark">Trans<span>cage</span></span>
        </Link>
        <div className="lp-nav-links">
          <Link to="/track" className="lp-nav-link">Track Parcel</Link>
          <Link to="/login" className="lp-nav-link">Sign in</Link>
          <Link to="/register" className="tc-btn tc-btn-primary tc-btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <Shield size={12} /> Ghana's Verified Parcel Network
          </div>
          <h1 className="lp-hero-title">
            Send parcels with<br /><span>verified custody</span>
          </h1>
          <p className="lp-hero-desc">
            Station-to-station intercity delivery and direct home-to-home P2P —
            every handover secured by OTP. Know exactly who has your parcel, always.
          </p>

          {/* Track bar */}
          <form onSubmit={handleTrack} className="lp-track-form">
            <Search size={16} style={{ color: 'rgba(255,255,255,.5)', flexShrink: 0, margin: '0 4px' }} />
            <input
              id="lp-track-input"
              className="lp-track-input"
              type="text"
              placeholder="Enter tracking number to check status…"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
            />
            <button
              id="lp-track-btn"
              type="submit"
              className="tc-btn tc-btn-primary tc-btn-sm"
              disabled={!trackInput.trim()}
            >
              Track
            </button>
          </form>

          <div className="lp-hero-cta-row">
            <Link to="/register" className="tc-btn tc-btn-primary">
              Send a Parcel <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="tc-btn tc-btn-outline" style={{ color: 'rgba(255,255,255,.85)', borderColor: 'rgba(255,255,255,.3)' }}>
              Sign in to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="lp-stats-strip">
        {STATS.map(({ num, label }) => (
          <div key={label} className="lp-stat">
            <span className="lp-stat-num">{num}</span>
            <span className="lp-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-app)' }}>
        <div className="lp-section">
          <div className="lp-section-eyebrow">How It Works</div>
          <h2 className="lp-section-title">From booking to delivery,<br />fully verified</h2>
          <p className="lp-section-subtitle">
            A transparent custody chain at every step — no guesswork, no missing parcels.
          </p>
          <div className="lp-steps-grid">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="lp-step-card">
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Delivery modes ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="lp-section">
          <div className="lp-section-eyebrow">Delivery Options</div>
          <h2 className="lp-section-title">Two ways to send</h2>
          <p className="lp-section-subtitle">
            Choose what fits your timeline and budget.
          </p>
          <div className="lp-modes-grid">
            {/* Station-to-station */}
            <div className="lp-mode-card">
              <div className="lp-mode-header">
                <div className="lp-mode-icon navy"><Building2 size={22} /></div>
                <div className="lp-mode-title">Station-to-Station</div>
                <div className="lp-mode-desc">
                  Drop your parcel at any Transcage partner station.
                  It moves through our verified intercity relay network to the destination station for pickup.
                </div>
              </div>
              <div className="lp-mode-features">
                {STATION_FEATURES.map(f => (
                  <div key={f} className="lp-mode-feature">
                    <div className="lp-mode-dot" style={{ background: 'var(--tc-navy)' }} /> {f}
                  </div>
                ))}
              </div>
            </div>
            {/* P2P */}
            <div className="lp-mode-card">
              <div className="lp-mode-header">
                <div className="lp-mode-icon teal"><Truck size={22} /></div>
                <div className="lp-mode-title">Point-to-Point (P2P)</div>
                <div className="lp-mode-desc">
                  A verified driver picks up from your address and delivers directly
                  to the recipient's door. Best for same-city urgent deliveries.
                </div>
              </div>
              <div className="lp-mode-features">
                {P2P_FEATURES.map(f => (
                  <div key={f} className="lp-mode-feature">
                    <div className="lp-mode-dot" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <h2 className="lp-cta-title">Ready to send your first parcel?</h2>
        <p className="lp-cta-desc">
          Join Transcage today — it only takes 2 minutes to create an account and book a delivery.
        </p>
        <div className="lp-cta-buttons">
          <Link to="/register" className="tc-btn tc-btn-primary ">
            Create Free Account <ArrowRight size={16} />
          </Link>
          <Link to="/track" className="tc-btn tc-btn-outline" style={{ color: 'rgba(255,255,255,.85)', borderColor: 'rgba(255,255,255,.3)' }}>
            <MapPin size={15} /> Track a Parcel
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-text">© 2026 Transcage · Ghana's verified parcel delivery network</div>
          <div className="lp-footer-links">
            <Link to="/track" className="lp-footer-link">Track</Link>
            <Link to="/privacy" className="lp-footer-link">Privacy</Link>
            <Link to="/terms" className="lp-footer-link">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
