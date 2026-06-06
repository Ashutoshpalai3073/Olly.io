import { IS_DEV_MODE } from '../../lib/devMode'

export function DevModeBanner() {
  if (!IS_DEV_MODE) return null

  return (
    <div
      role="status"
      aria-label="Development mode active"
      style={{
        position:       'fixed',
        bottom:         16,
        right:          16,
        zIndex:         9999,
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '7px 12px',
        borderRadius:   'var(--radius-md)',
        background:     'rgba(255, 107, 53, 0.12)',
        border:         '1px solid rgba(255, 107, 53, 0.35)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow:      '0 2px 12px rgba(0,0,0,0.3)',
        fontSize:       '11px',
        fontWeight:     500,
        color:          'var(--accent-primary)',
        lineHeight:     1.4,
        pointerEvents:  'none',
        userSelect:     'none',
      }}
    >
      {/* Dev indicator dot */}
      <span style={{
        width:        7,
        height:       7,
        borderRadius: '50%',
        background:   'var(--accent-primary)',
        flexShrink:   0,
        boxShadow:    '0 0 0 2px rgba(255,107,53,0.3)',
      }} />

      <span>
        <strong style={{ fontWeight: 700 }}>Dev mode</strong>
        {' · '}
        Using mock data
        {' · '}
        <span style={{ color: 'var(--text-tertiary)' }}>
          Set <code style={{ fontFamily: 'monospace', fontSize: '10px', background: 'rgba(255,107,53,0.1)', padding: '1px 4px', borderRadius: 3 }}>
            VITE_SUPABASE_URL
          </code> to use real data
        </span>
      </span>
    </div>
  )
}
