// Parent Recommendations API Service
import { apiClient } from '../../utils/apiClient'

export interface ParentRecommendation {
  type: 'study_schedule' | 'subject_focus' | 'resource' | 'intervention' | 'encouragement' | 'monitoring'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionItems: string[]
  expectedImpact: string
  timeframe: string
  confidence: number
  relatedSubject?: string
}

export interface ParentRecommendationsResponse {
  studentId: string
  studentName?: string
  recommendations: ParentRecommendation[]
  count: number
}

export const parentRecommendationApi = {
  /**
   * Get recommendations for a specific student
   */
  getForStudent: (studentId: string, language?: string) => {
    const params = language ? { language } : {}
    return apiClient.get<{
      success: boolean
      data: ParentRecommendationsResponse
    }>(`/parent-recommendations/${studentId}`, params)
  },

  /**
   * Get recommendations for all students
   */
  getAll: () => {
    return apiClient.get<{
      success: boolean
      count: number
      data: ParentRecommendationsResponse[]
    }>('/parent-recommendations')
  }
}

