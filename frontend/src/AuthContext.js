import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await api.me();
      setUser(u);
      setMustChangePassword(!!u.mustChangePassword);
    } catch {
      setUser(null);
      await setToken(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (t) await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signIn = async ({ mobile, password }) => {
    const data = await api.login({ mobile, password });
    await setToken(data.token);
    setUser(data.user);
    setMustChangePassword(!!data.mustChangePassword);
    return data;
  };

  const signOut = async () => {
    await setToken(null);
    setUser(null);
    setMustChangePassword(false);
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        mustChangePassword,
        setMustChangePassword,
        refresh,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
