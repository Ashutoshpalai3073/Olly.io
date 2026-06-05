import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        'bg-primary':   '#080809',
        'bg-surface':   '#0f0f12',
        'bg-elevated':  '#16161b',
        'bg-hover':     '#1e1e25',
        'bg-active':    '#252530',
        'text-primary':    '#f0f0ee',
        'text-secondary':  '#9090a0',
        'text-tertiary':   '#555560',
        'accent-primary':  '#ff6b35',
        'accent-hover':    '#ff8552',
        'status-green':  '#22c55e',
        'status-yellow': '#f59e0b',
        'status-red':    '#ef4444',
        'status-blue':   '#3b82f6',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      borderColor: {
        subtle:  'rgba(255,255,255,0.06)',
        DEFAULT: 'rgba(255,255,255,0.10)',
        strong:  'rgba(255,255,255,0.18)',
      },
      boxShadow: {
        'surface': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'elevated': '0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)',
        'modal': '0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)',
        'accent': '0 0 0 2px rgba(255,107,53,0.35)',
      },
      animation: {
        'fade-in':   'fadeIn 0.15s ease-out',
        'slide-up':  'slideUp 0.2s ease-out',
        'slide-down':'slideDown 0.2s ease-out',
        'scale-in':  'scaleIn 0.15s ease-out',
        'shimmer':   'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                        to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
} satisfies Config
