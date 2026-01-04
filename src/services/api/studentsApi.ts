// Students API Service
import { apiClient } from '../../utils/apiClient'

export interface Student {
  _id: string
  name: string
  nameArabic?: string
  studentId: string
  gradeLevel: number
  userId?: string
  avatar?: string
  performance?: any
  engagement?: any
}

export const studentsApi = {
  getAll: (params?: { gradeLevel?: number; userId?: string }) => {
    return apiClient.get<{ success: boolean; count: number; data: Student[] }>('/students', params)
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Student }>(`/students/${id}`)
  },

  getByStudentId: (studentId: string) => {
    return apiClient.get<{ success: boolean; data: Student }>(`/students/studentId/${studentId}`)
  },

  create: (data: { name: string; studentId: string; gradeLevel: number; userId?: string }) => {
    return apiClient.post<{ success: boolean; data: Student }>('/students', data)
  },

  update: (id: string, data: Partial<Student>) => {
    return apiClient.put<{ success: boolean; data: Student }>(`/students/${id}`, data)
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/students/${id}`)
  },

  /**
   * Generate linking code for a student (admin/teacher only)
   */
  generateLinkingCode: (studentId: string) => {
    return apiClient.post<{ 
      success: boolean
      data: { code: string; expiryDate: string }
      message: string
    }>(`/students/${studentId}/generate-linking-code`)
  },

  /**
   * Link a student to parent account using linking code
   */
  linkByCode: (linkingCode: string) => {
    return apiClient.post<{ 
      success: boolean
      data: Student
      message: string
    }>('/students/link', { linkingCode })
  },

  /**
   * Verify if a linking code is valid
   */
  verifyLinkingCode: (code: string) => {
    return apiClient.get<{ 
      success: boolean
      data: { name: string; gradeLevel: number; studentId: string; valid: boolean }
    }>(`/students/linking-code/${code}`)
  },
}

