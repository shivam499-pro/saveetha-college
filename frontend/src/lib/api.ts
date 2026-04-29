import axios, { AxiosInstance } from 'axios'
import type {
  PredictionRequest,
  PredictionResponse,
  AuditLogResponse,
  ChainVerifyResponse,
  FairnessMetrics,
  DriftReport,
  DashboardStats,
  UserRole,
} from '@/types'

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('xai_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API functions
export const getToken = async (role: UserRole) => {
  const credentials = {
    applicant: { username: 'applicant', password: 'applicant123' },
    auditor: { username: 'auditor', password: 'auditor123' },
    regulator: { username: 'regulator', password: 'regulator123' },
  }

  const response = await api.post('/api/v1/auth/token', credentials[role])
  return response.data
}

export const predict = (data: PredictionRequest) =>
  api.post<PredictionResponse>('/api/v1/predict', data)

export const getAuditLog = (page: number, limit: number) =>
  api.get<AuditLogResponse>('/api/v1/audit/log', { params: { page, limit } })

export const verifyChain = () =>
  api.get<ChainVerifyResponse>('/api/v1/audit/verify')

export const getFairnessMetrics = () =>
  api.get<FairnessMetrics>('/api/v1/fairness/metrics')

export const getDriftReport = () =>
  api.get<DriftReport>('/api/v1/fairness/drift')

export const getDashboardStats = () =>
  api.get<DashboardStats>('/api/v1/dashboard/stats')

export const exportReport = (format: 'pdf' | 'csv') =>
  api.get(`/api/v1/report/export?format=${format}`, { responseType: 'blob' })

export default api