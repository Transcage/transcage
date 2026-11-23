import React from 'react';
import { Construction } from 'lucide-react';

export default function SendParcelPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 14, color: 'var(--text-muted)' }}>
      <Construction size={36} />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tc-navy)' }}>Send a Parcel</h2>
      <p style={{ fontSize: 13 }}>Booking form — Coming in Phase 4</p>
    </div>
  );
}
