import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <div className="p-8 text-gray-500">Checking session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
