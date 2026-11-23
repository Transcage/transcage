import React from 'react';

/**
 * TcBadge — status pill
 * variant: 'primary' | 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 */
export default function TcBadge({ variant = 'neutral', children, style }) {
  return (
    <span className={`tc-badge tc-badge-${variant}`} style={style}>
      {children}
    </span>
  );
}
