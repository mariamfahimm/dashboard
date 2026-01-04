// Assignments Hook
import { useState, useEffect } from 'react'
import { assignmentsApi, type Assignment } from '../services/api/assignmentsApi'
import { coursesApi } from '../services/api/coursesApi'

export function useAssignments(studentId?: string, courseId?: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAssignments() {
      if (!studentId && !courseId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        let allAssignments: Assignment[] = []
        
        if (courseId) {
          // Get assignments for specific course
          const response = await assignmentsApi.getForCourse(courseId)
          allAssignments = response.data || []
        } else if (studentId) {
          // Get courses for student, then get assignments for each course
          const coursesResponse = await coursesApi.getForStudent(studentId)
          const courses = coursesResponse.data || []
          
          if (courses.length > 0) {
            // Fetch assignments for all courses in parallel
            const assignmentPromises = courses.map(course => 
              assignmentsApi.getForCourse(course._id).catch(() => ({ data: [] }))
            )
            const assignmentResponses = await Promise.all(assignmentPromises)
            allAssignments = assignmentResponses.flatMap(res => res.data || [])
          }
        } else {
          // Get all assignments
          const response = await assignmentsApi.getAll()
          allAssignments = response.data || []
        }
        
        setAssignments(allAssignments)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [studentId, courseId])

  const refresh = async () => {
    if (!studentId && !courseId) return

    try {
      setLoading(true)
      let allAssignments: Assignment[] = []
      
      if (courseId) {
        const response = await assignmentsApi.getForCourse(courseId)
        allAssignments = response.data || []
      } else if (studentId) {
        const coursesResponse = await coursesApi.getForStudent(studentId)
        const courses = coursesResponse.data || []
        
        if (courses.length > 0) {
          const assignmentPromises = courses.map(course => 
            assignmentsApi.getForCourse(course._id).catch(() => ({ data: [] }))
          )
          const assignmentResponses = await Promise.all(assignmentPromises)
          allAssignments = assignmentResponses.flatMap(res => res.data || [])
        }
      }
      
      setAssignments(allAssignments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh assignments')
    } finally {
      setLoading(false)
    }
  }

  return {
    assignments,
    loading,
    error,
    refresh
  }
}

