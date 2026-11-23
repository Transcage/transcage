import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Truck, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { CustomerAPI, StationAPI } from '../../api/client';
import TcLoader from '../../components/ui/TcLoader';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  'Electronics & Gadgets', 'Clothing & Fashion', 'Documents',
  'Food & Groceries', 'Pharmaceuticals', 'Jewellery',
  'Books & Stationery', 'Hardware & Tools', 'Other'
];

const STEPS = ['Delivery Type', 'Recipient', 'Parcel Details', 'Review'];

function StepDot({ idx, current, total }) {
  const done   = idx < current;
  const active = idx === current;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: idx < total - 1 ? 1 : 0 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 12,
        background: done ? 'var(--color-success)' : active ? 'var(--tc-teal)' : 'var(--bg-hover)',
        color: done || active ? '#fff' : 'var(--text-subtle)',
        border: `2px solid ${done ? 'var(--color-success)' : active ? 'var(--tc-teal)' : 'var(--border-strong)'}`,
        transition: 'all 0.25s ease'
      }}>
        {done ? <CheckCircle2 size={14} /> : idx + 1}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 600, marginLeft: 6, whiteSpace: 'nowrap',
        color: done ? 'var(--color-success)' : active ? 'var(--tc-teal)' : 'var(--text-subtle)'
      }}>
        {STEPS[idx]}
      </span>
      {idx < total - 1 && (
        <div style={{ flex: 1, height: 2, background: done ? 'var(--color-success)' : 'var(--border-subtle)', margin: '0 10px', transition: 'background 0.3s' }} />
      )}
    </div>
  );
}

function FieldGroup({ label, required, children, hint, error }) {
  return (
    <div className="tc-field-group">
      <label className="tc-label">
        {label}
        {required && <span style={{ color: 'var(--tc-teal)', fontSize: 11 }}> Required</span>}
      </label>
      {children}
      {hint  && <span className="tc-hint">{hint}</span>}
      {error && <span className="tc-error-text">{error}</span>}
    </div>
  );
}

export default function SendParcelPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    delivery_model: '',
    recipient_name: '', recipient_phone: '', recipient_address: '',
    parcel_description: '', parcel_category: '', parcel_weight_kg: '',
    origin_station_id: '', destination_station_id: '',
    origin_city: '', destination_city: ''
  });
  const [stations, setStations]   = useState([]);
  const [loadSt, setLoadSt]       = useState(false);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [done, setDone] = useState(null); // { tracking_number }

  useEffect(() => {
    setLoadSt(true);
    StationAPI.list().then(res => {
      if (res.success && Array.isArray(res.data)) setStations(res.data);
    }).catch(() => {}).finally(() => setLoadSt(false));
  }, []);

  const set = (k) => (e) => {
    setErrors(er => ({ ...er, [k]: '' }));
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  /* ── Validation per step ─────────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!form.delivery_model) errs.delivery_model = 'Please choose a delivery type';
    }
    if (step === 1) {
      if (!form.recipient_name.trim())  errs.recipient_name  = 'Recipient name is required';
      if (!form.recipient_phone.trim()) errs.recipient_phone = 'Recipient phone is required';
      if (form.delivery_model === 'LOCAL_P2P' && !form.recipient_address.trim())
        errs.recipient_address = 'Delivery address is required for P2P';
    }
    if (step === 2) {
      if (!form.parcel_description.trim()) errs.parcel_description = 'Describe what you are sending';
      if (form.delivery_model === 'STATION_TO_STATION') {
        if (!form.origin_station_id)      errs.origin_station_id      = 'Origin station is required';
        if (!form.destination_station_id) errs.destination_station_id = 'Destination station is required';
      } else {
        if (!form.origin_city.trim())      errs.origin_city      = 'Pickup city is required';
        if (!form.destination_city.trim()) errs.destination_city = 'Delivery city is required';
      }
    }
    return errs;
  };

  const next = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(s => s + 1);
  };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setGlobalError('');
    const payload = {
      delivery_model:         form.delivery_model,
      recipient_name:         form.recipient_name,
      recipient_phone:        form.recipient_phone,
      recipient_address:      form.recipient_address || undefined,
      parcel_description:     form.parcel_description,
      parcel_category:        form.parcel_category   || undefined,
      parcel_weight_kg:       form.parcel_weight_kg  ? parseFloat(form.parcel_weight_kg) : undefined,
      origin_station_id:      form.origin_station_id      ? parseInt(form.origin_station_id)      : undefined,
      destination_station_id: form.destination_station_id ? parseInt(form.destination_station_id) : undefined,
      origin_city:            form.origin_city      || undefined,
      destination_city:       form.destination_city || undefined
    };
    const res = await CustomerAPI.createShipment(payload);
    setSubmitting(false);
    if (res.success && res.data) {
      setDone(res.data);
    } else {
      setGlobalError(res.message || 'Could not create shipment. Please try again.');
    }
  };

  /* ── Success screen ──────────────────────────────────────────────────── */
  if (done) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <CheckCircle2 size={36} color="var(--color-success)" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--tc-navy)', marginBottom: 8 }}>
          Shipment Booked!
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Your parcel request has been created. Take note of your tracking number.
        </p>
        <div style={{
          background: 'var(--tc-navy-light)', border: '1px solid rgba(0,32,80,.14)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 28
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.08em', marginBottom: 6 }}>
            Tracking Number
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--tc-navy)' }}>
            {done.tracking_number}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="tc-btn tc-btn-primary" onClick={() => navigate(`/app/track/${done.tracking_number}`)}>
            Track this parcel <ArrowRight size={15} />
          </button>
          <button className="tc-btn tc-btn-secondary" onClick={() => navigate('/app/shipments')}>
            My Shipments
          </button>
        </div>
      </div>
    );
  }

  /* ── Station selector helper ─────────────────────────────────────────── */
  const StationSelect = ({ label, fieldKey, required }) => (
    <FieldGroup label={label} required={required} error={errors[fieldKey]}>
      {loadSt ? (
        <div style={{ padding: 10, color: 'var(--text-muted)', fontSize: 13 }}>Loading stations…</div>
      ) : (
        <select
          className={`tc-select${errors[fieldKey] ? ' tc-input-error' : ''}`}
          value={form[fieldKey]}
          onChange={set(fieldKey)}
        >
          <option value="">— Select a station —</option>
          {stations.map(st => (
            <option key={st.id} value={st.id}>{st.name} · {st.city}</option>
          ))}
        </select>
      )}
    </FieldGroup>
  );

  const isP2P = form.delivery_model === 'LOCAL_P2P';

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tc-navy)' }}>Send a Parcel</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Book a delivery in a few steps
        </p>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: '8px 0' }}>
        {STEPS.map((_, i) => <StepDot key={i} idx={i} current={step} total={STEPS.length} />)}
      </div>

      {/* Card */}
      <div className="card">
        {globalError && (
          <div style={{
            background: 'var(--color-danger-light)', border: '1px solid rgba(239,68,68,.2)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13,
            color: '#991B1B', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <AlertCircle size={15} /> {globalError}
          </div>
        )}

        {/* ── STEP 0: Delivery Type ─────────────────────────────────────── */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tc-navy)', marginBottom: 6 }}>
              How do you want to send?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Choose the delivery model that fits your needs.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                {
                  value: 'STATION_TO_STATION',
                  icon: Building2,
                  label: 'Station · Station',
                  desc: 'Drop at any partner station. Intercity relay via our verified network.'
                },
                {
                  value: 'LOCAL_P2P',
                  icon: Truck,
                  label: 'P2P Direct',
                  desc: "Driver picks up from your door and delivers straight to recipient's address."
                }
              ].map(({ value, icon: Icon, label, desc }) => (
                <div
                  key={value}
                  onClick={() => { setErrors({}); setForm(f => ({ ...f, delivery_model: value })); }}
                  style={{
                    border: `2px solid ${form.delivery_model === value ? 'var(--tc-teal)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 16px',
                    cursor: 'pointer',
                    background: form.delivery_model === value ? 'var(--tc-teal-light)' : '#fff',
                    boxShadow: form.delivery_model === value ? '0 0 0 3px var(--tc-teal-subtle)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', gap: 10
                  }}
                  role="radio"
                  aria-checked={form.delivery_model === value}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setForm(f => ({ ...f, delivery_model: value }))}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: form.delivery_model === value ? 'var(--tc-teal)' : 'var(--tc-navy-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: form.delivery_model === value ? '#fff' : 'var(--tc-navy)',
                    transition: 'all 0.2s'
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--tc-navy)' }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
            {errors.delivery_model && (
              <div style={{ color: 'var(--color-danger)', fontSize: 12.5, marginBottom: 12 }}>
                {errors.delivery_model}
              </div>
            )}

            <button className="tc-btn tc-btn-primary tc-btn-full tc-btn-lg" onClick={next} disabled={!form.delivery_model}>
              Continue <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP 1: Recipient ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tc-navy)', marginBottom: 20 }}>
              Who are you sending to?
            </h2>

            <FieldGroup label="Recipient Full Name" required error={errors.recipient_name}>
              <input id="send-recipient-name" className={`tc-input${errors.recipient_name ? ' tc-input-error' : ''}`}
                type="text" placeholder="e.g. Ama Boateng"
                value={form.recipient_name} onChange={set('recipient_name')} autoFocus />
            </FieldGroup>

            <FieldGroup label="Recipient Phone" required error={errors.recipient_phone}
              hint="The OTP delivery code will be sent to this number">
              <input id="send-recipient-phone" className={`tc-input${errors.recipient_phone ? ' tc-input-error' : ''}`}
                type="tel" placeholder="e.g. 024 000 0000"
                value={form.recipient_phone} onChange={set('recipient_phone')} />
            </FieldGroup>

            {isP2P && (
              <FieldGroup label="Delivery Address" required={isP2P} error={errors.recipient_address}
                hint="Full address where the driver should deliver">
                <textarea id="send-recipient-address" className={`tc-textarea${errors.recipient_address ? ' tc-input-error' : ''}`}
                  rows={3} placeholder="House number, street, city…"
                  value={form.recipient_address} onChange={set('recipient_address')} />
              </FieldGroup>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="tc-btn tc-btn-secondary" onClick={back}><ArrowLeft size={15} /> Back</button>
              <button className="tc-btn tc-btn-primary" style={{ flex: 1 }} onClick={next}>
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Parcel Details ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tc-navy)', marginBottom: 20 }}>
              Parcel details & route
            </h2>

            <FieldGroup label="Parcel Description" required error={errors.parcel_description}
              hint="Brief description of the contents">
              <input id="send-parcel-desc" className={`tc-input${errors.parcel_description ? ' tc-input-error' : ''}`}
                type="text" placeholder="e.g. Laptop, Documents, Clothing"
                value={form.parcel_description} onChange={set('parcel_description')} autoFocus />
            </FieldGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldGroup label="Category">
                <select className="tc-select" value={form.parcel_category} onChange={set('parcel_category')}>
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Approx. Weight (kg)" hint="Leave blank if unknown">
                <input className="tc-input" type="number" min="0" step="0.1"
                  placeholder="e.g. 1.5"
                  value={form.parcel_weight_kg} onChange={set('parcel_weight_kg')} />
              </FieldGroup>
            </div>

            {form.delivery_model === 'STATION_TO_STATION' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <StationSelect label="Origin Station" fieldKey="origin_station_id" required />
                <StationSelect label="Destination Station" fieldKey="destination_station_id" required />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldGroup label="Pickup City" required error={errors.origin_city}>
                  <input className={`tc-input${errors.origin_city ? ' tc-input-error' : ''}`}
                    type="text" placeholder="e.g. Accra"
                    value={form.origin_city} onChange={set('origin_city')} />
                </FieldGroup>
                <FieldGroup label="Destination City" required error={errors.destination_city}>
                  <input className={`tc-input${errors.destination_city ? ' tc-input-error' : ''}`}
                    type="text" placeholder="e.g. Kumasi"
                    value={form.destination_city} onChange={set('destination_city')} />
                </FieldGroup>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="tc-btn tc-btn-secondary" onClick={back}><ArrowLeft size={15} /> Back</button>
              <button className="tc-btn tc-btn-primary" style={{ flex: 1 }} onClick={next}>
                Review & Submit <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tc-navy)', marginBottom: 20 }}>
              Review your booking
            </h2>

            {[
              { label: 'Delivery Type', value: form.delivery_model === 'STATION_TO_STATION' ? 'Station · Station' : 'P2P Direct' },
              { label: 'Recipient', value: `${form.recipient_name} · ${form.recipient_phone}` },
              form.recipient_address && { label: 'Delivery Address', value: form.recipient_address },
              { label: 'Parcel', value: form.parcel_description },
              form.parcel_category && { label: 'Category', value: form.parcel_category },
              form.parcel_weight_kg && { label: 'Weight', value: `${form.parcel_weight_kg} kg` },
              form.delivery_model === 'STATION_TO_STATION'
                ? { label: 'Route', value: `Station ${form.origin_station_id} → Station ${form.destination_station_id}` }
                : { label: 'Route', value: `${form.origin_city} → ${form.destination_city}` }
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', gap: 12
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tc-navy)', textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            <div style={{
              background: 'var(--color-info-light)', border: '1px solid rgba(2,132,199,.2)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              fontSize: 12.5, color: '#075985', marginTop: 16, marginBottom: 20
            }}>
              <Package size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Pricing will be confirmed by the station clerk or driver. You'll receive an SMS notification.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="tc-btn tc-btn-secondary" onClick={back} disabled={submitting}>
                <ArrowLeft size={15} /> Back
              </button>
              <button
                id="send-parcel-submit-btn"
                className="tc-btn tc-btn-primary tc-btn-lg"
                style={{ flex: 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Booking…' : <><span>Confirm & Book</span> <ArrowRight size={15} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
