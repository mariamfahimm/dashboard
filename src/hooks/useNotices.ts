// Notices Hook
import { useState, useEffect } from 'react'
import { noticesApi, type Notice } from '../services/api/noticesApi'

export function useNotices(studentId?: string) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadNotices() {
      try {
        setLoading(true)
        setError(null)

        const response = await noticesApi.getAll({ studentId, limit: 10 })
        const noticesData = response.data || []

        setNotices(noticesData)
      } catch (err) {
        console.error('Error loading notices:', err)
        setError(err instanceof Error ? err.message : 'Failed to load notices')
        setNotices([])
      } finally {
        setLoading(false)
      }
    }

    loadNotices()
  }, [studentId])

  const refresh = async () => {
    try {
      setLoading(true)
      const response = await noticesApi.getAll({ studentId, limit: 10 })
      const noticesData = response.data || []

      setNotices(noticesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh notices')
    } finally {
      setLoading(false)
    }
  }

  return {
    notices,
    loading,
    error,
    refresh
  }
}

