import { useState, useEffect } from 'react'
import { getAuditLog } from '../lib/api'
import type { AuditLogResponse, AuditEntry } from '../types'

interface UseAuditLogResult {
  entries: AuditEntry[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  fetchPage: (page: number, pageSize?: number) => Promise<void>
}

export const useAuditLog = (
  initialPage: number = 1,
  initialPageSize: number = 20
): UseAuditLogResult => {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = async (pageNum: number, size: number = initialPageSize) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAuditLog(pageNum, size)
      setEntries(response.data.entries)
      setTotal(response.data.total)
      setPage(pageNum)
      setPageSize(size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(initialPage, initialPageSize)
  }, [initialPage, initialPageSize])

  return {
    entries,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchPage,
  }
}

export default useAuditLog