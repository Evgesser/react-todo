import * as React from 'react';
import { login as apiLogin } from '@/lib/api';

interface UseAuthReturn {
  // State
  userId: string | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);
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
      } catch {
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const login = React.useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiLogin(username, password);
      setUserId(data.userId);
      setUsername(data.username);
      // Persist to localStorage
      localStorage.setItem('auth', JSON.stringify(data));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    setUserId(null);
    setUsername(null);
    setError(null);
    localStorage.removeItem('auth');
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    userId,
    username,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
}
