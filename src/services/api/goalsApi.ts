// Goals API Service
import { apiClient } from '../../utils/apiClient'

export type GoalType = 'grade' | 'time' | 'completion'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'

export interface Goal {
  _id: string
  studentId: string
  name: string
  description?: string
  type: GoalType
  subject?: string
  target: number
  current: number
  unit: string
  status: GoalStatus
  startDate: string
  targetDate?: string
  estimatedCompletionDate?: string
  percentChance?: number
  progressPercentage: number
  onTrack: boolean
  confidence?: number
  metadata?: Record<string, any>
  prediction?: {
    percentChance: number
    estimatedCompletionDate: string | null
    onTrack: boolean
    confidence: number
    message: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface GoalCreateData {
  studentId: string
  name: string
  description?: string
  type: GoalType
  subject?: string
  target: number
  current?: number
  unit?: string
  targetDate?: string
  status?: GoalStatus
}

export interface GoalUpdateData {
  name?: string
  description?: string
  target?: number
  current?: number
  unit?: string
  targetDate?: string
  status?: GoalStatus
  subject?: string
}

export const goalsApi = {
  /**
   * Get all goals with optional filters
   */
  getAll: (params?: { studentId?: string; status?: GoalStatus; type?: GoalType }) => {
    return apiClient.get<{ success: boolean; count: number; data: Goal[] }>('/goals', params)
  },

  /**
   * Get goal by ID with predictions
   */
  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Goal }>(`/goals/${id}`)
  },

  /**
   * Get goals for a student with predictions
   */
  getForStudent: (studentId: string) => {
    return apiClient.get<{ success: boolean; count: number; data: Goal[] }>(
      `/students/${studentId}/goals`
    )
  },

  /**
   * Alternative route: Get goals for a student via goals endpoint
   */
  getForStudentViaGoals: (studentId: string) => {
    return apiClient.get<{ success: boolean; count: number; data: Goal[] }>(
      `/goals/student/${studentId}`
    )
  },

  /**
   * Create a new goal
   */
  create: (data: GoalCreateData) => {
    return apiClient.post<{ success: boolean; data: Goal }>('/goals', data)
  },

  /**
   * Update a goal
   */
  update: (id: string, data: GoalUpdateData) => {
    return apiClient.put<{ success: boolean; data: Goal }>(`/goals/${id}`, data)
  },

  /**
   * Delete a goal
   */
  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/goals/${id}`)
  },

  /**
   * Manually recalculate goal predictions
   */
  recalculate: (id: string) => {
    return apiClient.post<{ success: boolean; data: Goal }>(`/goals/${id}/recalculate`)
  },
}

