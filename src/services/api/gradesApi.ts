// Grades API Service
import { apiClient } from '../../utils/apiClient'

export interface Grade {
  _id: string
  enrollmentId: string
  assignmentId: string
  studentId: string
  courseId: string
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
  gradedAt?: string
}

export const gradesApi = {
  getAll: (params?: {
    studentId?: string
    courseId?: string
    assignmentId?: string
    enrollmentId?: string
  }) => {
    return apiClient.get<{ success: boolean; count: number; data: Grade[] }>('/grades', params)
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Grade }>(`/grades/${id}`)
  },

  getForStudent: (studentId: string) => {
    return apiClient.get<{
      success: boolean
      count: number
      average: number
      data: Grade[]
    }>(`/grades/student/${studentId}`)
  },

  create: (data: {
    enrollmentId: string
    assignmentId: string
    studentId: string
    courseId?: string
    score: number
    maxScore?: number
    submittedAt?: string
  }) => {
    return apiClient.post<{ success: boolean; data: Grade }>('/grades', data)
  },

  update: (id: string, data: { score?: number; maxScore?: number; gradedAt?: string }) => {
    return apiClient.put<{ success: boolean; data: Grade }>(`/grades/${id}`, data)
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/grades/${id}`)
  },
}

