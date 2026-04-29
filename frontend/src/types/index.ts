// Supported locales
export type SupportedLocale = 'en' | 'ta' | 'hi'

// JWT Payload
export interface JWTPayload {
  sub: string
  role: 'applicant' | 'auditor' | 'regulator'
  exp: number
  iat: number
  [key: string]: any
}

// Prediction request and response
export interface PredictionRequest {
  annual_income: number
  loan_amount: number
  credit_history: number
  employment_type: 'salaried' | 'self_employed' | 'unemployed' | 'student'
  existing_loans: number
}

export interface PredictionResponse {
  prediction: 'approved' | 'rejected'
  confidence: number
  explanation_factors: ExplanationFactor[]
  suggestions: Suggestion[]
  timestamp: string
  request_id: string
}

export interface ExplanationFactor {
  feature: string
  value: number | string
  impact: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface Suggestion {
  type: 'improvement' | 'warning' | 'info'
  message: string
  priority: 'high' | 'medium' | 'low'
}

// Audit and chain verification
export interface AuditEntry {
  id: string
  timestamp: string
  action: string
  user_id: string
  role: 'applicant' | 'auditor' | 'regulator'
  request_id: string
  prediction: 'approved' | 'rejected'
  details: Record<string, any>
  previous_hash: string
  current_hash: string
}

export interface AuditLogResponse {
  entries: AuditEntry[]
  total: number
  page: number
  page_size: number
}

export interface ChainVerifyResponse {
  is_valid: boolean
  broken_at: number | null
  total_entries: number
  verification_details: {
    index: number
    previous_hash: string
    current_hash: string
    computed_hash: string
    is_valid: boolean
  }[]
}

// Fairness and drift
export interface FairnessMetrics {
  demographic_parity: {
    value: number
    threshold: number
    passes: boolean
  }
  equalized_odds: {
    value: number
    threshold: number
    passes: boolean
  }
  equal_opportunity: {
    value: number
    threshold: number
    passes: boolean
  }
  four_fifths_rule: {
    value: number
    threshold: number
    passes: boolean
  }
  group_disparity: Record<string, number>
  timestamp: string
}

export interface DriftReport {
  feature_drift: Record<string, {
    drift_score: number
    status: 'stable' | 'warning' | 'critical'
    baseline_mean: number
    current_mean: number
    change_percentage: number
  }>
  prediction_drift: {
    drift_score: number
    status: 'stable' | 'warning' | 'critical'
    baseline_approval_rate: number
    current_approval_rate: number
  }  
  timestamp: string
}

// Dashboard stats
export interface DashboardStats {
  total_applications: number
  approved: number
  rejected: number
  anomalies_detected: number
  approval_rate: number
  avg_confidence: number
  recent_predictions: Array<{
    id: string
    timestamp: string
    prediction: 'approved' | 'rejected'
    confidence: number
  }>
}