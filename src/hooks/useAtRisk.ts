// At-Risk Student Detection Hook
import { useState, useEffect } from 'react'
import { atRiskApi, type AtRiskPrediction } from '../services/api/atRiskApi'

export function useAtRisk(studentId?: string) {
  const [prediction, setPrediction] = useState<AtRiskPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPrediction() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await atRiskApi.getForStudent(studentId)
        setPrediction(response.data)
      } catch (err) {
        console.error('Error loading at-risk prediction:', err)
        setError(err instanceof Error ? err.message : 'Failed to load risk prediction')
        setPrediction(null)
      } finally {
        setLoading(false)
      }
    }

    loadPrediction()
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await atRiskApi.getForStudent(studentId)
      setPrediction(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh risk prediction')
    } finally {
      setLoading(false)
    }
  }

  return {
    prediction,
    loading,
    error,
    refresh
  }
}

