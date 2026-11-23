import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, LogOut, Bell, Menu, X,
  CheckCircle2, Truck, Building2, AlertTriangle,
  ArrowRight, Clock, ChevronDown, Eye, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClerkAPI } from '../../api/client';
import TcLoader from '../../components/ui/TcLoader';
import TcEmptyState from '../../components/ui/TcEmptyState';
import '../../styles/layout.css';
import './ClerkDashboard.css';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_META = {
  REQUEST_CREATED:         { label: 'Booking Created',   color: '#D97706', bg: '#FFFBEB' },
  AWAITING_STATION_INTAKE: { label: 'Awaiting Drop-Off', color: '#D97706', bg: '#FFFBEB' },
  AT_ORIGIN_STATION:       { label: 'At Origin Station', color: '#0284C7', bg: '#E0F2FE' },
  DRIVER_ASSIGNED:         { label: 'Driver Assigned',   color: '#0284C7', bg: '#E0F2FE' },
  PICKED_UP_BY_DRIVER:     { label: 'Picked Up',         color: '#0284C7', bg: '#E0F2FE' },
  IN_TRANSIT:              { label: 'In Transit',        color: '#7C3AED', bg: '#EDE9FE' },
  AT_DESTINATION_STATION:  { label: 'At Destination',   color: '#7C3AED', bg: '#EDE9FE' },
  OUT_FOR_DELIVERY:        { label: 'Out for Delivery',  color: '#7C3AED', bg: '#EDE9FE' },
  DELIVERED:               { label: 'Delivered',         color: '#059669', bg: '#D1FAE5' },
  COMPLETED:               { label: 'Completed',         color: '#059669', bg: '#D1FAE5' },
  CANCELLED:               { label: 'Cancelled',         color: '#DC2626', bg: '#FEE2E2' }
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status?.replace(/_/g, ' ') || '—', color: '#64748B', bg: '#F1F5F9' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 999,
      fontSize: 11, fontWeight: 700,
      color: m.color, background: m.bg
    }}>
      {m.label}
    </span>
  );
}

/* ─── Shipment action panel ──────────────────────────────────────────────── */
function ShipmentPanel({ shipment, onClose, onAction }) {
  const [drivers, setDrivers]       = useState([]);
  const [driverId, setDriverId]     = useState('');
  const [otpCode, setOtpCode]       = useState('');
  const [genOtp, setGenOtp]         = useState(null);
  const [busy, setBusy]             = useState(false);
  const [localMsg, setLocalMsg]     = useState('');

  useEffect(() => {
    ClerkAPI.getDrivers().then(r => { if (r.success) setDrivers(r.data || []); });
  }, []);

  const act = async (action, payload = {}) => {
    setBusy(true); setLocalMsg('');
    let res;
    try {
      switch (action) {
        case 'intake':          res = await ClerkAPI.inspectShipment(shipment.id, payload); break;
        case 'assign-driver':   res = await ClerkAPI.assignDriver(shipment.id, payload); break;
        case 'dispatch':        res = await fetch(`/api/v1/clerk/shipments/${shipment.id}/dispatch`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('tc_token')}` }, body: JSON.stringify(payload) }).then(r => r.json()); break;
        case 'receive':         res = await fetch(`/api/v1/clerk/shipments/${shipment.id}/receive`,  { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('tc_token')}` }, body: JSON.stringify(payload) }).then(r => r.json()); break;
        case 'gen-otp':         res = await fetch(`/api/v1/clerk/shipments/${shipment.id}/otp/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('tc_token')}` }, body: JSON.stringify(payload) }).then(r => r.json()); break;
        case 'verify-otp':      res = await fetch(`/api/v1/clerk/shipments/${shipment.id}/otp/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('tc_token')}` }, body: JSON.stringify(payload) }).then(r => r.json()); break;
        default: res = { success: false, message: 'Unknown action' };
      }
      if (res.success) {
        if (action === 'gen-otp') setGenOtp(res.data);
        else { setLocalMsg('✓ ' + res.message); onAction(); }
      } else {
        setLocalMsg('⚠ ' + (res.message || 'Action failed'));
      }
    } catch { setLocalMsg('⚠ Network error'); }
    setBusy(false);
  };

  const s = shipment.status;
  const isS2S = shipment.delivery_model === 'STATION_TO_STATION';

  return (
    <div className="clerk-panel-overlay" onClick={onClose}>
      <div className="clerk-panel" onClick={e => e.stopPropagation()}>
        <div className="clerk-panel-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.07em' }}>Shipment</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tc-navy)', letterSpacing: '0.03em' }}>{shipment.tracking_number}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={s} />
            <button onClick={onClose} className="tc-btn tc-btn-icon tc-btn-ghost" aria-label="Close"><X size={16} /></button>
          </div>
        </div>

        {/* Meta info */}
        <div className="clerk-panel-meta">
          {[
            { label: 'Customer',   value: shipment.customer_name  },
            { label: 'Recipient',  value: shipment.recipient_name },
            { label: 'Phone',      value: shipment.recipient_phone },
            { label: 'Contents',   value: shipment.parcel_description },
            { label: 'Weight',     value: shipment.weight_kg ? `${shipment.weight_kg} kg` : '—' },
            { label: 'Route',      value: isS2S ? `${shipment.origin_station || '—'} → ${shipment.dest_station || '—'}` : (shipment.origin_city && `${shipment.origin_city} → ${shipment.destination_city}`) },
            { label: 'Price',      value: shipment.price ? `GHS ${shipment.price}` : 'Pending' }
          ].filter(i => i.value).map(({ label, value }) => (
            <div key={label} className="clerk-panel-meta-row">
              <span className="clerk-panel-meta-label">{label}</span>
              <span className="clerk-panel-meta-value">{value}</span>
            </div>
          ))}
        </div>

        {localMsg && (
          <div style={{
            padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: 13,
            background: localMsg.startsWith('✓') ? '#D1FAE5' : '#FEE2E2',
            color: localMsg.startsWith('✓') ? '#065F46' : '#991B1B',
            marginBottom: 12
          }}>
            {localMsg}
          </div>
        )}

        {/* ── Actions based on status ──────────────────────────────── */}
        <div className="clerk-panel-actions">

          {/* Intake */}
          {(s === 'REQUEST_CREATED' || s === 'AWAITING_STATION_INTAKE') && (
            <div className="clerk-action-block">
              <div className="clerk-action-title"><Package size={14} /> Record Parcel Intake</div>
              <button className="tc-btn tc-btn-primary tc-btn-full" disabled={busy}
                onClick={() => act('intake', {})}>
                {busy ? 'Processing…' : 'Mark Received at Station'}
              </button>
            </div>
          )}

          {/* Assign driver (P2P) */}
          {s === 'AT_ORIGIN_STATION' && !isS2S && (
            <div className="clerk-action-block">
              <div className="clerk-action-title"><Truck size={14} /> Assign Driver</div>
              <select className="tc-select" value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">— Select available driver —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} · {d.phone}</option>)}
              </select>
              <button className="tc-btn tc-btn-primary tc-btn-full" disabled={busy || !driverId}
                onClick={() => act('assign-driver', { driver_user_id: parseInt(driverId) })}>
                {busy ? 'Assigning…' : 'Assign Driver'}
              </button>
            </div>
          )}

          {/* Dispatch S2S */}
          {s === 'AT_ORIGIN_STATION' && isS2S && (
            <div className="clerk-action-block">
              <div className="clerk-action-title"><Building2 size={14} /> Dispatch Intercity</div>
              <button className="tc-btn tc-btn-primary tc-btn-full" disabled={busy}
                onClick={() => act('dispatch', {})}>
                {busy ? 'Dispatching…' : 'Mark Dispatched (In Transit)'}
              </button>
            </div>
          )}

          {/* Generate OTP for pickup */}
          {(s === 'DRIVER_ASSIGNED' || s === 'AT_ORIGIN_STATION') && (
            <div className="clerk-action-block">
              <div className="clerk-action-title"><CheckCircle2 size={14} /> Pickup OTP</div>
              <button className="tc-btn tc-btn-secondary tc-btn-full" disabled={busy}
                onClick={() => act('gen-otp', { otp_type: 'PICKUP' })}>
                Generate Pickup OTP
              </button>
              {genOtp && genOtp.otp_type === 'PICKUP' && (
                <div className="clerk-otp-display">
                  <span className="clerk-otp-label">OTP Code</span>
                  <span className="clerk-otp-code">{genOtp.otp_code}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="tc-input" placeholder="Enter OTP to verify"
                  value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{ flex: 1 }} />
                <button className="tc-btn tc-btn-primary" disabled={busy || !otpCode}
                  onClick={() => act('verify-otp', { otp_code: otpCode, otp_type: 'PICKUP' })}>
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* Receive at destination station */}
          {s === 'IN_TRANSIT' && isS2S && (
            <div className="clerk-action-block">
              <div className="clerk-action-title"><Building2 size={14} /> Receive at This Station</div>
              <button className="tc-btn tc-btn-primary tc-btn-full" disabled={busy}
                onClick={() => act('receive', {})}>
                {busy ? 'Processing…' : 'Mark Received at Destination'}
              </button>
            </div>
          )}

          {/* Generate OTP for delivery */}
          {(s === 'AT_DESTINATION_STATION' || s === 'OUT_FOR_DELIVERY') && (
            <div className="clerk-action-block">
              <div className="clerk-action-title"><CheckCircle2 size={14} /> Delivery OTP</div>
              <button className="tc-btn tc-btn-secondary tc-btn-full" disabled={busy}
                onClick={() => act('gen-otp', { otp_type: 'DELIVERY' })}>
                Generate Delivery OTP
              </button>
              {genOtp && genOtp.otp_type === 'DELIVERY' && (
                <div className="clerk-otp-display">
                  <span className="clerk-otp-label">OTP Code</span>
                  <span className="clerk-otp-code">{genOtp.otp_code}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="tc-input" placeholder="Enter recipient OTP"
                  value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{ flex: 1 }} />
                <button className="tc-btn tc-btn-primary" disabled={busy || !otpCode}
                  onClick={() => act('verify-otp', { otp_code: otpCode, otp_type: 'DELIVERY' })}>
                  Confirm Delivery
                </button>
              </div>
            </div>
          )}

          {(s === 'DELIVERED' || s === 'COMPLETED') && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-success)' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700 }}>Delivery complete</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────────────────────────── */
export default function ClerkDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [selected, setSelected]     = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = (user?.full_name || 'C').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const res = await ClerkAPI.getQueue();
    if (res.success) setQueue(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const filtered = queue.filter(s => {
    const matchSearch = !search ||
      s.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.recipient_phone?.includes(search);

    const matchFilter = filter === 'all' ? true :
      filter === 'pending'    ? ['REQUEST_CREATED','AWAITING_STATION_INTAKE','AT_ORIGIN_STATION','DRIVER_ASSIGNED'].includes(s.status) :
      filter === 'transit'    ? ['IN_TRANSIT','PICKED_UP_BY_DRIVER'].includes(s.status) :
      filter === 'arrived'    ? ['AT_DESTINATION_STATION','OUT_FOR_DELIVERY'].includes(s.status) : true;

    return matchSearch && matchFilter;
  });

  const counts = {
    all:     queue.length,
    pending: queue.filter(s => ['REQUEST_CREATED','AWAITING_STATION_INTAKE','AT_ORIGIN_STATION','DRIVER_ASSIGNED'].includes(s.status)).length,
    transit: queue.filter(s => ['IN_TRANSIT','PICKED_UP_BY_DRIVER'].includes(s.status)).length,
    arrived: queue.filter(s => ['AT_DESTINATION_STATION','OUT_FOR_DELIVERY'].includes(s.status)).length
  };

  const FILTERS = [
    { key: 'all',     label: 'All Active'   },
    { key: 'pending', label: 'Pending'      },
    { key: 'transit', label: 'In Transit'   },
    { key: 'arrived', label: 'Arrived'      }
  ];

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="tc-logo" onClick={() => navigate('/')}>
            <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
            <span className="tc-logo-wordmark">Trans<span>cage</span></span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <Package size={16} className="nav-icon" />
            <span>Shipment Queue</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--tc-navy-light)' }}>
            <div className="tc-user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Station Clerk</div>
            </div>
            <button className="tc-btn tc-btn-icon tc-btn-ghost" onClick={() => { logout(); navigate('/login'); }} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="app-main">
        <header className="tc-app-header">
          <div className="tc-app-header-left">
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--tc-navy)', margin: 0 }}>Station Queue</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Manage shipments at your station</p>
            </div>
          </div>
          <div className="tc-app-header-right">
            <button className="tc-btn tc-btn-icon tc-btn-ghost" onClick={loadQueue} title="Refresh queue">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <button className="tc-btn tc-btn-icon tc-btn-ghost" aria-label="Notifications"><Bell size={18} /></button>
            <div className="tc-user-chip">
              <div className="tc-user-avatar">{initials}</div>
              <span className="tc-user-name">{user?.full_name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <div className="tc-app-body">
          <div className="tc-app-content">

            {/* Search + filter bar */}
            <div className="clerk-toolbar">
              <div className="clerk-search-wrap">
                <Search size={15} className="clerk-search-icon" />
                <input className="clerk-search-input" type="text" placeholder="Search tracking number, name or phone…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="clerk-filters">
                {FILTERS.map(f => (
                  <button key={f.key}
                    className={`clerk-filter-tab${filter === f.key ? ' active' : ''}`}
                    onClick={() => setFilter(f.key)}>
                    {f.label}
                    <span className="clerk-filter-count">{counts[f.key]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Queue table */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                <TcLoader size="lg" message="Loading queue…" />
              </div>
            ) : filtered.length === 0 ? (
              <TcEmptyState
                icon={Package}
                title={search ? 'No results' : 'Queue is empty'}
                description={search ? 'No shipments match your search.' : 'No active shipments at this station right now.'}
              />
            ) : (
              <div className="clerk-table-wrap">
                <table className="clerk-table">
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Recipient</th>
                      <th>Contents</th>
                      <th>Booked</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} className="clerk-table-row" onClick={() => setSelected(s)}>
                        <td className="clerk-td-track">{s.tracking_number}</td>
                        <td><StatusBadge status={s.status} /></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {s.delivery_model === 'STATION_TO_STATION' ? 'S · S' : 'P2P'}
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.recipient_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.recipient_phone}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.parcel_description || '—'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                          {new Date(s.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <button className="tc-btn tc-btn-secondary tc-btn-sm" onClick={e => { e.stopPropagation(); setSelected(s); }}>
                            <Eye size={13} /> Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Shipment panel ───────────────────────────────────────────────── */}
      {selected && (
        <ShipmentPanel
          shipment={selected}
          onClose={() => setSelected(null)}
          onAction={() => { setSelected(null); loadQueue(); }}
        />
      )}
    </div>
  );
}
