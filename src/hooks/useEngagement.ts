// Engagement Prediction Hook
import { useState, useEffect } from 'react'
import {
  fetchEngagementMetrics,
  predictEngagement,
  getEngagementInsights,
  type EngagementMetrics,
  type EngagementPrediction
} from '@/services/engagementService'
import { predictTrend, type PredictionInput } from '@/utils/aiLogic'

export function useEngagement(studentId: string) {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null)
  const [predictions, setPredictions] = useState<{
    daily: EngagementPrediction | null
    weekly: EngagementPrediction | null
    monthly: EngagementPrediction | null
  }>({
    daily: null,
    weekly: null,
    monthly: null
  })
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEngagementData() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch metrics
        const metricsData = await fetchEngagementMetrics(studentId)
        setMetrics(metricsData)
        
        // Fetch predictions for all timeframes
        const [dailyPred, weeklyPred, monthlyPred, insightsData] = await Promise.all([
          predictEngagement(studentId, 'daily'),
          predictEngagement(studentId, 'weekly'),
          predictEngagement(studentId, 'monthly'),
          getEngagementInsights(studentId)
        ])
        
        setPredictions({
          daily: dailyPred,
          weekly: weeklyPred,
          monthly: monthlyPred
        })
        setInsights(insightsData)
        
        // Use AI logic for additional prediction
        if (metricsData.sessionData.length > 0) {
          const historicalData = metricsData.sessionData.map(s => s.completionRate * 100)
          const aiInput: PredictionInput = {
            historicalData,
            currentValue: metricsData.currentEngagement,
            trend: metricsData.engagementTrend,
            factors: Object.fromEntries(
              metricsData.factors.map(f => [f.factor, f.impact])
            )
          }
          // AI prediction can be used for comparison
          const aiPrediction = predictTrend(aiInput)
          // Store in predictions if needed
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load engagement data')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      loadEngagementData()
    }
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return
    
    try {
      setLoading(true)
      const metricsData = await fetchEngagementMetrics(studentId)
      setMetrics(metricsData)
      
      const [dailyPred, weeklyPred, monthlyPred, insightsData] = await Promise.all([
        predictEngagement(studentId, 'daily'),
        predictEngagement(studentId, 'weekly'),
        predictEngagement(studentId, 'monthly'),
        getEngagementInsights(studentId)
      ])
      
      setPredictions({ daily: dailyPred, weekly: weeklyPred, monthly: monthlyPred })
      setInsights(insightsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh engagement data')
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    predictions,
    insights,
    loading,
    error,
    refresh
  }
}

