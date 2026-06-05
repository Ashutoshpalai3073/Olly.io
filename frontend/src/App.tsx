import { Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/reviews" replace />} />
      <Route
        path="/reviews"
        element={
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontFamily: 'Geist, system-ui, sans-serif',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em' }}>
              Olly
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              AI-powered review response editor
            </span>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/reviews" replace />} />
    </Routes>
  )
}
