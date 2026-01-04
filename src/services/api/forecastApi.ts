// Forecast API Service
import { apiClient } from '../../utils/apiClient'

export interface ForecastResult {
  target: string
  currentValue: number
  targetValue: number
  predictedValue: number
  predictedDate: string | null
  confidence: number
  onTrack: boolean
  message: string
  weeksToTarget?: number
}

export interface GoalProgress {
  goalId: string
  goalName: string
  current: number
  target: number
  unit: string
  predictedCompletion: string | null
  onTrack: boolean
  progressPercentage: number
  confidence: number
  forecast: ForecastResult
}

export const forecastApi = {
  // Get all forecasts for a student (default goals)
  getStudentForecasts: (studentId: string) => {
    return apiClient.get<{ success: boolean; data: GoalProgress[] }>(`/forecast/${studentId}`)
  },

  // Forecast grade target
  forecastGrade: (data: { studentId: string; subject: string; targetGrade: number }) => {
    return apiClient.post<{ success: boolean; data: ForecastResult }>('/forecast/grade', data)
  },

  // Forecast study time target
  forecastStudyTime: (data: { studentId: string; targetHours: number }) => {
    return apiClient.post<{ success: boolean; data: ForecastResult }>('/forecast/study-time', data)
  },

  // Forecast completion rate target
  forecastCompletionRate: (data: { studentId: string; targetRate: number }) => {
    return apiClient.post<{ success: boolean; data: ForecastResult }>('/forecast/completion-rate', data)
  },

  // Get goal progress with predictions
  getGoalProgress: (data: { studentId: string; goals: Array<{ id: string; name: string; target: number; unit: string; type: 'grade' | 'time' | 'completion'; subject?: string }> }) => {
    return apiClient.post<{ success: boolean; data: GoalProgress[] }>('/forecast/goals', data)
  }
}

