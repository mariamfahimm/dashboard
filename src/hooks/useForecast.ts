// Forecast Hook
import { useState, useEffect } from 'react'
import { forecastApi, type GoalProgress, type ForecastResult } from '../services/api/forecastApi'

export function useForecast(studentId?: string) {
  const [forecasts, setForecasts] = useState<GoalProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadForecasts() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await forecastApi.getStudentForecasts(studentId)
        const forecastsData = (response as any).data || response
        setForecasts(Array.isArray(forecastsData) ? forecastsData : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forecasts')
        setForecasts([])
      } finally {
        setLoading(false)
      }
    }

    loadForecasts()
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await forecastApi.getStudentForecasts(studentId)
      const forecastsData = (response as any).data || response
      setForecasts(Array.isArray(forecastsData) ? forecastsData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh forecasts')
    } finally {
      setLoading(false)
    }
  }

  const forecastGrade = async (subject: string, targetGrade: number): Promise<ForecastResult | null> => {
    if (!studentId) return null

    try {
      const response = await forecastApi.forecastGrade({ studentId, subject, targetGrade })
      return (response as any).data || response
    } catch (err) {
      console.error('Error forecasting grade:', err)
      return null
    }
  }

  return {
    forecasts,
    loading,
    error,
    refresh,
    forecastGrade
  }
}

