// Performance Insights Hook
import { useState, useEffect } from 'react'
import { 
  fetchPerformanceMetrics, 
  fetchPerformanceInsights,
  calculateRiskScore,
  type PerformanceMetrics,
  type PerformanceInsight
} from '@/services/performanceService'
import { calculateRiskScore as calcRisk } from '@/utils/riskScoring'

export function usePerformance(studentId: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [insights, setInsights] = useState<PerformanceInsight[]>([])
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPerformanceData() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch metrics and insights in parallel
        const [metricsData, insightsData] = await Promise.all([
          fetchPerformanceMetrics(studentId),
          fetchPerformanceInsights(studentId)
        ])
        
        setMetrics(metricsData)
        setInsights(insightsData)
        
        // Calculate risk score using utils
        const risk = await calculateRiskScore(metricsData)
        setRiskScore(risk)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load performance data')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      loadPerformanceData()
    }
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return
    
    try {
      setLoading(true)
      const [metricsData, insightsData] = await Promise.all([
        fetchPerformanceMetrics(studentId),
        fetchPerformanceInsights(studentId)
      ])
      
      setMetrics(metricsData)
      setInsights(insightsData)
      
      const risk = await calculateRiskScore(metricsData)
      setRiskScore(risk)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh performance data')
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    insights,
    riskScore,
    loading,
    error,
    refresh
  }
}

