// Assignments API Service
import { apiClient } from '../../utils/apiClient'

export interface Assignment {
  _id: string
  courseId: string
  title: string
  description?: string
  subject: string
  dueDate: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt?: string
  updatedAt?: string
}

export const assignmentsApi = {
  getAll: (params?: { courseId?: string; subject?: string; status?: string }) => {
    return apiClient.get<{ success: boolean; count: number; data: Assignment[] }>(
      '/assignments',
      params
    )
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Assignment }>(`/assignments/${id}`)
  },

  getForCourse: (courseId: string) => {
    return apiClient.get<{ success: boolean; count: number; data: Assignment[] }>(
      `/assignments/course/${courseId}`
    )
  },

  create: (data: {
    courseId: string
    title: string
    description?: string
    subject: string
    dueDate: string
    status?: string
  }) => {
    return apiClient.post<{ success: boolean; data: Assignment }>('/assignments', data)
  },

  update: (id: string, data: Partial<Assignment>) => {
    return apiClient.put<{ success: boolean; data: Assignment }>(`/assignments/${id}`, data)
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/assignments/${id}`)
  },
}

