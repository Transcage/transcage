import React from 'react';
import { Construction } from 'lucide-react';

export default function ClerkDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 14, color: 'var(--text-muted)' }}>
      <Construction size={36} />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tc-navy)' }}>Station Clerk Dashboard</h2>
      <p style={{ fontSize: 13 }}>Coming in Phase 5</p>
    </div>
  );
}
