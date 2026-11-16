import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('zf_user')) || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('zf_token')));

  const persistSession = useCallback((token, nextUser) => {
    if (token) localStorage.setItem('zf_token', token);
    localStorage.setItem('zf_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('zf_token');
    localStorage.removeItem('zf_user');
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('zf_token');
    if (!token) {
      setLoading(false);
    } else {
      api
        .get('/auth/me')
        .then(({ data }) => {
          if (active) persistSession(null, data.user);
        })
        .catch((error) => {
          if (!active) return;
          if (error.response?.status === 401) logout();
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    const onUnauthorized = () => {
      logout();
      setLoading(false);
    };
    window.addEventListener('zf:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('zf:unauthorized', onUnauthorized);
    };
  }, [logout, persistSession]);

  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem('zf_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
