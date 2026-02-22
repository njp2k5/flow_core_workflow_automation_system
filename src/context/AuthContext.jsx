import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

// ── Mock users for development (remove when backend is ready) ─────────
const MOCK_USERS = {
  manager: {
    id: 1,
    username: 'manager',
    name: 'Alex Morgan',
    email: 'alex@company.com',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AM&backgroundColor=6366f1',
  },
  developer: {
    id: 2,
    username: 'developer',
    name: 'Sam Rivera',
    email: 'sam@company.com',
    role: 'developer',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SR&backgroundColor=06b6d4',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check persisted session on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Try real backend first
      const data = await auth.login({ username, password });
      const userData = data.user || data;
      localStorage.setItem('token', data.token || '');
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch {
      // Fallback to mock users during development
      const mockUser = MOCK_USERS[username];
      if (mockUser) {
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        return mockUser;
      }
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
