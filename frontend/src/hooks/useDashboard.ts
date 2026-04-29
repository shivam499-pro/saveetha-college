import { useState, useEffect } from 'react'
import { getDashboardStats } from '../lib/api'
import type { DashboardStats } from '../types'

interface UseDashboardResult {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  refetch: (period?: string) => Promise<void>
}

export const useDashboard = (initialPeriod: string = '30d'): UseDashboardResult => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (period: string = initialPeriod) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getDashboardStats(period)
      setStats(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(initialPeriod)
  }, [initialPeriod])

  return {
    stats,
    loading,
    error,
    refetch: fetchData,
  }
}

export default useDashboard