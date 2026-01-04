// AI Logic Utilities
// Contains helper functions for AI-powered calculations and predictions

export interface PredictionInput {
  historicalData: number[]
  currentValue: number
  trend: 'increasing' | 'stable' | 'decreasing'
  factors: Record<string, number>
}

export interface PredictionOutput {
  predictedValue: number
  confidence: number
  timeframe: string
  factors: string[]
}

/**
 * Simple linear regression for trend prediction
 * TODO: Replace with more sophisticated ML model
 */
export function predictTrend(input: PredictionInput): PredictionOutput {
  const { historicalData, currentValue, trend, factors } = input
  
  // Calculate average change rate
  let changeRate = 0
  if (historicalData.length > 1) {
    const changes = []
    for (let i = 1; i < historicalData.length; i++) {
      changes.push(historicalData[i] - historicalData[i - 1])
    }
    changeRate = changes.reduce((a, b) => a + b, 0) / changes.length
  }
  
  // Adjust prediction based on trend
  let trendMultiplier = 1
  if (trend === 'increasing') trendMultiplier = 1.1
  if (trend === 'decreasing') trendMultiplier = 0.9
  
  // Factor in external factors
  const factorImpact = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length
  
  const predictedValue = currentValue + (changeRate * trendMultiplier) + (factorImpact * 0.1)
  const confidence = Math.min(0.95, 0.7 + (historicalData.length * 0.05))
  
  return {
    predictedValue: Math.max(0, Math.min(100, predictedValue)),
    confidence,
    timeframe: 'next_week',
    factors: Object.keys(factors)
  }
}

/**
 * Calculate confidence score based on data quality
 * TODO: Enhance with more sophisticated confidence metrics
 */
export function calculateConfidence(
  dataPoints: number,
  dataVariance: number,
  modelAccuracy: number = 0.85
): number {
  const dataQuality = Math.min(1, dataPoints / 10) // More data = higher quality
  const variancePenalty = Math.max(0, 1 - (dataVariance / 50)) // Lower variance = higher confidence
  
  return (dataQuality * 0.4 + variancePenalty * 0.3 + modelAccuracy * 0.3)
}

/**
 * Extract key insights from performance data
 * TODO: Replace with NLP-based insight extraction
 */
export function extractInsights(
  performanceData: { subject: string; score: number; change: number }[]
): string[] {
  const insights: string[] = []
  
  // Find strongest subject
  const strongest = performanceData.reduce((max, item) => 
    item.score > max.score ? item : max
  )
  if (strongest.score >= 85) {
    insights.push(`${strongest.subject} is a strong area with ${strongest.score}% performance`)
  }
  
  // Find improving subjects
  const improving = performanceData.filter(item => item.change > 5)
  if (improving.length > 0) {
    insights.push(`${improving.length} subject(s) showing significant improvement`)
  }
  
  // Find declining subjects
  const declining = performanceData.filter(item => item.change < -5)
  if (declining.length > 0) {
    insights.push(`${declining.length} subject(s) need attention`)
  }
  
  return insights
}

/**
 * Calculate recommendation priority score
 * TODO: Enhance with ML-based priority ranking
 */
export function calculatePriority(
  impact: number,
  urgency: number,
  feasibility: number
): number {
  // Weighted priority calculation
  return (impact * 0.5 + urgency * 0.3 + feasibility * 0.2) * 10
}

/**
 * Generate personalized message based on data
 * TODO: Replace with GPT-based message generation
 */
export function generatePersonalizedMessage(
  template: string,
  variables: Record<string, string | number>
): string {
  let message = template
  
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, String(value))
  })
  
  return message
}

