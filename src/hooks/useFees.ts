// Fees Hook
import { useState, useEffect } from 'react'
import { feesApi, type Fee, type FeeStats, type FeeQueryParams } from '../services/api/feesApi'

export function useFees(
  studentId?: string,
  params?: FeeQueryParams
) {
  const [fees, setFees] = useState<Fee[]>([])
  const [stats, setStats] = useState<FeeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFees() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [feesResponse, statsResponse] = await Promise.all([
          feesApi.getByStudent(studentId, params),
          feesApi.getStats(studentId)
        ])

        setFees(feesResponse.data || [])
        setStats(statsResponse.data || null)
      } catch (err) {
        console.error('Error loading fees:', err)
        setError(err instanceof Error ? err.message : 'Failed to load fees data')
        setFees([])
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    loadFees()
  }, [studentId, params?.status, params?.feeType, params?.startDate, params?.endDate])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const [feesResponse, statsResponse] = await Promise.all([
        feesApi.getByStudent(studentId, params),
        feesApi.getStats(studentId)
      ])

      setFees(feesResponse.data || [])
      setStats(statsResponse.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh fees data')
    } finally {
      setLoading(false)
    }
  }

  return {
    fees,
    stats,
    loading,
    error,
    refresh
  }
}

export function usePaymentHistory(studentId?: string) {
  const [history, setHistory] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await feesApi.getPaymentHistory(studentId)
        setHistory(response.data || [])
      } catch (err) {
        console.error('Error loading payment history:', err)
        setError(err instanceof Error ? err.message : 'Failed to load payment history')
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await feesApi.getPaymentHistory(studentId)
      setHistory(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh payment history')
    } finally {
      setLoading(false)
    }
  }

  return {
    history,
    loading,
    error,
    refresh
  }
}

