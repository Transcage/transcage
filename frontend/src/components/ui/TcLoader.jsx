import React, { useState, useEffect, useRef } from 'react';
import './TcLoader.css';

/**
 * Normalizes duration to milliseconds.
 * If <= 60, treats value as seconds (e.g. 2 -> 2000ms).
 */
export function normalizeMinDuration(duration) {
  if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) return 0;
  return duration <= 60 ? Math.round(duration * 1000) : Math.round(duration);
}

/**
 * Custom React Hook to enforce a minimum display duration for loading states.
 * Guarantees that even if an API call finishes in 50ms, the loader stays
 * visible for at least minDuration (e.g. 1.5s or 2s) to prevent jarring UI flickers.
 */
export function useTcLoader(isLoading, options = 1500) {
  const minMs = normalizeMinDuration(
    typeof options === 'number' ? options : options?.minDuration ?? 1500
  );
  const onFinish = typeof options === 'object' ? options?.onFinish : undefined;

  const [visible, setVisible] = useState(Boolean(isLoading));
  const startTimeRef = useRef(isLoading ? Date.now() : null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = Date.now();
      setVisible(true);
    } else {
      if (!startTimeRef.current) {
        setVisible(false);
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = minMs - elapsed;

      if (remaining > 0) {
        timerRef.current = setTimeout(() => {
          setVisible(false);
          startTimeRef.current = null;
          onFinish?.();
        }, remaining);
      } else {
        setVisible(false);
        startTimeRef.current = null;
        onFinish?.();
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, minMs, onFinish]);

  return { visible };
}

/**
 * Dedicated Transcage Kinetic Animated Loader
 */
export default function TcLoader({
  active = true,
  minDuration = 0,
  text = 'Processing...',
  subtext,
  fullscreen = false,
  backdrop = 'blur', // 'blur' | 'dim'
  className = '',
  children
}) {
  const { visible } = useTcLoader(active, minDuration);

  if (!visible) {
    return children || null;
  }

  const content = (
    <div className={`tc-loader-container ${className}`}>
      <div className="tc-loader-stage">
        {/* Kinetic Dual Orbit Rings */}
        <div className="tc-loader-orbit-ring" />
        <div className="tc-loader-orbit-pulse" />

        {/* Floating Transcage Parcel Icon */}
        <svg className="tc-loader-parcel-box" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6 L32 13 L20 20 L8 13 Z" fill="#00B8D4" />
          <path d="M8 13 L20 20 L20 33 L8 26 Z" fill="#0088B8" />
          <path d="M20 20 L32 13 L32 26 L20 33 Z" fill="#002050" />
          <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
        </svg>
      </div>

      {text && (
        <div className="tc-loader-text">
          <span>{text}</span>
          <span className="tc-loader-dots">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}

      {subtext && <div className="tc-loader-subtext">{subtext}</div>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className={`tc-loader-fullscreen tc-loader-backdrop-${backdrop}`}>
        <div className="tc-loader-card">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
