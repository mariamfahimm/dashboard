// Messages API Service
import { apiClient } from '../../utils/apiClient'

export interface Message {
  _id: string
  from: {
    userId: string
    name: string
    role: 'parent' | 'teacher' | 'admin'
    avatar?: string
  }
  to: {
    userId: string
    name: string
    role: 'parent' | 'teacher' | 'admin'
  }
  studentId?: string
  subject: string
  content: string
  read: boolean
  readAt?: string
  priority: 'low' | 'normal' | 'high'
  category: 'general' | 'academic' | 'attendance' | 'behavior' | 'assignment'
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

export interface MessagesResponse {
  success: boolean
  count: number
  unreadCount: number
  data: Message[]
}

export const messagesApi = {
  getAll: (params?: {
    studentId?: string
    read?: boolean
    category?: string
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.studentId) queryParams.append('studentId', params.studentId)
    if (params?.read !== undefined) queryParams.append('read', String(params.read))
    if (params?.category) queryParams.append('category', params.category)
    if (params?.limit) queryParams.append('limit', String(params.limit))

    const query = queryParams.toString()
    return apiClient.get<MessagesResponse>(`/messages${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Message }>(`/messages/${id}`)
  },

  create: (data: {
    to: { userId: string; name: string; role: 'parent' | 'teacher' | 'admin' }
    studentId?: string
    subject: string
    content: string
    priority?: 'low' | 'normal' | 'high'
    category?: 'general' | 'academic' | 'attendance' | 'behavior' | 'assignment'
    attachments?: File[]
  }) => {
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('to', JSON.stringify(data.to))
    if (data.studentId) formData.append('studentId', data.studentId)
    formData.append('subject', data.subject)
    formData.append('content', data.content)
    if (data.priority) formData.append('priority', data.priority)
    if (data.category) formData.append('category', data.category)
    
    // Append files if provided
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file)
      })
    }

    return apiClient.postFormData<{ success: boolean; data: Message }>('/messages', formData)
  },

  markAsRead: (id: string) => {
    return apiClient.patch<{ success: boolean; data: Message }>(`/messages/${id}/read`)
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/messages/${id}`)
  }
}

