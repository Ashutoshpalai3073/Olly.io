import React, { useState } from 'react';
import type { Platform } from './PlatformBadge';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  platformIndicator?: Platform;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_PX = { sm: 28, md: 36, lg: 44 } as const;

const INDICATOR_SIZE = { sm: 9, md: 11, lg: 13 } as const;

const PLATFORM_COLORS: Record<Platform, string> = {
  google:      '#4285F4',
  zomato:      '#E23744',
  swiggy:      '#FC8019',
  tripadvisor: '#00AA6C',
};

const PLATFORM_ABBR: Record<Platform, string> = {
  google: 'G', zomato: 'Z', swiggy: 'S', tripadvisor: 'T',
};

const AVATAR_PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e',
  '#f97316','#84cc16','#06b6d4','#3b82f6',
];

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function colorFromName(name?: string) {
  if (!name) return 'var(--bg-active)';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export function Avatar({ src, name, size = 'md', platformIndicator, className = '', style }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const px = SIZE_PX[size];
  const indicatorPx = INDICATOR_SIZE[size];
  const showImg = Boolean(src) && !imgError;

  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}
    >
      <div
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          overflow: 'hidden',
          background: showImg ? 'transparent' : colorFromName(name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'sm' ? 10 : size === 'md' ? 13 : 16,
          fontWeight: 600,
          color: '#fff',
          userSelect: 'none',
          flexShrink: 0,
          border: '1.5px solid var(--border-subtle)',
        }}
      >
        {showImg ? (
          <img
            src={src}
            alt={name ?? 'avatar'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          initials(name)
        )}
      </div>

      {platformIndicator && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: indicatorPx,
            height: indicatorPx,
            borderRadius: '50%',
            background: PLATFORM_COLORS[platformIndicator],
            border: '1.5px solid var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(indicatorPx * 0.55),
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
          }}
        >
          {PLATFORM_ABBR[platformIndicator]}
        </span>
      )}
    </div>
  );
}

export default Avatar;
