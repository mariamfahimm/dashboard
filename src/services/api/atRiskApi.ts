// At-Risk Student Detection API Service
import { apiClient } from '../../utils/apiClient'

export interface AtRiskPrediction {
  studentId: string
  studentName?: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  probability: number
  factors: string[]
  confidence: number
  recommendations: string[]
  timeline: string
}

export const atRiskApi = {
  /**
   * Get at-risk prediction for a specific student
   */
  getForStudent: (studentId: string) => {
    return apiClient.get<{
      success: boolean
      data: AtRiskPrediction
    }>(`/at-risk/${studentId}`)
  },

  /**
   * Get at-risk predictions for all students
   */
  getAll: () => {
    return apiClient.get<{
      success: boolean
      count: number
      data: AtRiskPrediction[]
    }>('/at-risk')
  }
}

