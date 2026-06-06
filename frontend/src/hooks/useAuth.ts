import { useEffect } from 'react';
import { useAuthStore, useReviewStore, useResponseStore } from '../store';

export interface AuthHookResult {
  user:       ReturnType<typeof useAuthStore>['user'];
  profile:    ReturnType<typeof useAuthStore>['profile'];
  isLoading:  boolean;
  isNewUser:  boolean;
  logout:     () => Promise<void>;
}

export function useAuth(): AuthHookResult {
  const { user, profile, isLoading, initialize, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = async () => {
    await storeLogout();
    // Clear cross-store state on sign-out
    useReviewStore.getState().resetFilters();
    useResponseStore.getState().clearCurrent();
  };

  const isNewUser = (!!user || !!profile) && !profile?.brand_name;

  return { user, profile, isLoading, isNewUser, logout };
}

export default useAuth;
