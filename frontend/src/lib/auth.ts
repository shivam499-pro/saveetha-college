import { jwtDecode } from 'jwt-decode'
import type { JWTPayload, UserRole } from '@/types'

export const login = (token: string) => {
  localStorage.setItem('xai_token', token)
}

export const logout = () => {
  localStorage.removeItem('xai_token')
}

export const getToken = () => {
  return localStorage.getItem('xai_token')
}

export const getRole = (): UserRole | null => {
  const token = getToken()
  if (!token) return null
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    return decoded.role
  } catch {
    return null
  }
}

export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    const currentTime = Date.now() / 1000
    return decoded.exp > currentTime
  } catch {
    return false
  }
}
