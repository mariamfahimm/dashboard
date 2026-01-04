// API service for Optimal Study Time Predictions
import { apiClient } from '../../utils/apiClient'

export interface TimeWindow {
  label: string
  startHour: number
  endHour: number
  averageScore: number
  submissionCount: number
  confidence: number
}

export interface OptimalStudyTimeInsight {
  bestTimeWindow: TimeWindow | null
  timeWindows: TimeWindow[]
  dayOfWeekPatterns: {
    day: string
    averageScore: number
    submissionCount: number
  }[]
  subjectSpecificInsights: {
    subject: string
    bestTimeWindow: TimeWindow | null
    averageScore: number
  }[]
  recommendations: string[]
  dataQuality: 'high' | 'medium' | 'low'
  note: string
}

export const optimalStudyTimeApi = {
  getForStudent: async (studentId: string, language?: string): Promise<OptimalStudyTimeInsight> => {
    const params = language ? { language } : {}
    const response = await apiClient.get<{ success: boolean; data: OptimalStudyTimeInsight }>(
      `/optimal-study-time/${studentId}`,
      params
    )
    return response.data
  }
}

