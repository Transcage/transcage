import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Package, Copy, Check,
  MapPin, Clock, ShieldCheck, Truck, Building2,
  AlertTriangle, CheckCircle2, Circle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TrackAPI } from '../../api/client';
import TcLoader from '../../components/ui/TcLoader';
import './TrackPage.css';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_META = {
  REQUEST_CREATED:        { label: 'Booking Created',         color: '#D97706', bg: '#FFFBEB', icon: Package   },
  AWAITING_STATION_INTAKE:{ label: 'Awaiting Drop-Off',       color: '#D97706', bg: '#FFFBEB', icon: Clock     },
  AT_ORIGIN_STATION:      { label: 'At Origin Station',       color: '#0284C7', bg: '#E0F2FE', icon: Building2 },
  DRIVER_ASSIGNED:        { label: 'Driver Assigned',         color: '#0284C7', bg: '#E0F2FE', icon: Truck     },
  PICKED_UP_BY_DRIVER:    { label: 'Picked Up',               color: '#0284C7', bg: '#E0F2FE', icon: Truck     },
  IN_TRANSIT:             { label: 'In Transit',              color: '#0284C7', bg: '#E0F2FE', icon: Truck     },
  AT_DESTINATION_STATION: { label: 'Arrived at Destination',  color: '#6D28D9', bg: '#EDE9FE', icon: Building2 },
  OUT_FOR_DELIVERY:       { label: 'Out for Delivery',        color: '#6D28D9', bg: '#EDE9FE', icon: Truck     },
  DELIVERED:              { label: 'Delivered',               color: '#059669', bg: '#D1FAE5', icon: CheckCircle2 },
  COMPLETED:              { label: 'Completed',               color: '#059669', bg: '#D1FAE5', icon: ShieldCheck  },
  CANCELLED:              { label: 'Cancelled',               color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle },
  DISPUTED:               { label: 'Disputed',                color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle }
};

function fmt(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function fmtShort(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status?.replace(/_/g, ' ') || 'Unknown', color: '#64748B', bg: '#F1F5F9', icon: Circle };
  const Icon = meta.icon;
  return (
    <span className="tp-status-badge" style={{ color: meta.color, background: meta.bg }}>
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */
const PROGRESS_STEPS = [
  'REQUEST_CREATED', 'AT_ORIGIN_STATION', 'IN_TRANSIT',
  'AT_DESTINATION_STATION', 'DELIVERED'
];
function ProgressBar({ status }) {
  const idx = PROGRESS_STEPS.indexOf(status);
  const pct  = idx < 0 ? 0 : Math.round((idx / (PROGRESS_STEPS.length - 1)) * 100);
  const done  = status === 'DELIVERED' || status === 'COMPLETED';
  const red   = status === 'CANCELLED' || status === 'DISPUTED';
  return (
    <div className="tp-progress-wrap">
      <div className="tp-progress-bar">
        <div className="tp-progress-fill"
          style={{ width: `${red ? 100 : pct}%`, background: red ? '#EF4444' : done ? '#10B981' : 'var(--tc-teal)' }} />
      </div>
      <div className="tp-progress-labels">
        {['Booked', 'At Station', 'In Transit', 'Arrived', 'Delivered'].map((l, i) => (
          <span key={l} className={`tp-progress-label${i <= idx || done ? ' done' : ''}`}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Timeline event ─────────────────────────────────────────────────────── */
function TimelineEvent({ evt, isLatest, isLast }) {
  const meta = STATUS_META[evt.status] || { color: '#94A3B8', bg: '#F8FAFC', icon: Circle };
  const Icon = meta.icon;
  return (
    <div className={`tp-timeline-event${isLatest ? ' latest' : ''}`}>
      <div className="tp-timeline-left">
        <div className="tp-timeline-dot" style={{
          borderColor: isLatest ? meta.color : '#CBD5E1',
          background:  isLatest ? meta.color : '#F1F5F9',
          boxShadow:   isLatest ? `0 0 0 4px ${meta.bg}` : 'none'
        }}>
          <Icon size={10} color={isLatest ? '#fff' : '#94A3B8'} />
        </div>
        {!isLast && <div className="tp-timeline-line" />}
      </div>
      <div className="tp-timeline-body">
        <div className="tp-timeline-title" style={{ color: isLatest ? '#0F172A' : '#475569' }}>
          {evt.label || (evt.status || '').replace(/_/g, ' ')}
        </div>
        {evt.location && (
          <div className="tp-timeline-sub">
            <MapPin size={11} /> {evt.location}
          </div>
        )}
        {evt.notes && <div className="tp-timeline-sub" style={{ marginTop: 2 }}>{evt.notes}</div>}
        <div className="tp-timeline-time">{fmtShort(evt.timestamp)}</div>
      </div>
    </div>
  );
}

/* ─── Meta row ───────────────────────────────────────────────────────────── */
function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="tp-meta-item">
      <div className="tp-meta-label">{label}</div>
      <div className="tp-meta-value">{value}</div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function PublicTrackPage({ inApp = false }) {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [inputCode, setInputCode] = useState(ref || '');
  const [loading, setLoading]     = useState(false);
  const [shipment, setShipment]   = useState(null);
  const [error, setError]         = useState(null);
  const [copied, setCopied]       = useState(false);

  /* Redirect logged-in users from public /track to /app/track */
  useEffect(() => {
    if (user && !inApp) {
      const dest = ref
        ? `/app/track/${encodeURIComponent(ref.replace(/[-\s]/g,'').trim().toUpperCase())}`
        : '/app/track';
      navigate(dest, { replace: true });
    }
  }, [user, inApp, ref, navigate]);

  const doLookup = async (raw) => {
    const code = (raw || '').replace(/[-\s]/g, '').trim().toUpperCase();
    if (!code) return;
    setLoading(true); setError(null); setShipment(null);
    const res = await TrackAPI.lookup(code);
    if (res.success && res.data) setShipment(res.data);
    else setError(res.message || `No shipment found for "${code}".`);
    setLoading(false);
  };

  useEffect(() => {
    if (ref?.trim()) { setInputCode(ref.trim()); doLookup(ref.trim()); }
    else             { setShipment(null); setError(null); }
  }, [ref]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = inputCode.replace(/[-\s]/g, '').trim().toUpperCase();
    if (!clean) return;
    const base = inApp || user ? '/app/track' : '/track';
    navigate(`${base}/${clean}`);
  };

  const copy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tp-root">
      {/* ── Navbar (public only) ──────────────────────────────────────── */}
      {!inApp && (
        <nav className="tp-nav">
          <Link to="/" className="tc-logo">
            <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
            <span className="tc-logo-wordmark">Trans<span>cage</span></span>
          </Link>
          <div className="tp-nav-right">
            <Link to="/" className="tp-nav-link">Home</Link>
            <Link to="/login"    className="tp-nav-link">Sign in</Link>
            <Link to="/register" className="tc-btn tc-btn-primary tc-btn-sm">
              Get Started <ArrowRight size={13} />
            </Link>
          </div>
        </nav>
      )}

      {/* ── Hero search area ─────────────────────────────────────────── */}
      {!inApp && (
        <div className="tp-hero">
          <div className="tp-hero-inner">
            <div className="tp-hero-eyebrow">
              <ShieldCheck size={13} /> OTP-Verified Tracking
            </div>
            <h1 className="tp-hero-title">
              Track your <span>Transcage</span> parcel
            </h1>
            <p className="tp-hero-sub">
              Real-time custody trail — know exactly where your parcel is and who has it.
            </p>
            <form onSubmit={handleSubmit} className="tp-hero-search">
              <div className="tp-hero-search-inner">
                <Search size={18} className="tp-hero-search-icon" />
                <input
                  id="track-input-hero"
                  type="text"
                  className="tp-hero-input"
                  placeholder="Enter tracking number e.g. TC26110001"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  autoFocus={!ref}
                />
                <button
                  id="track-submit-hero"
                  type="submit"
                  className="tc-btn tc-btn-primary"
                  disabled={loading || !inputCode.trim()}
                >
                  {loading ? 'Searching…' : 'Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app: compact search bar */}
      {inApp && (
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tc-navy)', marginBottom: 4 }}>Track a Parcel</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Enter a Transcage tracking number to view live status and custody trail.
          </p>
          <form onSubmit={handleSubmit} className="tp-inapp-search">
            <Search size={16} className="tp-inapp-search-icon" />
            <input id="track-input-inapp" type="text" className="tp-inapp-input"
              placeholder="e.g. TC26110001"
              value={inputCode} onChange={(e) => setInputCode(e.target.value)} autoFocus={!ref} />
            <button id="track-submit-inapp" type="submit" className="tc-btn tc-btn-primary"
              disabled={loading || !inputCode.trim()}>
              {loading ? 'Searching…' : 'Track'}
            </button>
          </form>
        </div>
      )}

      {/* ── Results area ─────────────────────────────────────────────── */}
      <div className={inApp ? 'tp-results-inapp' : 'tp-results'}>

        {/* Loading */}
        {loading && (
          <div className="tp-loading-wrap">
            <TcLoader size="lg" message="Querying verified ledger…" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="tp-error-card animate-fade-in">
            <div className="tp-error-icon-wrap">
              <AlertTriangle size={28} color="#EF4444" />
            </div>
            <h2 className="tp-error-title">Not Found</h2>
            <p className="tp-error-desc">{error}</p>
            <button className="tc-btn tc-btn-secondary"
              onClick={() => { setError(null); setInputCode(''); navigate(inApp ? '/app/track' : '/track'); }}>
              Clear &amp; Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !shipment && (
          <div className="tp-empty animate-fade-in">
            <div className="tp-empty-icon">
              <Package size={36} color="var(--tc-teal)" />
            </div>
            <p className="tp-empty-text">
              Every Transcage shipment has a unique tracking number starting with <strong>TC</strong>.
              Enter it above to see the full verified custody trail.
            </p>
            {!inApp && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="tc-btn tc-btn-primary">
                  Book a Delivery <ArrowRight size={14} />
                </Link>
                <Link to="/" className="tc-btn tc-btn-secondary">Back to Home</Link>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {!loading && shipment && (
          <div className="tp-result animate-fade-in">

            {/* ── Result header card ──────────────────────────────────── */}
            <div className="tp-result-header-card">
              <div className="tp-result-header-top">
                <div className="tp-tracking-num-row">
                  <span className="tp-tracking-num">{shipment.tracking_number}</span>
                  <button className="tp-copy-btn" onClick={() => copy(shipment.tracking_number)}
                    title="Copy tracking number" aria-label="Copy tracking number">
                    {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <StatusBadge status={shipment.status} />
              </div>

              {/* Route strip */}
              <div className="tp-route-strip">
                <div className="tp-route-point">
                  <div className="tp-route-label">From</div>
                  <div className="tp-route-city">{shipment.origin || '—'}</div>
                </div>
                <div className="tp-route-line">
                  <div className="tp-route-line-inner" />
                  <ChevronRight size={16} style={{ color: 'var(--tc-teal)', flexShrink: 0 }} />
                </div>
                <div className="tp-route-point">
                  <div className="tp-route-label">To</div>
                  <div className="tp-route-city">{shipment.destination || '—'}</div>
                </div>
                <div className="tp-route-mode">
                  {shipment.delivery_model === 'STATION_TO_STATION' ? (
                    <><Building2 size={12} /> Station · Station</>
                  ) : (
                    <><Truck size={12} /> P2P Direct</>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <ProgressBar status={shipment.status} />
            </div>

            {/* ── Two-column detail ───────────────────────────────────── */}
            <div className="tp-detail-cols">

              {/* Meta card */}
              <div className="tp-meta-card">
                <div className="tp-card-heading">Shipment Details</div>
                <div className="tp-meta-grid">
                  <MetaItem label="Recipient"  value={shipment.recipient_name} />
                  <MetaItem label="Contents"   value={shipment.description}   />
                  <MetaItem label="Category"   value={shipment.category}      />
                  <MetaItem label="Weight"     value={shipment.weight_kg ? `${shipment.weight_kg} kg` : null} />
                  <MetaItem label="Booked"     value={fmt(shipment.created_at)} />
                  <MetaItem label="Est. Price" value={shipment.price_estimate ? `GHS ${shipment.price_estimate}` : 'Pending'} />
                </div>
              </div>

              {/* Timeline card */}
              <div className="tp-timeline-card">
                <div className="tp-card-heading">Custody Trail</div>
                {shipment.timeline && shipment.timeline.length > 0 ? (
                  <div className="tp-timeline">
                    {shipment.timeline.map((evt, i) => (
                      <TimelineEvent
                        key={i}
                        evt={evt}
                        isLatest={i === 0}
                        isLast={i === shipment.timeline.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="tp-timeline-empty">
                    <Clock size={18} color="var(--text-subtle)" style={{ marginBottom: 8 }} />
                    <p>Shipment booked — awaiting station intake or driver assignment.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Footer (public only) ─────────────────────────────────────────── */}
      {!inApp && (
        <footer className="tp-footer">
          <span>© 2026 Transcage · From Sender to Recipient</span>
          <div className="tp-footer-links">
            <Link to="/privacy" className="tp-footer-link">Privacy</Link>
            <Link to="/terms"   className="tp-footer-link">Terms</Link>
          </div>
        </footer>
      )}
    </div>
  );
}
