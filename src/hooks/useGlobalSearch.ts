// Global Search Hook - Searches across students, grades, assignments, and messages
import { useState, useEffect } from 'react'
import { useStudents } from './useStudents'
import { useGrades } from './useGrades'
import { useAssignments } from './useAssignments'
import { useMessages } from './useMessages'
import { useAuth } from '../context/AuthContext'

export interface SearchResult {
  type: 'student' | 'grade' | 'assignment' | 'message'
  id: string
  title: string
  subtitle?: string
  metadata?: string
  route?: string
  icon: string
}

export function useGlobalSearch(query: string, selectedStudentId?: string) {
  const { user } = useAuth()
  const { students } = useStudents(user?._id)
  const { grades } = useGrades(selectedStudentId)
  const { assignments } = useAssignments(selectedStudentId)
  const { messages } = useMessages(selectedStudentId)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const searchTerm = query.toLowerCase().trim()
    const searchResults: SearchResult[] = []

    // Search students
    if (students) {
      students.forEach(student => {
        const nameMatch = student.name.toLowerCase().includes(searchTerm)
        const idMatch = student.studentId?.toLowerCase().includes(searchTerm)
        
        if (nameMatch || idMatch) {
          searchResults.push({
            type: 'student',
            id: student._id,
            title: student.name,
            subtitle: `Student ID: ${student.studentId || 'N/A'}`,
            metadata: `Grade ${student.gradeLevel || 'N/A'}`,
            route: '#/children',
            icon: '👤'
          })
        }
      })
    }

    // Search grades
    if (grades) {
      grades.forEach(grade => {
        // Search by percentage, score, or assignment title (if available)
        const percentageMatch = grade.percentage?.toString().includes(searchTerm)
        const scoreMatch = `${grade.score}/${grade.maxScore}`.includes(searchTerm)
        
        if (percentageMatch || scoreMatch) {
          searchResults.push({
            type: 'grade',
            id: grade._id,
            title: `Grade: ${grade.percentage}%`,
            subtitle: `Score: ${grade.score}/${grade.maxScore}`,
            metadata: grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : 'Recent',
            route: '#/gradebook',
            icon: '📊'
          })
        }
      })
    }

    // Search assignments
    if (assignments) {
      assignments.forEach(assignment => {
        const titleMatch = assignment.title?.toLowerCase().includes(searchTerm)
        const subjectMatch = assignment.subject?.toLowerCase().includes(searchTerm)
        const typeMatch = assignment.type?.toLowerCase().includes(searchTerm)
        
        if (titleMatch || subjectMatch || typeMatch) {
          searchResults.push({
            type: 'assignment',
            id: assignment._id,
            title: assignment.title || 'Untitled Assignment',
            subtitle: `${assignment.type || 'Assignment'} • ${assignment.subject || 'N/A'}`,
            metadata: assignment.dueDate ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}` : 'No due date',
            route: '#/',
            icon: '📝'
          })
        }
      })
    }

    // Search messages
    if (messages) {
      messages.forEach(message => {
        const subjectMatch = message.subject?.toLowerCase().includes(searchTerm)
        const contentMatch = message.content?.toLowerCase().includes(searchTerm)
        const senderMatch = message.senderName?.toLowerCase().includes(searchTerm)
        
        if (subjectMatch || contentMatch || senderMatch) {
          searchResults.push({
            type: 'message',
            id: message._id,
            title: message.subject || 'No Subject',
            subtitle: `From: ${message.senderName || 'Unknown'}`,
            metadata: message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'Recent',
            route: '#/messages',
            icon: '💬'
          })
        }
      })
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = searchResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm
      const bExact = b.title.toLowerCase() === searchTerm
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })

    setResults(sortedResults.slice(0, 10)) // Limit to 10 results
    setLoading(false)
  }, [query, students, grades, assignments, messages, selectedStudentId])

  return {
    results,
    loading,
    hasResults: results.length > 0
  }
}

