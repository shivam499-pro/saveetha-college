import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type {
  PredictionRequest,
  PredictionResponse,
  AuditEntry,
  AuditLogResponse,
  ChainVerifyResponse,
  FairnessMetrics,
  DriftReport,
  DashboardStats,
} from '../types'

const getApiBaseUrl = (): string => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (envBaseUrl) {
    return envBaseUrl
  }
  // Default to localhost:8000 for development
  return 'http://localhost:8000'
}

const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API functions

export const predict = async (
  data: PredictionRequest
): Promise<AxiosResponse<PredictionResponse>> => {
  return api.post<PredictionResponse>('/predict', data)
}

export const getAuditLog = async (
  page: number = 1,
  pageSize: number = 20
): Promise<AxiosResponse<AuditLogResponse>> => {
  return api.get<AuditLogResponse>('/audit', {
    params: { page, page_size: pageSize },
  })
}

export const verifyChain = async (
  fromIndex?: number,
  toIndex?: number
): Promise<AxiosResponse<ChainVerifyResponse>> => {
  return api.get<ChainVerifyResponse>('/verify-chain', {
    params: { from_index: fromIndex, to_index: toIndex },
  })
}

export const getFairnessMetrics = async (
  groupBy?: string
): Promise<AxiosResponse<FairnessMetrics>> => {
  return api.get<FairnessMetrics>('/fairness', {
    params: groupBy ? { group_by: groupBy } : undefined,
  })
}

export const getDriftReport = async (
  days: number = 30
): Promise<AxiosResponse<DriftReport>> => {
  return api.get<DriftReport>('/drift', {
    params: { days },
  })
}

export const getDashboardStats = async (
  period: string = '30d'
): Promise<AxiosResponse<DashboardStats>> => {
  return api.get<DashboardStats>('/dashboard/stats', {
    params: { period },
  })
}

export const exportReport = async (
  format: 'pdf' | 'csv' = 'pdf'
): Promise<AxiosResponse<Blob>> => {
  return api.get<Blob>(`/export/${format}`, {
    responseType: 'blob',
  })
}

export default api