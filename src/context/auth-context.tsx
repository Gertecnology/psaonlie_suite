/* eslint-disable no-console */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginService, AuthResponse, RefreshTokenResponse } from '@/services/auth';
import { useTokenRefresh } from '@/hooks/use-token-refresh';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hook para refresh automático de tokens
  useTokenRefresh({
    onRefreshSuccess: (data: RefreshTokenResponse) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      setIsAuthenticated(true);
    },
    onRefreshError: (error: Error) => {
      console.error('Error en refresh automático:', error);
      // El hook ya maneja la limpieza del localStorage
      setUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
    },
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginService(email, password);
    setUser(data.user);
    setAccessToken(data.accessToken);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
} 