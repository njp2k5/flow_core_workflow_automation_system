import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

// Map backend designation to frontend role key
function mapRole(designation) {
  if (!designation) return 'developer';
  const d = designation.toLowerCase();
  if (d === 'manager' || d === 'project manager' || d === 'lead') return 'manager';
  return 'developer';
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

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
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await auth.login(username, password);
    // data: { access_token, token_type, member_name, designation }
    const role = mapRole(data.designation);
    const initials = getInitials(data.member_name || username);
    const userData = {
      name: data.member_name,
      designation: data.designation,
      role,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=6366f1`,
    };
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
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
