// Grades Hook
import { useState, useEffect } from 'react'
import { gradesApi, type Grade } from '../services/api/gradesApi'

export function useGrades(studentId?: string, courseId?: string) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGrades() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        console.log('[useGrades] Fetching grades for studentId:', studentId)
        const response = await gradesApi.getForStudent(studentId)
        console.log('[useGrades] Response:', response)
        
        // Handle different response formats
        let allGrades: Grade[] = []
        let avg: number | null = null
        
        if (response && typeof response === 'object') {
          if ('data' in response && Array.isArray(response.data)) {
            allGrades = response.data
          } else if (Array.isArray(response)) {
            allGrades = response
          }
          
          if ('average' in response) {
            avg = response.average
          }
        }
        
        console.log('[useGrades] Parsed grades:', allGrades.length, 'average:', avg)
        
        // Filter by courseId if provided
        if (courseId) {
          allGrades = allGrades.filter(g => g.courseId === courseId)
        }
        
        setGrades(allGrades)
        setAverage(avg)
      } catch (err) {
        console.error('[useGrades] Error loading grades:', err)
        setError(err instanceof Error ? err.message : 'Failed to load grades')
        setGrades([])
        setAverage(null)
      } finally {
        setLoading(false)
      }
    }

    loadGrades()
  }, [studentId, courseId])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await gradesApi.getForStudent(studentId)
      let allGrades = response.data || []
      
      if (courseId) {
        allGrades = allGrades.filter(g => g.courseId === courseId)
      }
      
      setGrades(allGrades)
      setAverage(response.average || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh grades')
    } finally {
      setLoading(false)
    }
  }

  // Calculate grade by subject
  const getGradeBySubject = (subject: string) => {
    // This would need course information to map properly
    // For now, return average of all grades
    return average
  }

  return {
    grades,
    average,
    loading,
    error,
    refresh,
    getGradeBySubject
  }
}

