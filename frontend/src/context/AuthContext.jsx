import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [activeRole, setActiveRole]   = useState(null);
  const [roles, setRoles]             = useState([]);
  const [loading, setLoading]         = useState(true); // initial boot check
  const [authError, setAuthError]     = useState(null);

  const isAuthenticated = !!user;

  // Boot: restore session from token
  useEffect(() => {
    const token = localStorage.getItem('tc_token');
    if (!token) { setLoading(false); return; }

    AuthAPI.me().then(res => {
      if (res.success && res.data) {
        setUser(res.data);
        setActiveRole(res.data.active_role);
      } else {
        localStorage.removeItem('tc_token');
      }
    }).catch(() => {
      localStorage.removeItem('tc_token');
    }).finally(() => setLoading(false));
  }, []);

  const loginWithCredentials = useCallback(async (identifier, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await AuthAPI.login({ identifier, password });
      if (res.success && res.data) {
        localStorage.setItem('tc_token', res.data.token);
        setUser(res.data);
        setActiveRole(res.data.active_role);
        setRoles(res.data.roles || [res.data.active_role]);
        return { success: true, role: res.data.active_role };
      } else {
        setAuthError(res.message || 'Login failed');
        return { success: false };
      }
    } catch {
      setAuthError('Network error. Please try again.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const registerUser = useCallback(async (formData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await AuthAPI.register(formData);
      if (res.success && res.data) {
        localStorage.setItem('tc_token', res.data.token);
        setUser(res.data);
        setActiveRole(res.data.role);
        setRoles([res.data.role]);
        return { success: true, role: res.data.role };
      } else {
        setAuthError(res.message || 'Registration failed');
        return { success: false };
      }
    } catch {
      setAuthError('Network error. Please try again.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tc_token');
    setUser(null);
    setActiveRole(null);
    setRoles([]);
  }, []);

  const switchRole = useCallback((role) => {
    if (roles.includes(role)) setActiveRole(role);
  }, [roles]);

  return (
    <AuthContext.Provider value={{
      user, activeRole, roles, isAuthenticated,
      loading, authError, setAuthError,
      loginWithCredentials, registerUser, logout, switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
