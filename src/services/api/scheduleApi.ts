// Schedule/Timetable API Service
import { apiClient } from '../../utils/apiClient'

export interface ScheduleEntry {
  _id: string
  studentId: string
  courseId: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  period: number
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  room?: string
  teacherId?: string
  teacherName?: string
  active: boolean
  effectiveFrom?: string
  effectiveUntil?: string
  course?: {
    _id: string
    title: string
    subject: string
    description?: string
  }
  createdAt: string
  updatedAt: string
}

export interface WeeklySchedule {
  0: ScheduleEntry[] // Sunday
  1: ScheduleEntry[] // Monday
  2: ScheduleEntry[] // Tuesday
  3: ScheduleEntry[] // Wednesday
  4: ScheduleEntry[] // Thursday
  5: ScheduleEntry[] // Friday
  6: ScheduleEntry[] // Saturday
}

export const scheduleApi = {
  /**
   * Get schedule for a student
   */
  getByStudent: (studentId: string, dayOfWeek?: number) => {
    const params: Record<string, string> = {}
    if (dayOfWeek !== undefined) {
      params.dayOfWeek = dayOfWeek.toString()
    }
    return apiClient.get<{
      success: boolean
      count: number
      data: ScheduleEntry[]
    }>(`/schedule/${studentId}`, params)
  },

  /**
   * Get weekly schedule organized by day
   */
  getWeekly: (studentId: string) => {
    return apiClient.get<{
      success: boolean
      data: WeeklySchedule
    }>(`/schedule/${studentId}/weekly`)
  },

  /**
   * Create or update a schedule entry
   */
  createOrUpdate: (data: {
    studentId: string
    courseId: string
    dayOfWeek: number
    period: number
    startTime: string
    endTime: string
    room?: string
    teacherId?: string
    teacherName?: string
    effectiveFrom?: string
    effectiveUntil?: string
  }) => {
    return apiClient.post<{
      success: boolean
      data: ScheduleEntry
      message: string
    }>('/schedule', data)
  },

  /**
   * Delete a schedule entry
   */
  delete: (scheduleId: string) => {
    return apiClient.delete<{
      success: boolean
      message: string
    }>(`/schedule/${scheduleId}`)
  }
}

