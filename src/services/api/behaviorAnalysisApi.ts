// Behavior Pattern Analysis API Service
import { apiClient } from '../../utils/apiClient'

export interface BehaviorPattern {
  studentId: string
  incidentRisk: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  patterns: string[]
  triggers: string[]
  predictions: {
    nextWeekIncidentProbability: number
    highRiskDays: string[]
    highRiskSubjects: string[]
    recommendedActions: string[]
  }
  confidence: number
  timeline: string
}

export const behaviorAnalysisApi = {
  /**
   * Get behavior pattern analysis for a student
   */
  getForStudent: (studentId: string) => {
    return apiClient.get<{
      success: boolean
      data: BehaviorPattern
    }>(`/behavior-analysis/${studentId}`)
  }
}

