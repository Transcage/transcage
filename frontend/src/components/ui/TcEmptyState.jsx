import React from 'react';
import './TcEmptyState.css';

/* ── 1. Floating Delivery Parcel (Default Empty State) ───────────────────── */
function EmptyParcelsIllustration({ idPrefix = 'ep' }) {
  return (
    <svg className="tc-empty-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={`${idPrefix}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0088B8" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#E6F5FA" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-box`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A2D8" />
          <stop offset="50%" stopColor="#0088B8" />
          <stop offset="100%" stopColor="#006090" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-tape`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B8D4" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Ambient background glow */}
      <ellipse cx="100" cy="95" rx="76" ry="46" fill={`url(#${idPrefix}-glow)`} />

      {/* Dynamic Scaling Ground Shadow */}
      <ellipse cx="100" cy="138" rx="54" ry="8" fill="#002050" opacity="0.2" className="tc-anim-shadow" />

      {/* Floating 3D Parcel Box */}
      <g className="tc-anim-floating">
        {/* Isometric Box Top Flap */}
        <path d="M100 46 L142 66 L100 86 L58 66 Z" fill="#38BDF8" />
        {/* Box Left Side */}
        <path d="M58 66 L100 86 L100 126 L58 106 Z" fill="url(#ep-box)" />
        {/* Box Right Side */}
        <path d="M100 86 L142 66 L142 106 L100 126 Z" fill="#007098" />

        {/* Security Tape Strip (Across center) */}
        <path d="M92 49 L108 57 L108 123 L92 119 Z" fill="url(#ep-tape)" opacity="0.9" />
        <path d="M68 71 L132 71 L132 81 L68 81 Z" fill="url(#ep-tape)" opacity="0.6" />

        {/* Transcage Brand Emblem Tag */}
        <circle cx="100" cy="86" r="10" fill="#002050" />
        <circle cx="100" cy="86" r="8" fill="#0088B8" />
        <path d="M97 86 L100 82 L103 86 L100 90 Z" fill="#FFFFFF" />
      </g>

      {/* Twinkling Sparkles */}
      <g className="tc-anim-sparkle-1">
        <path d="M148 42 Q152 42 152 38 Q152 42 156 42 Q152 42 152 46 Q152 42 148 42 Z" fill="#00B8D4" />
      </g>
      <g className="tc-anim-sparkle-2">
        <path d="M46 54 Q50 54 50 50 Q50 54 54 54 Q50 54 50 58 Q50 54 46 54 Z" fill="#0088B8" />
      </g>
      <g className="tc-anim-sparkle-3">
        <circle cx="156" cy="94" r="3" fill="#10B981" />
      </g>
    </svg>
  );
}

/* ── 2. Delivery Gig Route & Motorbike / Pin ─────────────────────────────── */
function EmptyGigsIllustration({ idPrefix = 'eg' }) {
  return (
    <svg className="tc-empty-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={`${idPrefix}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00B8D4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="90" rx="80" ry="50" fill={`url(#${idPrefix}-glow)`} />
      <ellipse cx="100" cy="136" rx="58" ry="7" fill="#002050" opacity="0.18" className="tc-anim-shadow" />

      {/* Dotted Route Waypoint Line */}
      <path d="M44 116 C60 90 85 125 110 88 C128 60 148 85 160 65" stroke="#0088B8" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" />

      {/* Origin Dot */}
      <circle cx="44" cy="116" r="7" fill="#10B981" />
      <circle cx="44" cy="116" r="4" fill="#FFFFFF" />

      {/* Animated Destination Pin */}
      <g className="tc-anim-floating">
        <path d="M120 46 C111.7 46 105 52.7 105 61 C105 72.5 120 88 120 88 C120 88 135 72.5 135 61 C135 52.7 128.3 46 120 46 Z" fill="#002050" />
        <circle cx="120" cy="60" r="5" fill="#00B8D4" />
      </g>

      {/* Pulse Waves */}
      <circle cx="120" cy="60" r="14" stroke="#0088B8" strokeWidth="1.5" opacity="0.4" className="tc-anim-pulse" />
    </svg>
  );
}

/* ── 3. Radar Query Scanner (Search Empty) ─────────────────────────────────── */
function EmptySearchIllustration({ idPrefix = 'es' }) {
  return (
    <svg className="tc-empty-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="80" r="55" stroke="#E2E8F0" strokeWidth="2" fill="#F8FAFC" />
      <circle cx="100" cy="80" r="38" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />
      <ellipse cx="100" cy="138" rx="46" ry="6" fill="#002050" opacity="0.15" className="tc-anim-shadow" />

      {/* Floating Magnifier Scanner */}
      <g className="tc-anim-floating-slow">
        <circle cx="94" cy="74" r="26" stroke="#002050" strokeWidth="4" fill="rgba(0, 136, 184, 0.12)" />
        <line x1="112" y1="92" x2="134" y2="114" stroke="#002050" strokeWidth="6" strokeLinecap="round" />
        <circle cx="86" cy="66" r="3" fill="#FFFFFF" opacity="0.8" />
        <path d="M84 76 H104" stroke="#0088B8" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      <g className="tc-anim-sparkle-1">
        <polygon points="144,52 147,44 150,52 158,55 150,58 147,66 144,58 136,55" fill="#00B8D4" />
      </g>
    </svg>
  );
}

/* ── 4. Main Component ─────────────────────────────────────────────────────── */
export default function TcEmptyState({
  type = 'empty-parcels', // 'empty-parcels' | 'empty-gigs' | 'empty-search' | 'empty-history'
  title = 'No Parcels to Display',
  description = 'You have not dispatched or received any shipments in this view.',
  actionLabel,
  onAction,
  className = ''
}) {
  const renderGraphic = () => {
    switch (type) {
      case 'empty-gigs':
        return <EmptyGigsIllustration />;
      case 'empty-search':
        return <EmptySearchIllustration />;
      case 'empty-parcels':
      default:
        return <EmptyParcelsIllustration />;
    }
  };

  return (
    <div className={`tc-empty-state animate-fade-in ${className}`}>
      <div className="tc-empty-illustration-wrap">
        {renderGraphic()}
      </div>
      <h3 className="tc-empty-title">{title}</h3>
      {description && <p className="tc-empty-desc">{description}</p>}
      {actionLabel && onAction && (
        <div className="tc-empty-actions">
          <button type="button" className="tc-btn tc-btn-primary tc-btn-sm" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
