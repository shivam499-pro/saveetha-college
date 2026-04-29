export interface PredictionRequest {
  income: number
  loan_amount: number
  credit_history: string
  employment_type: string
  existing_loans: number
  duration: number
  age: number
}

export interface ExplanationFactor {
  feature: string
  shap_score: number
  direction: 'positive' | 'negative'
  value: number
}

export interface PredictionResponse {
  approved: boolean
  confidence: number
  explanation: string[]
  suggestions: string[]
  audit_id: string
}

export interface AuditEntry {
  id: string
  timestamp: string
  input_data: Record<string, unknown>
  prediction: boolean
  confidence: number
  shap_values: ExplanationFactor[]
  prev_hash: string
  current_hash: string
}

export interface AuditLogResponse {
  page: number
  limit: number
  count: number
  data: AuditEntry[]
}

export interface ChainVerifyResponse {
  valid: boolean
  broken_at: string | null
}

export interface FairnessMetrics {
  [attribute: string]: {
    demographic_parity_difference: number
    equalized_odds_difference: number
    selection_rates: Record<string, number>
    four_fifths_pass: boolean
  }
}

export interface DriftReport {
  [feature: string]: {
    drift_score: number
    drift_detected: boolean
  }
}

export interface DashboardStats {
  total: number
  approved: number
  rejected: number
  approval_rate: number
  anomaly_count: number
}

export type SupportedLocale = 'en' | 'ta' | 'hi'
export type UserRole = 'applicant' | 'auditor' | 'regulator'

export interface JWTPayload {
  role: UserRole
  exp: number
}