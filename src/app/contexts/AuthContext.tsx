import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthToken, getAuthToken, setAuthToken } from '../services/api';
import { AuthUser, getMe, login as loginRequest } from '../services/authService';

type AuthContextValue = {
  user: AuthUser | null;
  role: AuthUser['role'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
      clearAuthToken();
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    restoreSession().finally(() => setIsLoading(false));
  }, [restoreSession]);

  const login = useCallback(async (email: string, senha: string) => {
    const response = await loginRequest(email, senha);
    setAuthToken(response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = restoreSession;
  const role = user?.role || null;
  const isAuthenticated = Boolean(user && token);

  const value = useMemo(
    () => ({ user, role, token, isAuthenticated, isLoading, login, logout, restoreSession, refreshUser }),
    [user, role, token, isAuthenticated, isLoading, login, logout, restoreSession, refreshUser],
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
