import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Shimmer } from '../ui/Shimmer';
import { USE_MOCK_DATA } from '../../lib/mockData';

export interface ProtectedRouteProps {
  children:        React.ReactNode;
  requireProfile?: boolean;
}

export function ProtectedRoute({ children, requireProfile = true }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <FullScreenShimmer />;

  const isAuthenticated = !!user || (USE_MOCK_DATA && !!profile);
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireProfile && !profile?.brand_name) return <Navigate to="/setup" replace />;

  return <>{children}</>;
}

function FullScreenShimmer() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 24,
    }}>
      {/* Sidebar shimmer */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, borderRight: '1px solid var(--border-subtle)' }}>
        <Shimmer height={32} width={80} borderRadius={6} style={{ marginBottom: 8 }} />
        {[...Array(5)].map((_, i) => (
          <Shimmer key={i} height={36} borderRadius={8} />
        ))}
      </div>
      {/* Main content shimmer */}
      <div style={{ marginLeft: 240, padding: 32, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Shimmer height={40} width={280} borderRadius={8} />
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {[...Array(4)].map((_, i) => <Shimmer key={i} height={100} borderRadius={12} style={{ flex: 1 }} />)}
        </div>
        <Shimmer height={300} borderRadius={12} />
      </div>
    </div>
  );
}

export default ProtectedRoute;
