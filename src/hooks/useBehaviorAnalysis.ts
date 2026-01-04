// Behavior Pattern Analysis Hook
import { useState, useEffect } from 'react'
import { behaviorAnalysisApi, type BehaviorPattern } from '../services/api/behaviorAnalysisApi'

export function useBehaviorAnalysis(studentId?: string) {
  const [analysis, setAnalysis] = useState<BehaviorPattern | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAnalysis() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await behaviorAnalysisApi.getForStudent(studentId)
        setAnalysis(response.data)
      } catch (err) {
        console.error('Error loading behavior analysis:', err)
        setError(err instanceof Error ? err.message : 'Failed to load behavior analysis')
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await behaviorAnalysisApi.getForStudent(studentId)
      setAnalysis(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh analysis')
    } finally {
      setLoading(false)
    }
  }

  return {
    analysis,
    loading,
    error,
    refresh
  }
}

