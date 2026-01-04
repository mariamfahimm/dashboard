// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '../utils/apiClient'

export interface User {
  _id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin' | 'parent'
  phone?: string
  address?: string
  preferences?: {
    notifications?: {
      email?: boolean
      push?: boolean
      grades?: boolean
      assignments?: boolean
      attendance?: boolean
      behavior?: boolean
      messages?: boolean
    }
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ mustChangePassword?: boolean }>
  logout: () => void
  register: (name: string, email: string, password: string, role: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  refreshUser: () => Promise<void>
  mustChangePassword: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      apiClient.setToken(storedToken)
      setToken(storedToken)
      // Try to fetch user info
      fetchUserInfo(storedToken).catch(() => {
        // Token invalid, clear it
        apiClient.setToken(null)
        setToken(null)
        setUser(null)
        localStorage.removeItem('auth_token')
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUserInfo = async (authToken: string) => {
    try {
      // This endpoint should be created in backend
      const response = await apiClient.get<{ success: boolean; data: User } | User>('/auth/me')
      // Handle both response formats
      const userData = (response as any).data || response
      setUser(userData as User)
      setIsLoading(false)
      return userData as User
    } catch (error) {
      // If token is invalid, don't throw - just clear it
      setIsLoading(false)
      // Clear invalid token
      apiClient.setToken(null)
      localStorage.removeItem('auth_token')
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      console.log('[AuthContext] Attempting login for:', email)
      
      const response = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/login', {
        email,
        password,
      })

      console.log('[AuthContext] Login response received:', { 
        hasSuccess: !!response.success, 
        hasToken: !!(response.token || (response as any).token),
        hasUser: !!(response.user || (response as any).user),
        responseKeys: Object.keys(response)
      })

      // Handle response format - backend returns { success: true, token, user }
      const authToken = response.token || (response as any).token
      const userData = response.user || (response as any).user
      
      if (!authToken || !userData) {
        console.error('[AuthContext] Missing token or user in response:', response)
        throw new Error('Invalid response from server')
      }

      apiClient.setToken(authToken)
      setToken(authToken)
      setUser(userData)
      localStorage.setItem('auth_token', authToken)
      
      // Check if password change is required
      const requiresPasswordChange = (response as any).mustChangePassword === true
      setMustChangePassword(requiresPasswordChange)
      
      console.log('[AuthContext] Login successful, user:', userData.name)
      setIsLoading(false)
      
      // Return flag for password change requirement
      return { mustChangePassword: requiresPasswordChange }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error)
      setIsLoading(false)
      const errorMessage = error.message || error.errors?.[0]?.message || 'Login failed. Please check your credentials and ensure the backend server is running.'
      throw new Error(errorMessage)
    }
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const response = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/register', {
        name,
        email,
        password,
        role,
      })

      // Handle response format - backend returns { success: true, token, user }
      const authToken = response.token || (response as any).token
      const userData = response.user || (response as any).user
      
      if (!authToken || !userData) {
        throw new Error('Invalid response from server')
      }

      apiClient.setToken(authToken)
      setToken(authToken)
      setUser(userData)
      localStorage.setItem('auth_token', authToken)
    } catch (error: any) {
      const errorMessage = error.message || error.errors?.[0]?.message || 'Registration failed'
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    // Clear API client token
    apiClient.setToken(null)
    
    // Clear state
    setToken(null)
    setUser(null)
    setIsLoading(false)
    
    // Clear localStorage
    localStorage.removeItem('auth_token')
    
    // Force a state update to trigger re-render
    // This ensures isAuthenticated becomes false immediately
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      
      // Clear the must change password flag
      setMustChangePassword(false)
      
      // Refresh user info
      await refreshUser()
    } catch (error: any) {
      const errorMessage = error.message || error.errors?.[0]?.message || 'Failed to change password'
      throw new Error(errorMessage)
    }
  }

  const refreshUser = async () => {
    if (token) {
      await fetchUserInfo(token)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    register,
    changePassword,
    isAuthenticated: !!user && !!token,
    isLoading,
    refreshUser,
    mustChangePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

