// Attendance API Service
import { apiClient } from '../../utils/apiClient'

export interface AttendanceRecord {
  _id: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  time?: string
  notes?: string
  markedBy?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
}

export interface AttendanceQueryParams {
  startDate?: string
  endDate?: string
  status?: 'present' | 'absent' | 'late' | 'excused'
}

export const attendanceApi = {
  /**
   * Get attendance records for a student
   */
  getByStudent: (studentId: string, params?: AttendanceQueryParams) => {
    const queryParams: Record<string, string> = {}
    if (params?.startDate) queryParams.startDate = params.startDate
    if (params?.endDate) queryParams.endDate = params.endDate
    if (params?.status) queryParams.status = params.status

    return apiClient.get<{
      success: boolean
      count: number
      data: AttendanceRecord[]
    }>(`/attendance/${studentId}`, queryParams)
  },

  /**
   * Get attendance statistics for a student
   */
  getStats: (studentId: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams: Record<string, string> = {}
    if (params?.startDate) queryParams.startDate = params.startDate
    if (params?.endDate) queryParams.endDate = params.endDate

    return apiClient.get<{
      success: boolean
      data: AttendanceStats
    }>(`/attendance/${studentId}/stats`, queryParams)
  },

  /**
   * Create or update an attendance record
   */
  createOrUpdate: (data: {
    studentId: string
    date: string
    status: 'present' | 'absent' | 'late' | 'excused'
    time?: string
    notes?: string
  }) => {
    return apiClient.post<{
      success: boolean
      data: AttendanceRecord
      message: string
    }>('/attendance', data)
  }
}

