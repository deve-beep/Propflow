import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/resources';
import { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app load, try a silent refresh (httpOnly cookie may still be valid)
  // to restore the session without forcing a re-login on every page reload.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await authService.refresh();
        setAccessToken(data.data.accessToken);
        const me = await authService.getMe();
        setUser(me.data.data.user);
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();

    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const registerCustomer = useCallback(async (payload) => {
    const { data } = await authService.registerCustomer(payload);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const registerCompany = useCallback(async (payload) => {
    const { data } = await authService.registerCompany(payload);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await authService.getMe();
    setUser(data.data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, registerCustomer, registerCompany, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
