// Hook for fetching optimal study time insights
import { useState, useEffect } from 'react'
import { optimalStudyTimeApi, type OptimalStudyTimeInsight } from '../services/api/optimalStudyTimeApi'

export function useOptimalStudyTime(studentId?: string, language?: string) {
  const [insights, setInsights] = useState<OptimalStudyTimeInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInsights() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        // Get language from localStorage if not provided
        const lang = language || localStorage.getItem('language') || localStorage.getItem('locale') || 'en'
        const data = await optimalStudyTimeApi.getForStudent(studentId, lang)
        setInsights(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load study time insights')
        console.error('[useOptimalStudyTime] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInsights()
  }, [studentId, language])

  return {
    insights,
    loading,
    error
  }
}

