import * as React from 'react';
import useAppStore from '@/stores/useAppStore';

const AuthContext = React.createContext(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // hydrate auth from localStorage on mount
  React.useEffect(() => {
    try {
      useAppStore.getState().hydrateAuth();
    } catch {
      // noop
    }
  }, []);

  // Keep provider wrapper for compatibility; hooks will read from Zustand
  return <AuthContext.Provider value={undefined}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const [
    userId,
    username,
    avatar,
    isLoading,
    error,
    login,
    setAuthData,
    loadAvatar,
    logout,
    clearError,
  ] = useAppStore((s) => [
    s.userId,
    s.username,
    s.avatar,
    s.isLoading,
    s.error,
    s.login,
    s.setAuthData,
    s.loadAvatar,
    s.logout,
    s.clearError,
  ]);

  return {
    userId,
    username,
    avatar,
    isLoading,
    error,
    login,
    setAuthData,
    loadAvatar,
    logout,
    clearError,
  };
}
