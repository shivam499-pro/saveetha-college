import { useState, useEffect } from 'react'
import { getFairnessMetrics, getDriftReport } from '../lib/api'
import type { FairnessMetrics, DriftReport } from '../types'

interface UseFairnessResult {
  fairnessMetrics: FairnessMetrics | null
  driftReport: DriftReport | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useFairness = (): UseFairnessResult => {
  const [fairnessMetrics, setFairnessMetrics] = useState<FairnessMetrics | null>(null)
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [fairnessRes, driftRes] = await Promise.all([
        getFairnessMetrics(),
        getDriftReport(),
      ])
      setFairnessMetrics(fairnessRes.data)
      setDriftReport(driftRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fairness data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    fairnessMetrics,
    driftReport,
    loading,
    error,
    refetch: fetchData,
  }
}

export default useFairness