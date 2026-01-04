// Protected Route Component
import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'student' | 'teacher' | 'admin'
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallback = <div>Loading...</div>
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!isAuthenticated) {
    // Return a minimal component instead of null to prevent blank page
    // App.jsx should handle showing Login, but this is a safety fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

