// Events API Service
import { apiClient } from '../../utils/apiClient'

export interface Event {
  _id: string
  title: string
  description?: string
  type: 'assignment' | 'exam' | 'holiday' | 'school_event' | 'meeting' | 'deadline' | 'reminder'
  startDate: string
  endDate?: string
  allDay: boolean
  location?: string
  studentId?: string
  courseId?: string
  createdBy: {
    userId: string
    name: string
    role: 'parent' | 'teacher' | 'admin'
  }
  reminders?: Array<{
    time: string
    method: 'notification' | 'email' | 'sms'
    sent: boolean
  }>
  color?: string
  priority: 'low' | 'normal' | 'high'
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: string
    count?: number
  }
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

export interface EventsResponse {
  success: boolean
  count: number
  data: Event[]
}

export const eventsApi = {
  getAll: (params?: {
    studentId?: string
    startDate?: string
    endDate?: string
    type?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.studentId) queryParams.append('studentId', params.studentId)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.type) queryParams.append('type', params.type)

    const query = queryParams.toString()
    return apiClient.get<EventsResponse>(`/events${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Event }>(`/events/${id}`)
  },

  create: (data: {
    title: string
    description?: string
    type?: 'assignment' | 'exam' | 'holiday' | 'school_event' | 'meeting' | 'deadline' | 'reminder'
    startDate: string
    endDate?: string
    allDay?: boolean
    location?: string
    studentId?: string
    courseId?: string
    reminders?: Array<{
      time: string
      method: 'notification' | 'email' | 'sms'
    }>
    color?: string
    priority?: 'low' | 'normal' | 'high'
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
      interval: number
      endDate?: string
      count?: number
    }
    attachments?: string[]
  }) => {
    return apiClient.post<{ success: boolean; data: Event }>('/events', data)
  },

  update: (id: string, data: Partial<Event>) => {
    return apiClient.put<{ success: boolean; data: Event }>(`/events/${id}`, data)
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/events/${id}`)
  }
}

