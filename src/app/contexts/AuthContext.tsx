import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_EXPIRED_EVENT, ApiError, clearAuthToken, getAuthToken, setAuthToken } from '../services/api';
import { AuthUser, getMe, login as loginRequest } from '../services/authService';

type AuthContextValue = {
  user: AuthUser | null;
  role: AuthUser['role'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionMessage: string;
  clearSessionMessage: () => void;
  login: (email: string, senha: string) => Promise<AuthUser>;
  logout: () => void;
  restoreSession: () => Promise<AuthUser | null>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  const clearSession = useCallback((message = '') => {
    clearAuthToken();
    setToken(null);
    setUser(null);
    setSessionMessage(message);
  }, []);

  const restoreSession = useCallback(async () => {
    const storedToken = getAuthToken();

    if (!storedToken) {
      setToken(null);
      setUser(null);
      return null;
    }

    try {
      const response = await getMe();
      setToken(storedToken);
      setUser(response.user);
      return response.user;
    } catch (error) {
      clearSession(error instanceof ApiError && error.status === 401 ? 'Sua sessão expirou. Entre novamente.' : '');
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    restoreSession().finally(() => setIsLoading(false));
  }, [restoreSession]);

  useEffect(() => {
    const handleExpiredSession = () => {
      clearSession('Sua sessão expirou. Entre novamente.');
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    };
  }, [clearSession]);

  const login = useCallback(async (email: string, senha: string) => {
    const response = await loginRequest(email, senha);
    setAuthToken(response.token);
    setToken(response.token);
    setUser(response.user);
    setSessionMessage('');
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearSession('');
  }, [clearSession]);

  const clearSessionMessage = useCallback(() => setSessionMessage(''), []);

  const refreshUser = restoreSession;
  const role = user?.role || null;
  const isAuthenticated = Boolean(user && token);

  const value = useMemo(
    () => ({ user, role, token, isAuthenticated, isLoading, sessionMessage, clearSessionMessage, login, logout, restoreSession, refreshUser }),
    [user, role, token, isAuthenticated, isLoading, sessionMessage, clearSessionMessage, login, logout, restoreSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
