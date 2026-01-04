// Recommendation Service - Updated to use real API
import { apiClient } from '../utils/apiClient'

export type RecommendationCategory =
  | 'study_plan'
  | 'resource'
  | 'activity'
  | 'goal'
  | 'intervention'

export interface Recommendation {
  _id: string
  category: RecommendationCategory
  title: string
  description: string
  priority: number
  confidence: number
  studentId: string
  reasoning: string
  actionUrl?: string
  metadata?: Record<string, any>
  accepted: boolean
  dismissed: boolean
  createdAt: string
}

export interface RecommendationContext {
  studentId: string
  currentPerformance: number
  engagementLevel: number
  recentActivity: string[]
  learningGoals: string[]
}

/**
 * Fetch recommendations for a student
 */
export async function fetchRecommendations(studentId: string): Promise<Recommendation[]> {
  try {
    const response = await apiClient.get<{
      success: boolean
      count: number
      data: Recommendation[]
    }>(`/recommendations/student/${studentId}`)
    return response.data || []
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    throw error
  }
}

/**
 * Generate recommendations for a student
 */
export async function generateRecommendations(
  context: RecommendationContext
): Promise<Recommendation[]> {
  try {
    const response = await apiClient.post<{
      success: boolean
      generated: number
      data: Recommendation[]
    }>('/recommendations/generate', context)
    return response.data || []
  } catch (error) {
    console.error('Error generating recommendations:', error)
    throw error
  }
}

/**
 * Accept a recommendation
 */
export async function acceptRecommendation(
  recommendationId: string,
  studentId: string
): Promise<void> {
  try {
    await apiClient.post(`/recommendations/${recommendationId}/accept`, { studentId })
  } catch (error) {
    console.error('Error accepting recommendation:', error)
    throw error
  }
}

/**
 * Dismiss a recommendation
 */
export async function dismissRecommendation(
  recommendationId: string,
  studentId: string
): Promise<void> {
  try {
    await apiClient.post(`/recommendations/${recommendationId}/dismiss`, { studentId })
  } catch (error) {
    console.error('Error dismissing recommendation:', error)
    throw error
  }
}

/**
 * Get recommendation effectiveness
 */
export async function getRecommendationEffectiveness(
  recommendationId: string,
  studentId: string
): Promise<{ accepted: boolean; impact: number; feedback?: string } | null> {
  try {
    const response = await apiClient.get<{
      success: boolean
      data: { accepted: boolean; impact: number; feedback?: string }
    }>(`/recommendations/${recommendationId}/effectiveness?studentId=${studentId}`)
    return response.data || null
  } catch (error) {
    console.error('Error fetching recommendation effectiveness:', error)
    return null
  }
}
