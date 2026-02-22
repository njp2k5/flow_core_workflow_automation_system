import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Card';

export function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner text="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'manager' ? '/manager' : '/developer'} replace />;
  }
  return children;
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner text="" />;
  if (user) {
    return <Navigate to={user.role === 'manager' ? '/manager' : '/developer'} replace />;
  }
  return children;
}
