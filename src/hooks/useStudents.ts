// Students Hook
import { useState, useEffect } from 'react'
import { studentsApi, type Student } from '../services/api/studentsApi'

export function useStudents(userId?: string) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true)
        setError(null)
        
        // Pass userId as query parameter to backend for server-side filtering
        const response = await studentsApi.getAll(userId ? { userId } : undefined)
        // API client returns { success: true, count: number, data: Student[] }
        let allStudents: Student[] = []
        if (response && typeof response === 'object') {
          // Check if response has data field (from backend format)
          if ('data' in response && Array.isArray((response as any).data)) {
            allStudents = (response as any).data
          } else if (Array.isArray(response)) {
            // If response is directly an array
            allStudents = response
          }
        }
        
        setStudents(allStudents)
      } catch (err) {
        console.error('Error loading students:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load students'
        setError(errorMessage)
        setStudents([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [userId])

  const refresh = async () => {
    try {
      setLoading(true)
      const response = await studentsApi.getAll()
      let allStudents = response.data || []
      
      if (userId) {
        allStudents = allStudents.filter(s => s.userId === userId)
      }
      
      setStudents(allStudents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh students')
    } finally {
      setLoading(false)
    }
  }

  return {
    students,
    loading,
    error,
    refresh
  }
}

