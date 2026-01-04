// Notices API Service
import { apiClient } from '../../utils/apiClient'

export interface Notice {
  _id: string
  title: string
  content: string
  type: 'announcement' | 'event' | 'alert' | 'info' | 'reminder'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  targetAudience: 'all' | 'parents' | 'students' | 'teachers' | string[]
  studentId?: string
  startDate?: string
  endDate?: string
  published: boolean
  publishedAt?: string
  attachments?: string[]
  createdBy: {
    userId: string
    name: string
    role: 'admin' | 'teacher'
  }
  createdAt: string
  updatedAt: string
}

export interface NoticesResponse {
  success: boolean
  count: number
  data: Notice[]
}

export const noticesApi = {
  getAll: (params?: {
    studentId?: string
    type?: string
    priority?: string
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.studentId) queryParams.append('studentId', params.studentId)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.priority) queryParams.append('priority', params.priority)
    if (params?.limit) queryParams.append('limit', String(params.limit))

    const query = queryParams.toString()
    return apiClient.get<NoticesResponse>(`/notices${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Notice }>(`/notices/${id}`)
  }
}

