// Parent Recommendations Hook
import { useState, useEffect } from 'react'
import { parentRecommendationApi, type ParentRecommendation } from '../services/api/parentRecommendationApi'

export interface ParentRecommendationsData {
  studentId: string
  studentName?: string
  recommendations: ParentRecommendation[]
  count: number
}

export function useParentRecommendations(studentId?: string, language?: string) {
  const [data, setData] = useState<ParentRecommendationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecommendations() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get language from localStorage if not provided
        const lang = language || localStorage.getItem('language') || localStorage.getItem('locale') || 'en'
        const response = await parentRecommendationApi.getForStudent(studentId, lang)
        setData(response.data)
      } catch (err) {
        console.error('Error loading parent recommendations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load recommendations')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [studentId, language])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const lang = language || localStorage.getItem('language') || localStorage.getItem('locale') || 'en'
      const response = await parentRecommendationApi.getForStudent(studentId, lang)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh recommendations')
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    recommendations: data?.recommendations || [],
    loading,
    error,
    refresh
  }
}

