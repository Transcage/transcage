import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Package, Truck, Building2,
  ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import './LandingPage.css';

/* ─── Hero Slideshow (from legacy) ──────────────────────────────────────── */
const SLIDES = [
  { src: '/transcage-hero.jpg', alt: 'Transcage Local P2P Delivery Ghana - Verified Courier Handover' },
  { src: '/transcage-station.jpg', alt: 'Transcage Station-to-Station Coach Service - Terminal Scanning' }
];

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => { setCurrent(c => (c + 1) % SLIDES.length); }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = (dir) => setCurrent(c => (c + dir + SLIDES.length) % SLIDES.length);

  return (
    <div className="lp-slideshow">
      <img src={SLIDES[current].src} alt={SLIDES[current].alt} className="lp-slide-img" />
      <button className="lp-slide-btn lp-slide-btn-prev" onClick={() => slide(-1)} aria-label="Previous slide">
        <ChevronLeft size={18} />
      </button>
      <button className="lp-slide-btn lp-slide-btn-next" onClick={() => slide(1)} aria-label="Next slide">
        <ChevronRight size={18} />
      </button>
      <div className="lp-slide-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={`lp-slide-dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

/* ─── Below-fold data ────────────────────────────────────────────────────── */
const EXTRA_STEPS = [
  { num: '01', title: 'Book Your Shipment', desc: "Tell us what you're sending, where from, and where to. Choose station drop-off or home pickup." },
  { num: '02', title: 'Drop at Station / Driver Collects', desc: 'Drop your item at the nearest partner station, or a verified driver picks up from your location.' },
  { num: '03', title: 'OTP Handover at Every Point', desc: 'Every custody transfer requires a one-time code. Your parcel never disappears.' },
  { num: '04', title: 'Real-time Tracking', desc: "Track your parcel's exact status and custody chain live. Know who has it at every moment." }
];

const STATION_FEATURES = [
  'Drop-off at any partner station near you',
  'Intercity relay between station network',
  'OTP-secured station-to-station handover',
  'Lower rates for non-urgent parcels'
];

const P2P_FEATURES = [
  "Driver picks up from your doorstep",
  "Delivered directly to recipient's location",
  'GPS-tracked driver the whole journey',
  'Price agreed upfront, no hidden fees'
];

const STATS = [
  { num: '12+', label: 'Partner Stations' },
  { num: '100%', label: 'OTP-Verified' },
  { num: '24h', label: 'Intercity SLA' },
  { num: 'GHS 0', label: 'Hidden Fees' }
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState('');
  const [activeTab, setActiveTab] = useState('hero');

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const clean = trackingCode.replace(/[-\s]/g, '').trim().toUpperCase();
    if (clean) navigate(`/track/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="landing-root">
      {/* ── Navbar — legacy structure + Sign In & Get Started ─────────── */}
      <nav className="lp-nav">
        <Link to="/" className="tc-logo">
          <img src="/transcage_logo.png" alt="Transcage Logo" className="tc-logo-img" />
          <span className="tc-logo-wordmark">Trans<span>cage</span></span>
        </Link>

        <ul className="lp-nav-links">
          <li>
            <button type="button"
              className={`lp-nav-link-btn ${activeTab === 'hero' ? 'active' : ''}`}
              onClick={() => setActiveTab('hero')}>
              Overview
            </button>
          </li>
          <li>
            <button type="button"
              className={`lp-nav-link-btn ${activeTab === 'how' ? 'active' : ''}`}
              onClick={() => setActiveTab('how')}>
              How It Works
            </button>
          </li>
          <li>
            <Link to="/track" className="lp-nav-link-btn">Track Parcel</Link>
          </li>
        </ul>

        {/* Sign In + Get Started — added per user request */}
        <div className="lp-nav-cta">
          <Link to="/login" className="lp-nav-link-btn">Sign in</Link>
          <Link to="/register" className="tc-btn tc-btn-primary tc-btn-sm">
            <span>Get Started</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Main body — legacy hero at top ────────────────────────────── */}
      <div className="lp-body">
        <section className="lp-hero">
          {/* Left Hero Content (legacy exact) */}
          <div className="lp-hero-left">
            <div className="lp-hero-content-wrap animate-fade-in">
              <div className="lp-hero-tag">
                <span className="lp-hero-tag-pulse" />
                <span>Ghana's Unified Parcel Network</span>
              </div>

              {activeTab === 'hero' ? (
                <>
                  <h1 className="lp-hero-heading">
                    Fast, Verified Parcel Delivery &amp; Tracking <span>Across Ghana</span>
                  </h1>

                  <p className="lp-hero-sub">
                    Direct local motorbike delivery and intercity station-to-station coach logistics running on one engine.
                    Secured by cryptographic 6-digit OTP verification at every handover.
                  </p>

                  {/* Waybill Search Box */}
                  <form onSubmit={handleTrackSubmit} className="lp-track-box">
                    <Search size={18} color="var(--tc-teal)" style={{ marginLeft: 8 }} />
                    <input
                      id="lp-track-input"
                      type="text"
                      className="lp-track-input"
                      placeholder="Enter Tracking Number (e.g. TC2411901)"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                    />
                    <button id="lp-track-btn" type="submit" className="tc-btn tc-btn-primary tc-btn-sm">
                      Track Now
                    </button>
                  </form>

                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                    <Link to="/register" className="tc-btn tc-btn-navy">
                      <span>Book a Delivery</span>
                      <ArrowRight size={15} />
                    </Link>
                    <button type="button" className="tc-btn tc-btn-secondary" onClick={() => setActiveTab('how')}>
                      See How It Works
                    </button>
                  </div>
                </>
              ) : (
                /* How It Works tab */
                <div className="lp-how-container animate-fade-in">
                  <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--tc-navy)' }}>
                    How Transcage Delivers <span style={{ color: 'var(--tc-teal)' }}>In 3 Steps</span>
                  </h2>

                  <div className="lp-how-steps">
                    <div className="lp-how-step-card">
                      <span className="lp-how-step-num">STEP 1</span>
                      <div className="lp-how-step-title">Instant Quote &amp; Booking</div>
                      <div className="lp-how-step-desc">
                        Choose same-city P2P or terminal-to-terminal. See exact transparent pricing based on distance and weight.
                      </div>
                    </div>

                    <div className="lp-how-step-card">
                      <span className="lp-how-step-num">STEP 2</span>
                      <div className="lp-how-step-title">Verified Custody Handover</div>
                      <div className="lp-how-step-desc">
                        Driver or station clerk verifies pickup with your secure 6-digit OTP. Custody is recorded in the immutable audit log.
                      </div>
                    </div>

                    <div className="lp-how-step-card">
                      <span className="lp-how-step-num">STEP 3</span>
                      <div>
                        <div className="lp-how-step-title">Live GPS Tracking &amp; Recipient Release</div>
                        <div className="lp-how-step-desc">
                          Watch the courier live on the map. Recipient verifies collection with their recipient OTP. Funds settle instantly.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button type="button" className="tc-btn tc-btn-outline tc-btn-sm" onClick={() => setActiveTab('hero')}>
                      ← Back to Overview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Hero Slideshow (legacy exact) */}
          <div className="lp-hero-right">
            <HeroSlideshow />
          </div>
        </section>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <div className="lp-stats-strip">
        {STATS.map(({ num, label }) => (
          <div key={label} className="lp-stat">
            <span className="lp-stat-num">{num}</span>
            <span className="lp-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Extended: Full How It Works cards ───────────────────────────── */}
      <div className="lp-extra-section-bg">
        <div className="lp-extra-section">
          <div className="lp-section-eyebrow">Every Step, Verified</div>
          <h2 className="lp-section-title">From booking to delivery,<br />fully verified</h2>
          <p className="lp-section-subtitle">
            A transparent custody chain at every step — no guesswork, no missing parcels.
          </p>
          <div className="lp-extra-steps-grid">
            {EXTRA_STEPS.map(({ num, title, desc }) => (
              <div key={num} className="lp-extra-step-card">
                <div className="lp-extra-step-num">{num}</div>
                <div className="lp-extra-step-title">{title}</div>
                <div className="lp-extra-step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Delivery modes ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="lp-extra-section">
          <div className="lp-section-eyebrow">Delivery Options</div>
          <h2 className="lp-section-title">Two ways to send</h2>
          <p className="lp-section-subtitle">Choose what fits your timeline and budget.</p>
          <div className="lp-modes-grid">
            <div className="lp-mode-card">
              <div className="lp-mode-header">
                <div className="lp-mode-icon navy"><Building2 size={22} /></div>
                <div className="lp-mode-title">Station-to-Station</div>
                <div className="lp-mode-desc">
                  Drop your parcel at any Transcage partner station. It moves through our verified intercity relay network to the destination station for pickup.
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

            <div className="lp-mode-card">
              <div className="lp-mode-header">
                <div className="lp-mode-icon teal"><Truck size={22} /></div>
                <div className="lp-mode-title">Point-to-Point (P2P)</div>
                <div className="lp-mode-desc">
                  A verified driver picks up from your address and delivers directly to the recipient's door. Best for same-city urgent deliveries.
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

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <h2 className="lp-cta-title">Ready to send your first parcel?</h2>
        <p className="lp-cta-desc">
          Join Transcage today — it only takes 2 minutes to create an account and book a delivery.
        </p>
        <div className="lp-cta-buttons">
          <Link to="/register" className="tc-btn tc-btn-primary">
            Get Started Free <ArrowRight size={16} />
          </Link>
          <Link to="/login" style={{ color: 'rgba(255,255,255,.85)', borderColor: 'rgba(255,255,255,.3)' }}
            className="tc-btn tc-btn-outline">
            Sign in to Dashboard
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div>© 2026 Transcage · From Sender to Recipient</div>
          <div className="lp-footer-right">
            <Link to="/privacy" className="lp-footer-link">Privacy</Link>
            <Link to="/terms" className="lp-footer-link">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
