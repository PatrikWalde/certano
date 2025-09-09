import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/login' 
}) => {
  const { user, loading, isAdmin } = useAuth();
  const lastDebugState = useRef<string>('');

  // Debug logging - nur bei Änderungen
  useEffect(() => {
    const currentState = JSON.stringify({ requireAdmin, user: !!user, loading, isAdmin, userEmail: user?.email });
    
    if (currentState !== lastDebugState.current) {
      console.log('ProtectedRoute Debug:', { 
        requireAdmin, 
        user: !!user, 
        loading, 
        isAdmin,
        userEmail: user?.email 
      });
      lastDebugState.current = currentState;
    }
  }, [requireAdmin, user, loading, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('ProtectedRoute: Admin required but user is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProtectedRoute: Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
