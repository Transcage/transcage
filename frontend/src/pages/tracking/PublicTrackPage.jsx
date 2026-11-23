import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, AlertCircle, Copy, Check, Package } from 'lucide-react';
import TcBadge from '../../components/ui/TcBadge';
import TcEmptyState from '../../components/ui/TcEmptyState';
import TcLoader from '../../components/ui/TcLoader';
import { useAuth } from '../../context/AuthContext';
import { TrackAPI } from '../../api/client';

const STATUS_VARIANT = {
  REQUEST_CREATED:          'warning',
  AWAITING_STATION_INTAKE:  'warning',
  AT_ORIGIN_STATION:        'info',
  DRIVER_ASSIGNED:          'info',
  PICKED_UP_BY_DRIVER:      'info',
  IN_TRANSIT:               'info',
  AT_DESTINATION_STATION:   'primary',
  OUT_FOR_DELIVERY:         'primary',
  DELIVERED:                'success',
  COMPLETED:                'success',
  CANCELLED:                'danger',
  DISPUTED:                 'danger'
};

export default function PublicTrackPage({ inApp = false }) {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inputCode, setInputCode] = useState(ref || '');
  const [loading, setLoading]     = useState(false);
  const [shipment, setShipment]   = useState(null);
  const [error, setError]         = useState(null);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (user && !inApp) {
      const dest = ref
        ? `/app/track/${encodeURIComponent(ref.replace(/[-\s]/g, '').trim().toUpperCase())}`
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
    else setError(res.message || `${code} not found.`);
    setLoading(false);
  };

  useEffect(() => {
    if (ref?.trim()) { setInputCode(ref.trim()); doLookup(ref.trim()); }
    else { setShipment(null); setError(null); }
  }, [ref]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = inputCode.replace(/[-\s]/g, '').trim().toUpperCase();
    if (!clean) return;
    const base = inApp || user ? '/app/track' : '/track';
    navigate(`${base}/${clean}`);
  };

  const copyToClipboard = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const variant = shipment ? (STATUS_VARIANT[shipment.status] || 'neutral') : 'neutral';

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Top nav — only on public (non-inApp) */}
      {!inApp && (
        <nav style={{
          height: 62, background: '#fff', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 50
        }}>
          <Link to="/" className="tc-logo">
            <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
            <span className="tc-logo-wordmark">Trans<span>cage</span></span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-muted)', padding: '7px 12px' }}>Home</Link>
            <Link to="/register" className="tc-btn tc-btn-primary tc-btn-sm">Get Started <ArrowRight size={13} /></Link>
          </div>
        </nav>
      )}

      <main style={{ flex: 1, maxWidth: 740, margin: '0 auto', width: '100%', padding: '32px 20px' }}>
        {/* Search card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tc-navy)', marginBottom: 4 }}>Track Parcel</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Enter a Transcage tracking number to view live status and custody trail.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              <input
                id="track-input"
                className="tc-input"
                type="text"
                placeholder="e.g. TC26110001"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={{ paddingLeft: 38 }}
                autoFocus={!ref}
              />
            </div>
            <button
              id="track-submit-btn"
              type="submit"
              className="tc-btn tc-btn-primary"
              disabled={loading || !inputCode.trim()}
            >
              {loading ? 'Searching…' : 'Track'}
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <TcLoader size="lg" message="Querying verified ledger…" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <TcEmptyState
            icon={AlertCircle}
            title="Tracking number not found"
            description={error}
            actionLabel="Clear"
            onAction={() => { setError(null); setInputCode(''); }}
          />
        )}

        {/* Empty */}
        {!loading && !error && !shipment && (
          <TcEmptyState
            icon={Package}
            title="Enter a tracking number above"
            description="Every Transcage shipment has a unique tracking number starting with TC."
          />
        )}

        {/* Result */}
        {!loading && shipment && (
          <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--tc-navy)', letterSpacing: '0.03em' }}>
                  {shipment.tracking_number}
                </span>
                <button
                  type="button"
                  className="tc-btn tc-btn-icon tc-btn-secondary"
                  onClick={() => copyToClipboard(shipment.tracking_number)}
                  title="Copy tracking number"
                  style={{ padding: '5px 8px' }}
                >
                  {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <TcBadge variant={variant}>{(shipment.status || '').replace(/_/g, ' ')}</TcBadge>
                <TcBadge variant="neutral">
                  {shipment.delivery_model === 'STATION_TO_STATION' ? 'Station · Station' : 'P2P Direct'}
                </TcBadge>
              </div>
            </div>

            {/* Route */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.07em' }}>From</div>
                <div style={{ fontWeight: 700, color: 'var(--tc-navy)', fontSize: 14 }}>{shipment.origin || '—'}</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.07em' }}>To</div>
                <div style={{ fontWeight: 700, color: 'var(--tc-navy)', fontSize: 14 }}>{shipment.destination || '—'}</div>
              </div>
            </div>

            {/* Meta */}
            {(shipment.description || shipment.weight_kg || shipment.recipient_name) && (
              <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {shipment.recipient_name && (
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.07em' }}>Recipient</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>{shipment.recipient_name}</div>
                  </div>
                )}
                {shipment.description && (
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.07em' }}>Contents</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>{shipment.description}</div>
                  </div>
                )}
                {shipment.weight_kg && (
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.07em' }}>Weight</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>{shipment.weight_kg} kg</div>
                  </div>
                )}
                {shipment.created_at && (
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.07em' }}>Booked</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>
                      {new Date(shipment.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.08em', marginBottom: 16 }}>
                Custody Trail
              </div>
              {shipment.timeline && shipment.timeline.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {shipment.timeline.map((evt, i) => {
                    const isLast = i === shipment.timeline.length - 1;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                        {/* Dot + line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                            background: isLast ? 'var(--tc-teal)' : 'var(--border-strong)',
                            border: isLast ? '2px solid var(--tc-teal-light)' : '2px solid var(--border-subtle)',
                            boxShadow: isLast ? '0 0 0 3px var(--tc-teal-subtle)' : 'none',
                            marginTop: 4, zIndex: 1, transition: 'all 0.2s'
                          }} />
                          {!isLast && <div style={{ width: 2, flex: 1, background: 'var(--border-subtle)', minHeight: 24 }} />}
                        </div>
                        {/* Content */}
                        <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: isLast ? 'var(--tc-navy)' : 'var(--text-main)' }}>
                            {evt.label || (evt.status || '').replace(/_/g, ' ')}
                          </div>
                          {evt.location && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>{evt.location}</div>}
                          {evt.notes   && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>{evt.notes}</div>}
                          <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 3 }}>
                            {new Date(evt.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Shipment booked — awaiting station intake or driver assignment.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {!inApp && (
        <footer style={{ background: 'var(--tc-navy-dark)', padding: '20px 28px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>© 2026 Transcage · From Sender to Recipient</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link to="/privacy" style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>Privacy</Link>
              <Link to="/terms"   style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>Terms</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
