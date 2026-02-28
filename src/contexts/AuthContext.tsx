import * as React from 'react';
import { login as apiLogin, fetchUserProfile } from '@/lib/api';

interface AuthContextType {
  userId: string | null;
  username: string | null;
  avatar: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setAuthData: (userId: string, username: string, avatar?: string) => void;
  loadAvatar: (userId: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Restore session from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setUserId(data.userId);
        setUsername(data.username);
        setAvatar(data.avatar || null);
      } catch {
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const login = React.useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiLogin(username, password);
      
      // Load avatar from profile
      let userAvatar: string | null = null;
      try {
        const profile = await fetchUserProfile(data.userId);
        userAvatar = profile.avatar || null;
      } catch {
        userAvatar = null;
      }
      
      // Update state
      setUserId(data.userId);
      setUsername(data.username);
      setAvatar(userAvatar);
      
      // Persist to localStorage with avatar
      localStorage.setItem('auth', JSON.stringify({
        userId: data.userId,
        username: data.username,
        avatar: userAvatar
      }));
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    setUserId(null);
    setUsername(null);
    setAvatar(null);
    setError(null);
    localStorage.removeItem('auth');
  }, []);

  const setAuthData = React.useCallback((userId: string, username: string, avatar?: string) => {
    setUserId(userId);
    setUsername(username);
    setAvatar(avatar || null);
    localStorage.setItem('auth', JSON.stringify({
      userId,
      username,
      avatar: avatar || null
    }));
  }, []);

  const loadAvatar = React.useCallback(async (userId: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      const newAvatar = profile.avatar || null;
      setAvatar(newAvatar);
      
      // Update localStorage with new avatar
      const stored = localStorage.getItem('auth');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          localStorage.setItem('auth', JSON.stringify({
            ...data,
            avatar: newAvatar
          }));
        } catch {
          // If parse fails, just ignore
        }
      }
    } catch {
      setAvatar(null);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const value = React.useMemo(
    () => ({
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
    }),
    [userId, username, avatar, isLoading, error, login, setAuthData, loadAvatar, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
