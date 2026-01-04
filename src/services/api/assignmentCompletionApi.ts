// Assignment Completion Prediction API Service
import { apiClient } from '../../utils/apiClient'

export interface AssignmentCompletionPrediction {
  assignmentId: string
  assignmentTitle: string
  willCompleteOnTime: boolean
  probability: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  riskFactors: string[]
  confidence: number
  recommendedAction: string
  daysUntilDue: number
}

export const assignmentCompletionApi = {
  /**
   * Get completion prediction for a specific assignment
   */
  getForAssignment: (studentId: string, assignmentId: string) => {
    return apiClient.get<{
      success: boolean
      data: AssignmentCompletionPrediction
    }>(`/assignment-completion/${studentId}/${assignmentId}`)
  },

  /**
   * Get completion predictions for all active assignments
   */
  getAll: (studentId: string) => {
    return apiClient.get<{
      success: boolean
      count: number
      data: AssignmentCompletionPrediction[]
    }>(`/assignment-completion/${studentId}`)
  }
}

