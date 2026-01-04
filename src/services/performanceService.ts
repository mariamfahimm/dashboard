// Performance Service - Updated to use real API
import { apiClient } from '../utils/apiClient'

export interface PerformanceMetrics {
  studentId: string
  overallScore: number
  trend: 'improving' | 'stable' | 'declining'
  subjectBreakdown: {
    subject: string
    score: number
    change: number
  }[]
  weeklyProgress: {
    week: string
    score: number
  }[]
  riskLevel: 'low' | 'medium' | 'high'
  lastUpdated: string
}

export interface PerformanceInsight {
  type: 'strength' | 'weakness' | 'trend' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
}

/**
 * Fetch performance metrics from backend API
 */
export async function fetchPerformanceMetrics(studentId: string): Promise<PerformanceMetrics> {
  try {
    const response = await apiClient.get<PerformanceMetrics>(`/performance/${studentId}`)
    
    // Transform backend response to match frontend interface
    // If backend returns different structure, adjust here
    return response
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    // Fallback to mock data if API fails (for development)
    throw error
  }
}

/**
 * Fetch performance insights from backend API
 */
export async function fetchPerformanceInsights(studentId: string): Promise<PerformanceInsight[]> {
  try {
    const response = await apiClient.get<{ success: boolean; data: PerformanceInsight[] }>(
      `/performance/${studentId}/insights`
    )
    // Extract data array from response
    if (response && response.data && Array.isArray(response.data)) {
      return response.data
    }
    // Fallback: if response is already an array, return it
    if (Array.isArray(response)) {
      return response
    }
    return []
  } catch (error) {
    console.error('Error fetching performance insights:', error)
    throw error
  }
}

/**
 * Calculate risk score from backend API
 */
export async function calculateRiskScore(
  metrics: PerformanceMetrics
): Promise<number> {
  try {
    const response = await apiClient.get<{ riskScore: number }>(
      `/performance/${metrics.studentId}/risk`
    )
    return response.riskScore
  } catch (error) {
    console.error('Error calculating risk score:', error)
    // Fallback calculation
    if (metrics.riskLevel === 'high') return 0.8
    if (metrics.riskLevel === 'medium') return 0.5
    return 0.2
  }
}
