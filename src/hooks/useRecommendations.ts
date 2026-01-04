// Personalized Recommendations Hook
import { useState, useEffect, useCallback } from 'react'
import {
  getRecommendations,
  acceptRecommendation,
  dismissRecommendation,
  getRecommendationEffectiveness,
  type Recommendation,
  type RecommendationContext
} from '@/services/recommendationService'
import { calculatePriority } from '@/utils/aiLogic'

export function useRecommendations(context: RecommendationContext) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true)
        setError(null)
        
        const recs = await getRecommendations(context)
        
        // Enhance with AI-calculated priorities if needed
        const enhancedRecs = recs.map(rec => {
          const aiPriority = calculatePriority(
            rec.priority / 10, // Normalize to 0-1
            rec.confidence,
            0.8 // Default feasibility
          )
          return {
            ...rec,
            priority: Math.max(rec.priority, Math.round(aiPriority))
          }
        })
        
        // Sort by priority (highest first)
        enhancedRecs.sort((a, b) => b.priority - a.priority)
        
        setRecommendations(enhancedRecs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    if (context.studentId) {
      loadRecommendations()
    }
  }, [context.studentId, context.currentPerformance, context.engagementLevel])

  const accept = useCallback(async (recommendationId: string) => {
    try {
      await acceptRecommendation(recommendationId)
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, metadata: { ...rec.metadata, accepted: true } }
            : rec
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept recommendation')
    }
  }, [])

  const dismiss = useCallback(async (recommendationId: string) => {
    try {
      await dismissRecommendation(recommendationId)
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss recommendation')
    }
  }, [])

  const getEffectiveness = useCallback(async (recommendationId: string) => {
    try {
      return await getRecommendationEffectiveness(recommendationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get effectiveness')
      return null
    }
  }, [])

  const topRecommendations = recommendations.slice(0, 5)
  const byCategory = {
    study_plan: recommendations.filter(r => r.category === 'study_plan'),
    resource: recommendations.filter(r => r.category === 'resource'),
    activity: recommendations.filter(r => r.category === 'activity'),
    goal: recommendations.filter(r => r.category === 'goal'),
    intervention: recommendations.filter(r => r.category === 'intervention')
  }

  return {
    recommendations,
    topRecommendations,
    byCategory,
    loading,
    error,
    accept,
    dismiss,
    getEffectiveness,
    refresh: () => {
      if (context.studentId) {
        getRecommendations(context)
          .then(recs => {
            const enhanced = recs.map(rec => ({
              ...rec,
              priority: Math.max(rec.priority, Math.round(
                calculatePriority(rec.priority / 10, rec.confidence, 0.8)
              ))
            }))
            enhanced.sort((a, b) => b.priority - a.priority)
            setRecommendations(enhanced)
          })
          .catch(err => 
            setError(err instanceof Error ? err.message : 'Failed to refresh recommendations')
          )
      }
    }
  }
}

