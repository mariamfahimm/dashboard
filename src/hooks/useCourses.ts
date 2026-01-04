// Courses Hook
import { useState, useEffect } from 'react'
import { coursesApi, type Course } from '../services/api/coursesApi'

export function useCourses(studentId?: string) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        setError(null)
        
        let response
        if (studentId) {
          // Get courses for specific student
          response = await coursesApi.getForStudent(studentId)
        } else {
          // Get all courses
          response = await coursesApi.getAll()
        }
        
        setCourses(response.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [studentId])

  const refresh = async () => {
    try {
      setLoading(true)
      let response
      if (studentId) {
        response = await coursesApi.getForStudent(studentId)
      } else {
        response = await coursesApi.getAll()
      }
      setCourses(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh courses')
    } finally {
      setLoading(false)
    }
  }

  return {
    courses,
    loading,
    error,
    refresh
  }
}

