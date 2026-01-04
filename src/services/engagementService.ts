// Engagement Service - Updated to use real API
import { apiClient } from '../utils/apiClient'

export interface EngagementMetrics {
  studentId: string
  currentEngagement: number
  predictedEngagement: number
  engagementTrend: 'increasing' | 'stable' | 'decreasing'
  factors: {
    factor: string
    impact: number
    weight: number
  }[]
  sessionData: {
    date: string
    duration: number
    activities: number
    completionRate: number
  }[]
  lastActive: string
}

export interface EngagementPrediction {
  timeframe: 'daily' | 'weekly' | 'monthly'
  predictedValue: number
  confidence: number
  factors: string[]
}

export interface EngagementInsight {
  type: 'positive' | 'warning' | 'critical'
  message: string
  recommendation?: string
}

/**
 * Fetch engagement metrics from backend API
 */
export async function fetchEngagementMetrics(
  studentId: string
): Promise<EngagementMetrics> {
  try {
    const response = await apiClient.get<EngagementMetrics>(`/engagement/${studentId}`)
    return response
  } catch (error) {
    console.error('Error fetching engagement metrics:', error)
    throw error
  }
}

/**
 * Predict engagement for a timeframe
 */
export async function predictEngagement(
  studentId: string,
  timeframe: 'daily' | 'weekly' | 'monthly'
): Promise<EngagementPrediction> {
  try {
    const response = await apiClient.get<EngagementPrediction>(
      `/engagement/${studentId}/predict?timeframe=${timeframe}`
    )
    return response
  } catch (error) {
    console.error('Error predicting engagement:', error)
    throw error
  }
}

/**
 * Get engagement insights
 */
export async function getEngagementInsights(
  studentId: string
): Promise<EngagementInsight[]> {
  try {
    const response = await apiClient.get<EngagementInsight[]>(
      `/engagement/${studentId}/insights`
    )
    return response
  } catch (error) {
    console.error('Error fetching engagement insights:', error)
    throw error
  }
}
