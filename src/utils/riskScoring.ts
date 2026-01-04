// Risk Scoring Utilities
// Contains functions for calculating risk levels and scores

export interface RiskFactors {
  performanceScore: number // 0-100
  engagementLevel: number // 0-100
  attendanceRate: number // 0-100
  assignmentCompletion: number // 0-100
  trendDirection: 'improving' | 'stable' | 'declining'
  timeSinceLastActivity?: number // hours
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskScore {
  overallScore: number // 0-100, higher = more risk
  level: RiskLevel
  factors: {
    factor: string
    score: number
    weight: number
  }[]
  recommendations: string[]
}

/**
 * Calculate overall risk score from multiple factors
 * TODO: Enhance with ML-based risk modeling
 */
export function calculateRiskScore(factors: RiskFactors): RiskScore {
  const factorScores: { factor: string; score: number; weight: number }[] = []
  
  // Performance risk (inverse of score)
  const performanceRisk = 100 - factors.performanceScore
  factorScores.push({
    factor: 'Performance',
    score: performanceRisk,
    weight: 0.3
  })
  
  // Engagement risk (inverse of engagement)
  const engagementRisk = 100 - factors.engagementLevel
  factorScores.push({
    factor: 'Engagement',
    score: engagementRisk,
    weight: 0.25
  })
  
  // Attendance risk
  const attendanceRisk = 100 - factors.attendanceRate
  factorScores.push({
    factor: 'Attendance',
    score: attendanceRisk,
    weight: 0.2
  })
  
  // Assignment completion risk
  const completionRisk = 100 - factors.assignmentCompletion
  factorScores.push({
    factor: 'Assignment Completion',
    score: completionRisk,
    weight: 0.15
  })
  
  // Trend risk
  let trendRisk = 0
  if (factors.trendDirection === 'declining') trendRisk = 20
  else if (factors.trendDirection === 'stable') trendRisk = 5
  factorScores.push({
    factor: 'Trend',
    score: trendRisk,
    weight: 0.1
  })
  
  // Calculate weighted average
  const overallScore = factorScores.reduce(
    (sum, item) => sum + (item.score * item.weight),
    0
  )
  
  // Determine risk level
  let level: RiskLevel = 'low'
  if (overallScore >= 70) level = 'critical'
  else if (overallScore >= 50) level = 'high'
  else if (overallScore >= 30) level = 'medium'
  
  // Generate recommendations based on risk level
  const recommendations = generateRiskRecommendations(level, factorScores)
  
  return {
    overallScore: Math.round(overallScore),
    level,
    factors: factorScores,
    recommendations
  }
}

/**
 * Generate recommendations based on risk level and factors
 */
function generateRiskRecommendations(
  level: RiskLevel,
  factors: { factor: string; score: number; weight: number }[]
): string[] {
  const recommendations: string[] = []
  
  if (level === 'critical' || level === 'high') {
    recommendations.push('Immediate intervention recommended')
    recommendations.push('Schedule parent-teacher conference')
  }
  
  // Find highest risk factor
  const highestRisk = factors.reduce((max, item) => 
    item.score > max.score ? item : max
  )
  
  if (highestRisk.score > 50) {
    recommendations.push(`Focus on improving ${highestRisk.factor.toLowerCase()}`)
  }
  
  if (level === 'low') {
    recommendations.push('Continue current learning approach')
    recommendations.push('Maintain engagement levels')
  } else {
    recommendations.push('Review learning strategies')
    recommendations.push('Consider additional support resources')
  }
  
  return recommendations
}

/**
 * Check if risk threshold is exceeded
 */
export function isRiskThresholdExceeded(
  riskScore: number,
  threshold: number = 50
): boolean {
  return riskScore >= threshold
}

/**
 * Calculate risk trend (improving, stable, declining)
 */
export function calculateRiskTrend(
  currentRisk: number,
  previousRisk: number
): 'improving' | 'stable' | 'declining' {
  const difference = currentRisk - previousRisk
  
  if (difference < -5) return 'improving'
  if (difference > 5) return 'declining'
  return 'stable'
}

/**
 * Get risk color for UI display
 */
export function getRiskColor(level: RiskLevel): string {
  const colors = {
    low: 'text-emerald-600 bg-emerald-50',
    medium: 'text-amber-600 bg-amber-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-rose-600 bg-rose-50'
  }
  return colors[level]
}

