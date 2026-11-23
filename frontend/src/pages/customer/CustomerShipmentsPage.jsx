import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { CustomerAPI } from '../../api/client';
import TcLoader from '../../components/ui/TcLoader';
import TcEmptyState from '../../components/ui/TcEmptyState';
import TcBadge from '../../components/ui/TcBadge';

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

function ShipmentRow({ shipment }) {
  const variant = STATUS_VARIANT[shipment.status] || 'neutral';
  return (
    <div className="tc-list-row" style={{ flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'var(--tc-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Package size={16} color="var(--tc-teal)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--tc-navy)' }}>{shipment.tracking_number}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {shipment.recipient_name} · {shipment.origin || '—'} → {shipment.destination || '—'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TcBadge variant={variant}>{(shipment.status || '').replace(/_/g, ' ')}</TcBadge>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
          {new Date(shipment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

export default function CustomerShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    CustomerAPI.getShipments().then(res => {
      if (res.success && res.data) {
        setShipments(Array.isArray(res.data) ? res.data : (res.data.items || []));
      } else {
        setError(res.message || 'Could not load shipments');
      }
    }).catch(() => setError('Network error')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tc-navy)' }}>My Shipments</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            All your parcel bookings and delivery history
          </p>
        </div>
        <Link to="/app/send" className="tc-btn tc-btn-primary">
          <Plus size={15} />
          <span>Send a Parcel</span>
        </Link>
      </div>

      {/* Content */}
      {loading && <TcLoader size="md" message="Loading your shipments..." />}
      {!loading && error && (
        <TcEmptyState icon={AlertCircle} title="Could not load shipments" description={error} />
      )}
      {!loading && !error && shipments.length === 0 && (
        <TcEmptyState
          icon={Package}
          title="No shipments yet"
          description="You haven't sent any parcels yet. Start by booking a delivery."
          actionLabel="Send a Parcel"
          onAction={() => window.location.href = '/app/send'}
        />
      )}
      {!loading && !error && shipments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shipments.map(s => <ShipmentRow key={s.id} shipment={s} />)}
        </div>
      )}
    </div>
  );
}
