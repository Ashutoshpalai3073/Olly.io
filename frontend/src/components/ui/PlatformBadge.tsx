import React from 'react';

export type Platform = 'google' | 'zomato' | 'swiggy' | 'tripadvisor';

export interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md';
  showName?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PLATFORM_CONFIG: Record<Platform, { name: string; color: string; bg: string; border: string }> = {
  google:      { name: 'Google',      color: '#4285F4', bg: 'rgba(66,133,244,0.10)',  border: 'rgba(66,133,244,0.25)'  },
  zomato:      { name: 'Zomato',      color: '#E23744', bg: 'rgba(226,55,68,0.10)',   border: 'rgba(226,55,68,0.25)'   },
  swiggy:      { name: 'Swiggy',      color: '#FC8019', bg: 'rgba(252,128,25,0.10)',  border: 'rgba(252,128,25,0.25)'  },
  tripadvisor: { name: 'TripAdvisor', color: '#00AA6C', bg: 'rgba(0,170,108,0.10)',   border: 'rgba(0,170,108,0.25)'   },
};

const PLATFORM_ABBR: Record<Platform, string> = {
  google: 'G', zomato: 'Z', swiggy: 'S', tripadvisor: 'T',
};

export function PlatformBadge({
  platform,
  size = 'md',
  showName = true,
  className = '',
  style,
}: PlatformBadgeProps) {
  const cfg = PLATFORM_CONFIG[platform];
  const iconSize = size === 'sm' ? 13 : 15;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: size === 'sm' ? '2px 7px' : '3px 9px',
        borderRadius: '999px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 500,
        color: cfg.color,
        userSelect: 'none',
        ...style,
      }}
    >
      <span
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '50%',
          background: cfg.color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(iconSize * 0.6),
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {PLATFORM_ABBR[platform]}
      </span>
      {showName && cfg.name}
    </span>
  );
}

export default PlatformBadge;
