// Courses API Service
import { apiClient } from '../../utils/apiClient'

export interface Course {
  _id: string
  title: string
  description?: string
  teacherId: string
  subject: string
  createdAt?: string
  updatedAt?: string
}

export const coursesApi = {
  getAll: (params?: { teacherId?: string; subject?: string }) => {
    return apiClient.get<{ success: boolean; count: number; data: Course[] }>('/courses', params)
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Course }>(`/courses/${id}`)
  },

  getForStudent: (studentId: string) => {
    return apiClient.get<{ success: boolean; count: number; data: Course[] }>(
      `/courses/student/${studentId}`
    )
  },

  getStudents: (courseId: string) => {
    return apiClient.get<{ success: boolean; count: number; data: any[] }>(
      `/courses/${courseId}/students`
    )
  },

  create: (data: { title: string; description?: string; teacherId: string; subject: string }) => {
    return apiClient.post<{ success: boolean; data: Course }>('/courses', data)
  },

  update: (id: string, data: Partial<Course>) => {
    return apiClient.put<{ success: boolean; data: Course }>(`/courses/${id}`, data)
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/courses/${id}`)
  },
}

