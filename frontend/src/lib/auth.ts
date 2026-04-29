import type { JWTPayload, SupportedLocale } from '../types'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'token'
const LANGUAGE_KEY = 'xai_lang'

// Decode JWT token
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwtDecode<JWTPayload>(token)
  } catch {
    return null
  }
}

// Get role from token
export const getRole = (): 'applicant' | 'auditor' | 'regulator' | null => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  const payload = decodeToken(token)
  return payload?.role || null
}

// Check if authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return false
  const payload = decodeToken(token)
  if (!payload) return false
  // Check expiry (with 60 second buffer)
  const now = Math.floor(Date.now() / 1000)
  return payload.exp > now + 60
}

// Store token
export const login = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

// Clear token
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(LANGUAGE_KEY)
}

// Get token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

// Custom hook for auth
export const useAuth = () => {
  return {
    role: getRole(),
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    getToken,
    decodeToken,
  }
}

// ProtectedRoute component
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import React from 'react'

interface ProtectedRouteProps {
  allowedRoles?: Array<'applicant' | 'auditor' | 'regulator'>
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const role = getRole()
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'applicant') return <Navigate to="/applicant" replace />
    if (role === 'auditor') return <Navigate to="/auditor" replace />
    if (role === 'regulator') return <Navigate to="/regulator" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Role-based redirect
export const RoleRedirect: React.FC = () => {
  const role = getRole()
  if (role === 'applicant') return <Navigate to="/applicant" replace />
  if (role === 'auditor') return <Navigate to="/auditor" replace />
  if (role === 'regulator') return <Navigate to="/regulator" replace />
  return <Navigate to="/login" replace />
}

export default {
  getRole,
  isAuthenticated,
  login,
  logout,
  getToken,
  decodeToken,
  ProtectedRoute,
  RoleRedirect,
  useAuth,
}