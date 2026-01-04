// Admin Demo Interface - For Manual Data Entry
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudents } from '../hooks/useStudents'
import { apiClient } from '../utils/apiClient'
import { useRealtime } from '../services/realtimeService'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface AdminDemoProps {
  route?: string
}

export function AdminDemo({ route }: AdminDemoProps = {}) {
  const { user, login } = useAuth()
  const { students, loading: studentsLoading, refresh: refreshStudents } = useStudents()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Determine active tab from route
  const getTabFromRoute = (route?: string): 'students' | 'courses' | 'parents' | 'alerts' | 'messages' | 'fees' | 'events' | 'seed' => {
    if (!route) return 'students'
    if (route.includes('/students')) return 'students'
    if (route.includes('/courses')) return 'courses'
    if (route.includes('/parents')) return 'parents'
    if (route.includes('/alerts')) return 'alerts'
    if (route.includes('/messages')) return 'messages'
    if (route.includes('/fees')) return 'fees'
    if (route.includes('/events')) return 'events'
    return 'students' // Default to students for admin dashboard
  }
  
  const [activeTab, setActiveTab] = useState<'students' | 'courses' | 'parents' | 'alerts' | 'messages' | 'fees' | 'events' | 'seed'>(getTabFromRoute(route))
  
  // Update active tab when route changes
  useEffect(() => {
    const tab = getTabFromRoute(route || window.location.hash)
    setActiveTab(tab)
  }, [route])
  const [allParents, setAllParents] = useState<any[]>([])
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [impersonating, setImpersonating] = useState(false)

  // Form states
  const [gradeForm, setGradeForm] = useState({
    score: '',
    maxScore: '100',
    courseId: ''
  })

  const [courseForm, setCourseForm] = useState({
    title: '',
    subject: '',
    description: '',
    teacherId: 'teacher1' // Default teacher ID for demo
  })

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    dueDate: '',
    status: 'active',
    courseId: ''
  })

  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    type: 'performance',
    priority: 'medium'
  })

  const [messageForm, setMessageForm] = useState({
    to: '',
    subject: '',
    content: '',
    studentId: ''
  })

  const [feeForm, setFeeForm] = useState({
    description: '',
    amount: '',
    feeType: 'tuition',
    dueDate: ''
  })

  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'school_event',
    startDate: '',
    endDate: '',
    allDay: false
  })

  const [studentForm, setStudentForm] = useState({
    name: '',
    studentId: '',
    gradeLevel: '10'
  })

  const [parentForm, setParentForm] = useState({
    name: '',
    email: '',
    selectedStudentIds: [] as string[],
    sendEmail: true,
    language: 'en' as 'en' | 'ar'
  })

  const [allStudents, setAllStudents] = useState<any[]>([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedStudentForAssignment, setSelectedStudentForAssignment] = useState('')
  const [selectedGradeForLinking, setSelectedGradeForLinking] = useState<string>('')
  const [selectedGradeForAssignment, setSelectedGradeForAssignment] = useState<string>('')
  const [selectedGradeForStudents, setSelectedGradeForStudents] = useState<string>('')
  const [studentSelectionMode, setStudentSelectionMode] = useState<'id' | 'name'>('name')
  const [studentSelectionModeForStudents, setStudentSelectionModeForStudents] = useState<'id' | 'name'>('name')
  const [searchQueryForStudents, setSearchQueryForStudents] = useState<string>('')
  const [searchQueryForLinking, setSearchQueryForLinking] = useState<string>('')
  const [searchQueryForAssignment, setSearchQueryForAssignment] = useState<string>('')

  // Get courses for selected student
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  
  // Real-time updates for selected student
  const { lastUpdate } = useRealtime(selectedStudentId)

  useEffect(() => {
    if (selectedStudentId && students) {
      const student = students.find(s => s._id === selectedStudentId)
      setSelectedStudent(student)
      loadStudentData(selectedStudentId)
    }
  }, [selectedStudentId, students])

  // Load parents for impersonation
  useEffect(() => {
    const loadParents = async () => {
      try {
        const response = await apiClient.get('/users', { role: 'parent' })
        const parents = Array.isArray(response) ? response : (response as any).data || []
        setAllParents(parents)
      } catch (error) {
        console.error('Error loading parents:', error)
      }
    }
    loadParents()
  }, [])

  // Load all students for assignment
  useEffect(() => {
    const loadAllStudents = async () => {
      try {
        const response = await apiClient.get('/students')
        const studentsList = Array.isArray(response) 
          ? response 
          : (response as any).data?.data || (response as any).data || []
        setAllStudents(studentsList)
      } catch (error) {
        console.error('Error loading all students:', error)
      }
    }
    loadAllStudents()
  }, [])

  // Load all courses
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const response = await apiClient.get('/courses')
        const coursesList = Array.isArray(response) 
          ? response 
          : (response as any).data?.data || (response as any).data || []
        setAllCourses(coursesList)
      } catch (error) {
        console.error('Error loading all courses:', error)
      }
    }
    loadAllCourses()
  }, [])
  
  // Refresh data on real-time updates
  useEffect(() => {
    if (lastUpdate && selectedStudentId) {
      // Refresh student data when real-time update is received
      loadStudentData(selectedStudentId)
      refreshStudents()
    }
  }, [lastUpdate, selectedStudentId])

  const loadStudentData = async (studentId: string) => {
    try {
      // Get enrollments
      const enrollmentsData = await apiClient.get<any>('/enrollments', { studentId })
      const enrollmentsList = Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData as any).data || []
      setEnrollments(enrollmentsList)

      // Get courses from enrollments
      if (enrollmentsList.length > 0) {
        const courseIds = enrollmentsList.map((e: any) => e.courseId)
        const coursesData = await apiClient.get<any>('/courses')
        const allCourses = Array.isArray(coursesData) ? coursesData : (coursesData as any).data || []
        const studentCourses = allCourses.filter((c: any) => courseIds.includes(c._id))
        setCourses(studentCourses)
      } else {
        setCourses([])
      }
    } catch (error) {
      console.error('Error loading student data:', error)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Helper function to get unique grades from students
  const getAvailableGrades = (students: any[]): number[] => {
    const grades = new Set<number>()
    students.forEach(s => {
      if (s.gradeLevel) grades.add(s.gradeLevel)
    })
    return Array.from(grades).sort((a, b) => a - b)
  }

  // Helper function to check if a student ID is a new-style ID (100-9999)
  const isNewStyleId = (studentId: string): boolean => {
    if (!studentId) return false
    const match = studentId.match(/^(\d+)$/)
    if (match) {
      const numId = parseInt(match[1])
      return numId >= 100 && numId <= 9999
    }
    return false
  }

  // Helper function to filter and sort students by grade and search query
  // Shows all students (old and new IDs will be shown until migration is run)
  const getFilteredAndSortedStudents = (students: any[], gradeFilter: string, sortBy: 'id' | 'name' = 'name', searchQuery: string = ''): any[] => {
    let filtered = students

    // Filter by grade if selected (skip if "all" or empty)
    if (gradeFilter && gradeFilter !== '' && gradeFilter !== 'all') {
      const gradeNum = parseInt(gradeFilter)
      filtered = filtered.filter(s => s.gradeLevel === gradeNum)
    }

    // Filter by search query (matches ID or name) - requires at least 2 characters
    if (searchQuery && searchQuery.trim().length >= 2) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(s => {
        const studentId = (s.studentId || '').toLowerCase()
        const name = (s.name || '').toLowerCase()
        const nameArabic = (s.nameArabic || '').toLowerCase()
        return studentId.includes(query) || name.includes(query) || nameArabic.includes(query)
      })
    }

    // Sort by ID or name based on selection
    if (sortBy === 'id') {
      return filtered.sort((a, b) => {
        // Extract numeric part of ID for comparison
        const idA = parseInt(a.studentId) || 0
        const idB = parseInt(b.studentId) || 0
        return idA - idB
      })
    } else {
      // Sort alphabetically by name
      return filtered.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
    }
  }

  // Generate next student ID starting from 100
  // Completely ignores all existing IDs and starts fresh from 100
  const generateNextStudentId = async (): Promise<string> => {
    try {
      const response = await apiClient.get('/students')
      const studentsList = Array.isArray(response) 
        ? response 
        : (response as any).data?.data || (response as any).data || []
      
      // Extract ONLY new-style numeric IDs (100-9999 range) that we've created with this new system
      // Completely ignore all old IDs regardless of format
      const newStyleIds = studentsList
        .map((s: any) => {
          // Only match pure numeric IDs (no letters, no dashes, no prefixes)
          const match = s.studentId?.match(/^(\d+)$/)
          if (match) {
            const numId = parseInt(match[1])
            // Only consider IDs in the new range 100-9999 (completely ignore everything else)
            return (numId >= 100 && numId <= 9999) ? numId : null
          }
          return null
        })
        .filter((id: number | null) => id !== null) as number[]
      
      // If we have new-style IDs, find the max and increment
      // Otherwise, start fresh from 100
      if (newStyleIds.length > 0) {
        const maxId = Math.max(...newStyleIds)
        const nextId = maxId + 1
        // Ensure we stay in valid range
        if (nextId > 9999) {
          // If we've exceeded the range, start from 100 again (but this shouldn't happen)
          return '100'
        }
        return nextId.toString()
      }
      
      // No new-style IDs exist, start fresh from 100
      return '100'
    } catch (error) {
      console.error('Error generating student ID:', error)
      // Fallback: start from 100
      return '100'
    }
  }

  // Create or select student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Generate student ID if not provided
      let studentId = studentForm.studentId
      if (!studentId || studentId.trim() === '') {
        studentId = await generateNextStudentId()
      }
      
      const response = await apiClient.post('/students', {
        name: studentForm.name,
        studentId: studentId,
        gradeLevel: parseInt(studentForm.gradeLevel),
        userId: user?._id
      })
      showMessage('success', `✅ Entry has been successfully added! Student "${studentForm.name}" created.`)
      setStudentForm({ name: '', studentId: '', gradeLevel: '10' })
      await refreshStudents()
      // Auto-select the new student
      const newStudent = (response as any).data || response
      if (newStudent._id) {
        setSelectedStudentId(newStudent._id)
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create student')
    } finally {
      setLoading(false)
    }
  }

  // Create enrollment (link student to course)
  const handleCreateEnrollment = async (courseId: string, subject: string) => {
    if (!selectedStudentId) {
      showMessage('error', 'Please select a student first')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/enrollments', {
        studentId: selectedStudentId,
        courseId: courseId,
        status: 'active'
      })
      showMessage('success', `Student enrolled in ${subject}!`)
      await loadStudentData(selectedStudentId)
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create enrollment')
    } finally {
      setLoading(false)
    }
  }

  // Create course if needed
  const ensureCourse = async (subject: string): Promise<string | null> => {
    try {
      // Check if course exists
      const coursesData = await apiClient.get<any>('/courses')
      const allCourses = Array.isArray(coursesData) ? coursesData : (coursesData as any).data || []
      const existingCourse = allCourses.find((c: any) => c.subject === subject)
      
      if (existingCourse) {
        return existingCourse._id
      }

      // Create new course
      const newCourse = await apiClient.post('/courses', {
        title: `${subject} 101`,
        subject: subject,
        description: `${subject} course`,
        teacherId: 'teacher1' // Demo teacher ID
      })
      const course = (newCourse as any).data || newCourse
      return course._id
    } catch (error: any) {
      showMessage('error', `Failed to create course: ${error.message}`)
      return null
    }
  }

  // Create course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiClient.post('/courses', {
        title: courseForm.title,
        subject: courseForm.subject,
        description: courseForm.description || `${courseForm.subject} course`,
        teacherId: courseForm.teacherId
      })
      
      const newCourse = (response as any).data || response
      showMessage('success', `✅ Course created successfully! "${courseForm.title}" (${courseForm.subject})`)
      setCourseForm({ title: '', subject: '', description: '', teacherId: 'teacher1' })
      
      // Refresh courses list
      const coursesResponse = await apiClient.get('/courses')
      const coursesList = Array.isArray(coursesResponse) 
        ? coursesResponse 
        : (coursesResponse as any).data?.data || (coursesResponse as any).data || []
      setAllCourses(coursesList)
      
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  // Add grade
  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      showMessage('error', 'Please select a student first')
      return
    }
    if (!gradeForm.courseId) {
      showMessage('error', 'Please select a course')
      return
    }
    setLoading(true)
    try {
      const courseId = gradeForm.courseId
      const selectedCourse = allCourses.find(c => c._id === courseId)
      
      if (!selectedCourse) {
        showMessage('error', 'Selected course not found')
        setLoading(false)
        return
      }

      // Check enrollment
      const enrollment = enrollments.find(e => e.courseId === courseId)
      let enrollmentId = enrollment?._id

      if (!enrollmentId) {
        // Create enrollment
        const newEnrollment = await apiClient.post('/enrollments', {
          studentId: selectedStudentId,
          courseId: courseId,
          status: 'active'
        })
        enrollmentId = ((newEnrollment as any).data || newEnrollment)._id
        await loadStudentData(selectedStudentId)
      }

      // Create grade
      await apiClient.post('/grades', {
        enrollmentId: enrollmentId,
        studentId: selectedStudentId,
        courseId: courseId,
        score: parseFloat(gradeForm.score),
        maxScore: parseFloat(gradeForm.maxScore || '100')
      })

      showMessage('success', `✅ Entry has been successfully added! Grade: ${gradeForm.score}/${gradeForm.maxScore} in ${selectedCourse.subject || selectedCourse.title}`)
      setGradeForm({ score: '', maxScore: '100', courseId: '' })
      
      // Refresh dashboard data
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to add grade')
    } finally {
      setLoading(false)
    }
  }

  // Add assignment
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      showMessage('error', 'Please select a student first')
      return
    }
    if (!assignmentForm.courseId) {
      showMessage('error', 'Please select a course')
      return
    }
    setLoading(true)
    try {
      const courseId = assignmentForm.courseId
      const selectedCourse = allCourses.find(c => c._id === courseId)
      
      if (!selectedCourse) {
        showMessage('error', 'Selected course not found')
        setLoading(false)
        return
      }

      // Check enrollment
      const enrollment = enrollments.find(e => e.courseId === courseId)
      let enrollmentId = enrollment?._id

      if (!enrollmentId) {
        // Create enrollment
        const newEnrollment = await apiClient.post('/enrollments', {
          studentId: selectedStudentId,
          courseId: courseId,
          status: 'active'
        })
        enrollmentId = ((newEnrollment as any).data || newEnrollment)._id
        await loadStudentData(selectedStudentId)
      }

      // Create assignment
      await apiClient.post('/assignments', {
        courseId: courseId,
        title: assignmentForm.title,
        subject: selectedCourse.subject,
        dueDate: assignmentForm.dueDate || new Date().toISOString(),
        status: assignmentForm.status
      })

      showMessage('success', `✅ Entry has been successfully added! Assignment: "${assignmentForm.title}"`)
      setAssignmentForm({ title: '', dueDate: '', status: 'active', courseId: '' })
      
      // Refresh dashboard data
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to add assignment')
    } finally {
      setLoading(false)
    }
  }

  // Seed demo data
  const handleSeedDemo = async () => {
    setLoading(true)
    try {
      const response = await apiClient.post('/demo/seed')
      showMessage('success', `Demo data seeded! Parent: ${(response as any).data?.parentEmail || 'demo-parent@educonnect.com'}, Password: demo123`)
      await refreshStudents()
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to seed demo data')
    } finally {
      setLoading(false)
    }
  }

  // Migrate all student IDs to new format (100, 101, 102, etc.)
  const handleMigrateStudentIds = async () => {
    if (!window.confirm('This will update all existing students\' IDs to the new format (100, 101, 102, etc.). All other student information will be preserved. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post('/admin/students/migrate-ids')
      const data = response.data || response
      showMessage('success', `✅ Migrated ${data.updated || 0} students to new ID format!`)
      
      // Refresh students list to show updated IDs
      const studentsResponse = await apiClient.get('/students')
      const studentsList = Array.isArray(studentsResponse)
        ? studentsResponse
        : (studentsResponse as any).data?.data || (studentsResponse as any).data || []
      setAllStudents(studentsList)
      await refreshStudents()
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to migrate student IDs')
    } finally {
      setLoading(false)
    }
  }

  // Impersonate parent
  const handleImpersonate = async (parentEmail: string) => {
    setImpersonating(true)
    try {
      const response = await apiClient.post('/auth/impersonate', { email: parentEmail })
      const { token, user: targetUser } = response as any
      
      if (token && targetUser) {
        // Update auth context by setting token directly
        apiClient.setToken(token)
        localStorage.setItem('auth_token', token)
        
        // Navigate to dashboard as the impersonated user
        window.location.href = '/#/'
        showMessage('success', `Now impersonating ${targetUser.name}`)
      } else {
        throw new Error('Invalid response from impersonation endpoint')
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to impersonate user')
      setImpersonating(false)
    }
  }

  // Create alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      showMessage('error', 'Please select a student first')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/alerts', {
        studentId: selectedStudentId,
        title: alertForm.title,
        message: alertForm.message,
        type: alertForm.type,
        priority: alertForm.priority,
        actionRequired: false
      })
      showMessage('success', '✅ Entry has been successfully added! Alert created.')
      setAlertForm({ title: '', message: '', type: 'performance', priority: 'medium' })
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create alert')
    } finally {
      setLoading(false)
    }
  }

  // Create message
  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageForm.to || !selectedStudentId) {
      showMessage('error', 'Please select recipient and student')
      return
    }
    setLoading(true)
    try {
      const toUser = allParents.find(p => p.email === messageForm.to)
      if (!toUser) {
        showMessage('error', 'Recipient not found')
        setLoading(false)
        return
      }

      await apiClient.post('/messages', {
        to: {
          userId: toUser._id,
          name: toUser.name,
          role: 'parent'
        },
        subject: messageForm.subject,
        content: messageForm.content,
        studentId: selectedStudentId,
        priority: 'normal',
        category: 'general'
      })
      showMessage('success', '✅ Entry has been successfully added! Message sent.')
      setMessageForm({ to: '', subject: '', content: '', studentId: selectedStudentId || '' })
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  // Create fee
  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      showMessage('error', 'Please select a student first')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/fees', {
        studentId: selectedStudentId,
        description: feeForm.description,
        amount: parseFloat(feeForm.amount),
        feeType: feeForm.feeType,
        dueDate: feeForm.dueDate || new Date().toISOString()
      })
      showMessage('success', '✅ Entry has been successfully added! Fee created.')
      setFeeForm({ description: '', amount: '', feeType: 'tuition', dueDate: '' })
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create fee')
    } finally {
      setLoading(false)
    }
  }

  // Create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      showMessage('error', 'Please select a student first')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/events', {
        title: eventForm.title,
        type: eventForm.type,
        startDate: eventForm.startDate || new Date().toISOString(),
        endDate: eventForm.endDate || undefined,
        allDay: eventForm.allDay,
        studentId: selectedStudentId,
        createdBy: {
          userId: user?._id,
          name: user?.name,
          role: user?.role
        },
        priority: 'normal'
      })
      showMessage('success', '✅ Entry has been successfully added! Event created.')
      setEventForm({ title: '', type: 'school_event', startDate: '', endDate: '', allDay: false })
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  // Create parent account with email support
  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Use the new admin endpoint that sends welcome emails
      const response = await apiClient.post('/admin/parents/create', {
        name: parentForm.name,
        email: parentForm.email,
        studentIds: parentForm.selectedStudentIds || [],
        sendEmail: parentForm.sendEmail !== false, // Default to true
        language: parentForm.language || 'en',
      })
      
      const data = response.data || response
      const tempPassword = data.temporaryPassword
      const emailSent = data.emailSent
      
      let message = `✅ Parent account created successfully!`
      if (emailSent) {
        message += ` Welcome email sent to ${parentForm.email}`
      } else {
        message += ` Temporary password: ${tempPassword} (Email not sent - check email configuration)`
      }
      
      showMessage('success', message)
      setParentForm({ 
        name: '', 
        email: '', 
        selectedStudentIds: [],
        sendEmail: true,
        language: 'en'
      })
      
      // Refresh parents list
      const parentsResponse = await apiClient.get('/admin/parents')
      const parentsData = parentsResponse.data || parentsResponse
      const parents = Array.isArray(parentsData) ? parentsData : (parentsData as any).data || []
      setAllParents(parents)
      
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create parent account')
    } finally {
      setLoading(false)
    }
  }

  // Assign student to parent
  const handleAssignStudent = async () => {
    if (!selectedParentId || !selectedStudentForAssignment) {
      showMessage('error', 'Please select both parent and student')
      return
    }

    setLoading(true)
    try {
      await apiClient.put(`/students/${selectedStudentForAssignment}`, {
        userId: selectedParentId
      })
      
      const parent = allParents.find(p => p._id === selectedParentId)
      const student = allStudents.find(s => s._id === selectedStudentForAssignment)
      
      showMessage('success', `✅ Student "${student?.name}" assigned to parent "${parent?.name}"`)
      setSelectedStudentForAssignment('')
      setSelectedParentId('')
      
      // Refresh students list
      const studentsResponse = await apiClient.get('/students')
      const studentsList = Array.isArray(studentsResponse) 
        ? studentsResponse 
        : (studentsResponse as any).data?.data || (studentsResponse as any).data || []
      setAllStudents(studentsList)
      
      await refreshStudents()
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to assign student to parent')
    } finally {
      setLoading(false)
    }
  }

  // Delete parent account
  const handleDeleteParent = async (parentId: string, parentName: string) => {
    if (!window.confirm(`Are you sure you want to delete parent account "${parentName}"? This will unlink all associated students.`)) {
      return
    }

    setLoading(true)
    try {
      await apiClient.delete(`/admin/parents/${parentId}`)
      
      showMessage('success', `✅ Parent account "${parentName}" deleted successfully`)
      
      // Refresh parents list
      const parentsResponse = await apiClient.get('/admin/parents')
      const parentsData = parentsResponse.data || parentsResponse
      const parents = Array.isArray(parentsData) ? parentsData : (parentsData as any).data || []
      setAllParents(parents)
      
      // Refresh students list to update unlinked students
      const studentsResponse = await apiClient.get('/students')
      const studentsList = Array.isArray(studentsResponse) 
        ? studentsResponse 
        : (studentsResponse as any).data?.data || (studentsResponse as any).data || []
      setAllStudents(studentsList)
      
      window.dispatchEvent(new Event('refresh-dashboard'))
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to delete parent account')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'students', label: 'Students & Grades', icon: '👤' },
    { key: 'courses', label: 'Courses', icon: '📚' },
    { key: 'parents', label: 'Parents', icon: '👨‍👩‍👧' },
    { key: 'alerts', label: 'Alerts', icon: '⚠️' },
    { key: 'messages', label: 'Messages', icon: '💬' },
    { key: 'fees', label: 'Fees', icon: '💰' },
    { key: 'events', label: 'Events', icon: '📅' },
    { key: 'seed', label: 'Seed Data', icon: '🌱' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">📝 Admin Demo Interface</h1>
          <p className="text-slate-600">Create and manage all demo data for presentation</p>
        </div>

        {/* Impersonation Banner */}
        {user?.role === 'admin' && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Preview as Parent</h3>
                <p className="text-sm text-slate-600">Impersonate any parent account to preview their dashboard</p>
              </div>
              <div className="flex gap-2">
                {allParents.map(parent => (
                  <Button
                    key={parent._id}
                    size="sm"
                    variant="outline"
                    onClick={() => handleImpersonate(parent.email)}
                    disabled={impersonating}
                  >
                    {parent.name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 bg-white rounded-xl p-1 shadow-soft w-fit">
          {tabs.map(tab => {
            const routeMap: Record<string, string> = {
              'students': '#/admin/students',
              'courses': '#/admin/courses',
              'parents': '#/admin/parents',
              'alerts': '#/admin/alerts',
              'messages': '#/admin/messages',
              'fees': '#/admin/fees',
              'events': '#/admin/events',
              'seed': '#/admin'
            }
            
            return (
            <button
              key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any)
                  const targetRoute = routeMap[tab.key] || '#/admin'
                  window.location.hash = targetRoute
                }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.key
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
            )
          })}
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg border-2 flex items-center gap-3 animate-pulse ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}>
            <span className="text-2xl">{message.type === 'success' ? '✅' : '❌'}</span>
            <div>
              <div className="font-semibold text-lg">{message.text}</div>
              {message.type === 'success' && (
                <div className="text-sm text-emerald-600 mt-1">The entry will appear in the dashboard shortly.</div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
        {/* Student Selection/Creation */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 Student Selection</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Select Existing Student */}
            <div className="space-y-3">
              {/* Step 1: Select Grade (Required) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                  Step 1: Select Grade <span className="text-red-500">*</span>
              </label>
                <select
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                  value={selectedGradeForStudents}
                  onChange={(e) => {
                    setSelectedGradeForStudents(e.target.value)
                    setSelectedStudentId('') // Clear student selection when grade changes
                    setStudentSelectionModeForStudents('name') // Reset to default
                    setSearchQueryForStudents('') // Clear search
                  }}
                  required
                  disabled={studentsLoading}
                >
                  <option value="">-- Select Grade First --</option>
                  <option value="all">All Grades</option>
                  {getAvailableGrades(allStudents).map(grade => (
                    <option key={grade} value={grade.toString()}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Choose Selection Method (Only shown after grade is selected) */}
              {selectedGradeForStudents && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Step 2: Choose Selection Method
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="studentSelectionModeForStudents"
                          value="name"
                          checked={studentSelectionModeForStudents === 'name'}
                          onChange={() => setStudentSelectionModeForStudents('name')}
                          className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700">By Name (Alphabetical)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="studentSelectionModeForStudents"
                          value="id"
                          checked={studentSelectionModeForStudents === 'id'}
                          onChange={() => setStudentSelectionModeForStudents('id')}
                          className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700">By ID (Numerical)</span>
                      </label>
                    </div>
                  </div>

                  {/* Step 3: Search Students (Only shown after grade and method are selected) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Step 3: Search Students (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={`Search by ${studentSelectionModeForStudents === 'id' ? 'ID' : 'Name'}... (min. 2 characters)`}
                      className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                      value={searchQueryForStudents}
                      onChange={(e) => setSearchQueryForStudents(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Type at least 2 characters to filter by {studentSelectionModeForStudents === 'id' ? 'ID' : 'Name'} or {studentSelectionModeForStudents === 'id' ? 'Name' : 'ID'}
                    </p>
                  </div>

                  {/* Step 4: Select Student (Only shown after grade and method are selected) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Step 4: Select Student
                    </label>
                    <select
                      className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={studentsLoading}
                      required
              >
                <option value="">-- Select a student --</option>
                      {getFilteredAndSortedStudents(allStudents, selectedGradeForStudents, studentSelectionModeForStudents, searchQueryForStudents).map(s => (
                        <option key={s._id} value={s._id}>
                          {studentSelectionModeForStudents === 'id' ? (
                            `ID: ${s.studentId} • ${s.name} ${s.nameArabic ? `(${s.nameArabic})` : ''}`
                          ) : (
                            `${s.name} ${s.nameArabic ? `(${s.nameArabic})` : ''} • ID: ${s.studentId}`
                          )}
                        </option>
                ))}
              </select>
              {selectedStudent && (
                <p className="mt-2 text-sm text-slate-500">
                        Selected: <strong>{selectedStudent.name}</strong> (Grade {selectedStudent.gradeLevel}, ID: {selectedStudent.studentId})
                </p>
              )}
                    <p className="mt-1 text-xs text-slate-500">
                      Showing {getFilteredAndSortedStudents(allStudents, selectedGradeForStudents, studentSelectionModeForStudents, searchQueryForStudents).length} student(s) {selectedGradeForStudents === 'all' ? 'from All Grades' : `from Grade ${selectedGradeForStudents}`} {searchQueryForStudents && searchQueryForStudents.trim().length >= 2 && `(filtered by "${searchQueryForStudents}")`} (sorted by {studentSelectionModeForStudents === 'id' ? 'ID' : 'Name'})
                    </p>
                  </div>
                </>
              )}

              {!selectedGradeForStudents && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 text-center">
                    ⚠️ Please select a grade (or "All Grades") first to view and select students
                  </p>
                </div>
              )}
            </div>

            {/* Create New Student */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Create New Student
              </label>
              <form onSubmit={handleCreateStudent} className="space-y-2">
                <input
                  type="text"
                  placeholder="Student Name (e.g., Mariam)"
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Student ID (optional)"
                    className="flex-1 h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                    value={studentForm.studentId}
                    onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  />
                  <select
                    className="w-24 h-10 rounded-lg bg-slate-50 px-2 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                    value={studentForm.gradeLevel}
                    onChange={(e) => setStudentForm({ ...studentForm, gradeLevel: e.target.value })}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 h-10 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Add Grade Form */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Add Grade</h2>
          <form onSubmit={handleAddGrade} className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
              <select
                className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                value={gradeForm.courseId}
                onChange={(e) => setGradeForm({ ...gradeForm, courseId: e.target.value })}
                required
              >
                <option value="">-- Select a course --</option>
                {allCourses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title} ({course.subject})
                  </option>
                ))}
              </select>
              {allCourses.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">No courses available. Create one in the Courses tab.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Score</label>
              <input
                type="number"
                placeholder="e.g., 11, 85"
                className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                required
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Max Score</label>
              <input
                type="number"
                placeholder="100"
                className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                value={gradeForm.maxScore || ''}
                onChange={(e) => setGradeForm({ ...gradeForm, maxScore: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !selectedStudentId || !gradeForm.courseId}
                className="w-full h-10 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Add Grade
              </button>
            </div>
          </form>
        </div>

        {/* Add Assignment Form */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📝 Add Assignment</h2>
          <form onSubmit={handleAddAssignment} className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
              <select
                className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                value={assignmentForm.courseId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}
                required
              >
                <option value="">-- Select a course --</option>
                {allCourses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title} ({course.subject})
                  </option>
                ))}
              </select>
              {allCourses.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">No courses available. Create one in the Courses tab.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
              <input
                type="text"
                placeholder="e.g., Chapter 3 Exercises"
                className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
              <input
                type="date"
                className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                  value={assignmentForm.status}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading || !selectedStudentId || !assignmentForm.courseId}
                  className="w-full h-10 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  Add Assignment
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                window.open('/#/', '_blank')
              }}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <div className="font-medium text-slate-900">View Parent Dashboard</div>
              <div className="text-sm text-slate-600 mt-1">Open dashboard in new tab to see updates</div>
            </button>
            <button
              onClick={async () => {
                if (selectedStudentId) {
                  await loadStudentData(selectedStudentId)
                  showMessage('success', 'Student data refreshed!')
                }
              }}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <div className="font-medium text-slate-900">Refresh Data</div>
              <div className="text-sm text-slate-600 mt-1">Reload courses and enrollments</div>
            </button>
          </div>
        </div>

        {!selectedStudentId && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            ⚠️ Please select or create a student first before adding grades or assignments.
          </div>
        )}
          </>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <>
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">📚 Create New Course</h2>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Course Title</label>
                    <input
                      type="text"
                      className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      required
                      placeholder="e.g., Mathematics 101, Biology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <input
                      type="text"
                      className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      value={courseForm.subject}
                      onChange={(e) => setCourseForm({ ...courseForm, subject: e.target.value })}
                      required
                      placeholder="e.g., Math, Science, English"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Course description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Teacher ID</label>
                  <input
                    type="text"
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    value={courseForm.teacherId}
                    onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })}
                    required
                    placeholder="teacher1"
                  />
                  <p className="mt-1 text-xs text-slate-500">Use "teacher1" for demo purposes</p>
                </div>
                <Button type="submit" disabled={loading}>
                  Create Course
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-4">📋 All Courses</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Subject</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Teacher ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">
                          No courses found. Create one above.
                        </td>
                      </tr>
                    ) : (
                      allCourses.map(course => (
                        <tr key={course._id} className="border-b border-slate-100">
                          <td className="py-3 px-4 font-medium">{course.title}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {course.subject}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-sm">
                            {course.description || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-sm">{course.teacherId}</td>
                          <td className="py-3 px-4 text-slate-500 text-sm">
                            {new Date(course.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">⚠️ Create Alert</h2>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
                <select
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Select student --</option>
                  {students?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 border border-slate-200"
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={alertForm.type}
                    onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                  >
                    <option value="performance">Performance</option>
                    <option value="attendance">Attendance</option>
                    <option value="behavior">Behavior</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={alertForm.priority}
                    onChange={(e) => setAlertForm({ ...alertForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={loading || !selectedStudentId}>
                Create Alert
              </Button>
            </form>
          </Card>
        )}

        {/* Parents Tab */}
        {activeTab === 'parents' && (
          <>
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">👨‍👩‍👧 Create New Parent Account</h2>
              <p className="text-sm text-slate-600 mb-4">
                Create a parent account and automatically send a welcome email with login credentials. 
                Password will be generated automatically.
              </p>
              <form onSubmit={handleCreateParent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Parent Name</label>
                    <input
                      type="text"
                      className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      value={parentForm.name}
                      onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })}
                      required
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      value={parentForm.email}
                      onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                      required
                      placeholder="e.g., parent@example.com"
                    />
                    <p className="mt-1 text-xs text-slate-500">Welcome email will be sent to this address</p>
                  </div>
                </div>
                  <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Link Students (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* Step 1: Select Grade (Required) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Step 1: Select Grade <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                        value={selectedGradeForLinking}
                        onChange={(e) => {
                          setSelectedGradeForLinking(e.target.value)
                          // Clear selected students, reset selection mode, and clear search when grade changes
                          setParentForm({ ...parentForm, selectedStudentIds: [] })
                          setStudentSelectionMode('name') // Reset to default
                          setSearchQueryForLinking('') // Clear search
                        }}
                        required
                      >
                        <option value="">-- Select Grade First --</option>
                        <option value="all">All Grades</option>
                        {getAvailableGrades(allStudents).map(grade => (
                          <option key={grade} value={grade.toString()}>
                            Grade {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Step 2: Choose Selection Method (Only shown after grade is selected) */}
                    {selectedGradeForLinking && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            Step 2: Choose Selection Method
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="studentSelectionMode"
                                value="name"
                                checked={studentSelectionMode === 'name'}
                                onChange={(e) => setStudentSelectionMode('name')}
                                className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                              />
                              <span className="text-sm text-slate-700">By Name (Alphabetical)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="studentSelectionMode"
                                value="id"
                                checked={studentSelectionMode === 'id'}
                                onChange={(e) => setStudentSelectionMode('id')}
                                className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                              />
                              <span className="text-sm text-slate-700">By ID (Numerical)</span>
                            </label>
                  </div>
                        </div>
                        
                        {/* Step 3: Search Students (Only shown after grade and method are selected) */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            Step 3: Search Students (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder={`Search by ${studentSelectionMode === 'id' ? 'ID' : 'Name'}... (min. 2 characters)`}
                            className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                            value={searchQueryForLinking}
                            onChange={(e) => setSearchQueryForLinking(e.target.value)}
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Type at least 2 characters to filter by {studentSelectionMode === 'id' ? 'ID' : 'Name'} or {studentSelectionMode === 'id' ? 'Name' : 'ID'}
                          </p>
                        </div>

                        {/* Step 4: Select Students (Only shown after grade and method are selected) */}
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-64 overflow-y-auto">
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            Step 4: Select Students ({parentForm.selectedStudentIds.length} selected)
                          </label>
                          {getFilteredAndSortedStudents(allStudents, selectedGradeForLinking, studentSelectionMode, searchQueryForLinking).length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 text-center">
                              {searchQueryForLinking && searchQueryForLinking.trim().length >= 2 
                                ? `No students found ${selectedGradeForLinking === 'all' ? 'in All Grades' : `in Grade ${selectedGradeForLinking}`} matching "${searchQueryForLinking}"`
                                : `No students found ${selectedGradeForLinking === 'all' ? 'in All Grades' : `in Grade ${selectedGradeForLinking}`}`
                              }
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {getFilteredAndSortedStudents(allStudents, selectedGradeForLinking, studentSelectionMode, searchQueryForLinking).map(student => {
                                const isSelected = parentForm.selectedStudentIds.includes(student._id)
                                return (
                                  <label
                                    key={student._id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-brand-50 border-2 border-brand-500'
                                        : 'bg-white border-2 border-transparent hover:bg-slate-100'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setParentForm({
                                            ...parentForm,
                                            selectedStudentIds: [...parentForm.selectedStudentIds, student._id]
                                          })
                                        } else {
                                          setParentForm({
                                            ...parentForm,
                                            selectedStudentIds: parentForm.selectedStudentIds.filter(id => id !== student._id)
                                          })
                                        }
                                      }}
                                      className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500"
                                    />
                                    <div className="flex-1">
                                      {studentSelectionMode === 'id' ? (
                                        <>
                                          <div className="font-medium text-slate-900 text-sm">
                                            ID: {student.studentId}
                                          </div>
                                          <div className="text-xs text-slate-600">
                                            {student.name} {student.nameArabic ? `(${student.nameArabic})` : ''} • Grade {student.gradeLevel}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="font-medium text-slate-900 text-sm">
                                            {student.name} {student.nameArabic ? `(${student.nameArabic})` : ''}
                                          </div>
                                          <div className="text-xs text-slate-600">
                                            ID: {student.studentId} • Grade {student.gradeLevel}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                          <p className="mt-2 text-xs text-slate-500 text-center">
                            Showing {getFilteredAndSortedStudents(allStudents, selectedGradeForLinking, studentSelectionMode, searchQueryForLinking).length} student(s) {selectedGradeForLinking === 'all' ? 'from All Grades' : `from Grade ${selectedGradeForLinking}`} {searchQueryForLinking && searchQueryForLinking.trim().length >= 2 && `(filtered by "${searchQueryForLinking}")`} (sorted by {studentSelectionMode === 'id' ? 'ID' : 'Name'})
                          </p>
                        </div>
                      </>
                    )}
                    
                    {!selectedGradeForLinking && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 text-center">
                          ⚠️ Please select a grade (or "All Grades") first to view and select students
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={parentForm.sendEmail}
                      onChange={(e) => setParentForm({ ...parentForm, sendEmail: e.target.checked })}
                      className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500"
                    />
                    <label htmlFor="sendEmail" className="text-sm font-medium text-slate-700">
                      Send welcome email with login credentials
                    </label>
                  </div>
                  {parentForm.sendEmail && (
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Language / لغة البريد الإلكتروني
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                    <input
                            type="radio"
                            name="emailLanguage"
                            value="en"
                            checked={parentForm.language === 'en'}
                            onChange={(e) => setParentForm({ ...parentForm, language: 'en' })}
                            className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-sm text-slate-700">English</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="emailLanguage"
                            value="ar"
                            checked={parentForm.language === 'ar'}
                            onChange={(e) => setParentForm({ ...parentForm, language: 'ar' })}
                            className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-sm text-slate-700">العربية (Arabic)</span>
                        </label>
                  </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Choose the language for the welcome email. The parent's account will also be set to this language.
                      </p>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Parent Account & Send Email'}
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-4">🔗 Assign Student to Parent</h2>
              <div className="space-y-4">
                {/* Step 1: Select Parent */}
                  <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Step 1: Select Parent
                  </label>
                    <select
                      className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                    >
                      <option value="">-- Select parent --</option>
                      {allParents.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.email})
                        </option>
                      ))}
                    </select>
                  </div>

                {/* Step 2: Select Grade (Required) */}
                  <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Step 2: Select Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    value={selectedGradeForAssignment}
                    onChange={(e) => {
                      setSelectedGradeForAssignment(e.target.value)
                      setSelectedStudentForAssignment('') // Clear student selection when grade changes
                      setStudentSelectionMode('name') // Reset to default
                      setSearchQueryForAssignment('') // Clear search
                    }}
                    required
                  >
                    <option value="">-- Select Grade First --</option>
                    <option value="all">All Grades</option>
                    {getAvailableGrades(allStudents).map(grade => (
                      <option key={grade} value={grade.toString()}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3: Choose Selection Method (Only shown after grade is selected) */}
                {selectedGradeForAssignment && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Step 3: Choose Selection Method
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="studentAssignmentMode"
                            value="name"
                            checked={studentSelectionMode === 'name'}
                            onChange={() => setStudentSelectionMode('name')}
                            className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-sm text-slate-700">By Name (Alphabetical)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="studentAssignmentMode"
                            value="id"
                            checked={studentSelectionMode === 'id'}
                            onChange={() => setStudentSelectionMode('id')}
                            className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-sm text-slate-700">By ID (Numerical)</span>
                        </label>
                      </div>
                    </div>

                    {/* Step 4: Search Students (Only shown after grade and method are selected) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Step 4: Search Students (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder={`Search by ${studentSelectionMode === 'id' ? 'ID' : 'Name'}... (min. 2 characters)`}
                        className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                        value={searchQueryForAssignment}
                        onChange={(e) => setSearchQueryForAssignment(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Type at least 2 characters to filter by {studentSelectionMode === 'id' ? 'ID' : 'Name'} or {studentSelectionMode === 'id' ? 'Name' : 'ID'}
                      </p>
                    </div>

                    {/* Step 5: Select Student (Only shown after grade and method are selected) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Step 5: Select Student
                      </label>
                      <select
                        className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                        value={selectedStudentForAssignment}
                        onChange={(e) => setSelectedStudentForAssignment(e.target.value)}
                        required
                      >
                        <option value="">-- Select student --</option>
                        {getFilteredAndSortedStudents(allStudents, selectedGradeForAssignment, studentSelectionMode, searchQueryForAssignment).map(s => (
                          <option key={s._id} value={s._id}>
                            {studentSelectionMode === 'id' ? (
                              `ID: ${s.studentId} • ${s.name} ${s.nameArabic ? `(${s.nameArabic})` : ''}`
                            ) : (
                              `${s.name} ${s.nameArabic ? `(${s.nameArabic})` : ''} • ID: ${s.studentId}`
                            )}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-slate-500">
                        Showing {getFilteredAndSortedStudents(allStudents, selectedGradeForAssignment, studentSelectionMode, searchQueryForAssignment).length} student(s) {selectedGradeForAssignment === 'all' ? 'from All Grades' : `from Grade ${selectedGradeForAssignment}`} {searchQueryForAssignment && searchQueryForAssignment.trim().length >= 2 && `(filtered by "${searchQueryForAssignment}")`} (sorted by {studentSelectionMode === 'id' ? 'ID' : 'Name'})
                      </p>
                    </div>
                  </>
                )}

                {!selectedGradeForAssignment && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700 text-center">
                      ⚠️ Please select a grade (or "All Grades") first to view and select students
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleAssignStudent} 
                  disabled={loading || !selectedParentId || !selectedGradeForAssignment || !selectedStudentForAssignment}
                >
                  Assign Student to Parent
                </Button>
              </div>
            </Card>

            <Card className="mt-6">
              <h2 className="text-xl font-semibold mb-4">📋 All Parents</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Assigned Students</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allParents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500">
                          No parents found. Create one above.
                        </td>
                      </tr>
                    ) : (
                      allParents.map(parent => {
                        const assignedStudents = allStudents.filter(s => s.userId === parent._id)
                        return (
                          <tr key={parent._id} className="border-b border-slate-100">
                            <td className="py-3 px-4">{parent.name}</td>
                            <td className="py-3 px-4 text-slate-600">{parent.email}</td>
                            <td className="py-3 px-4">
                              {assignedStudents.length === 0 ? (
                                <span className="text-slate-400 italic">No students assigned</span>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {assignedStudents.map(student => (
                                    <span 
                                      key={student._id} 
                                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                    >
                                      {student.name} {student.nameArabic ? `(${student.nameArabic})` : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleDeleteParent(parent._id, parent.name)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete parent account"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">💬 Send Message</h2>
            <form onSubmit={handleCreateMessage} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">To (Parent)</label>
                  <select
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={messageForm.to}
                    onChange={(e) => setMessageForm({ ...messageForm, to: e.target.value })}
                    required
                  >
                    <option value="">-- Select parent --</option>
                    {allParents.map(p => <option key={p._id} value={p.email}>{p.name} ({p.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
                  <select
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={messageForm.studentId}
                    onChange={(e) => {
                      setMessageForm({ ...messageForm, studentId: e.target.value })
                      setSelectedStudentId(e.target.value)
                    }}
                    required
                  >
                    <option value="">-- Select student --</option>
                    {students?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 border border-slate-200"
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                Send Message
              </Button>
            </form>
          </Card>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">💰 Create Fee</h2>
            <form onSubmit={handleCreateFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
                <select
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Select student --</option>
                  {students?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                  value={feeForm.description}
                  onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                  placeholder="e.g., Tuition Fee - Semester 1"
                  required
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={feeForm.feeType}
                    onChange={(e) => setFeeForm({ ...feeForm, feeType: e.target.value })}
                  >
                    <option value="tuition">Tuition</option>
                    <option value="activity">Activity</option>
                    <option value="transport">Transport</option>
                    <option value="library">Library</option>
                    <option value="technology">Technology</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={feeForm.dueDate}
                    onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading || !selectedStudentId}>
                Create Fee
              </Button>
            </form>
          </Card>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">📅 Create Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
                <select
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Select student --</option>
                  {students?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  >
                    <option value="school_event">School Event</option>
                    <option value="exam">Exam</option>
                    <option value="holiday">Holiday</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventForm.allDay}
                      onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">All Day Event</span>
                  </label>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full h-10 rounded-lg bg-slate-50 px-3 border border-slate-200"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading || !selectedStudentId}>
                Create Event
              </Button>
            </form>
          </Card>
        )}

        {/* Seed Data Tab */}
        {activeTab === 'seed' && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">🌱 Seed Demo Data</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Quick Seed</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Creates a complete demo setup with parent, student, courses, assignments, grades, alerts, and messages.
                </p>
                <Button onClick={handleSeedDemo} disabled={loading}>
                  {loading ? 'Seeding...' : 'Seed Demo Data'}
                </Button>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">🔄 Migrate Student IDs</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Update all existing students' IDs to the new format (100, 101, 102, etc.). All other student information (name, grade, parent links, etc.) will be preserved.
                </p>
                <Button onClick={handleMigrateStudentIds} disabled={loading} variant="outline">
                  {loading ? 'Migrating...' : 'Migrate All Student IDs'}
                </Button>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Demo Account Credentials</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> demo-parent@educonnect.com</p>
                  <p><strong>Password:</strong> demo123</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

