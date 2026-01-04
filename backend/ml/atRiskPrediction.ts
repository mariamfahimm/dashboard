// Early Warning System - At-Risk Student Detection
// Uses ML classification to predict students at risk of academic failure

import Grade from '../models/Grade'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Student from '../models/Student'

export interface AtRiskFeatures {
  gradeTrend: number           // Slope of recent grades (last 4 weeks)
  attendanceRate: number       // Attendance rate (last 30 days)
  completionRate: number       // Assignment completion percentage
  behaviorIncidents: number    // Count of behavior incidents
  engagementScore: number      // Current engagement score
  daysSinceLastGrade: number   // Days since last grade submission
  subjectScores: number[]     // Per-subject average scores
  recentGradeAverage: number   // Average of last 4 grades
  overallAverage: number       // Overall grade average
  gradeVariance: number        // Variance in grades (consistency)
}

export interface AtRiskPrediction {
  riskScore: number            // 0-100 risk score
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  probability: number          // 0-1 probability of failure
  factors: string[]            // Contributing risk factors
  confidence: number           // 0-1 confidence in prediction
  recommendations: string[]    // Actionable recommendations
  timeline: string             // Estimated timeline to intervention
}

/**
 * Extract features for ML model
 */
async function extractFeatures(studentId: string): Promise<AtRiskFeatures> {
  // Get student
  const student = await Student.findById(studentId)
  if (!student) {
    throw new Error('Student not found')
  }

  // Get enrollments and courses
  const enrollments = await Enrollment.find({ studentId })
  const courseIds = enrollments.map(e => e.courseId).filter(id => id && id !== 'undefined')

  // Get all grades (sorted by date, most recent first)
  const allGrades = await Grade.find({ studentId })
    .sort({ submittedAt: -1 })
    .limit(50) // Last 50 grades

  // Get assignments
  const assignments = await Assignment.find({ courseId: { $in: courseIds } })
  const completedAssignments = assignments.filter(a => a.status === 'completed')
  const completionRate = assignments.length > 0 
    ? (completedAssignments.length / assignments.length) * 100 
    : 100

  // Calculate grade trend (slope of last 4 weeks)
  const recentGrades = allGrades.slice(0, 4) // Last 4 grades
  let gradeTrend = 0
  if (recentGrades.length >= 2) {
    const percentages = recentGrades.map(g => g.percentage)
    const n = percentages.length
    const sumX = percentages.reduce((sum, _, i) => sum + i, 0)
    const sumY = percentages.reduce((sum, p) => sum + p, 0)
    const sumXY = percentages.reduce((sum, p, i) => sum + i * p, 0)
    const sumX2 = percentages.reduce((sum, _, i) => sum + i * i, 0)
    gradeTrend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }

  // Calculate recent grade average
  const recentGradeAverage = recentGrades.length > 0
    ? recentGrades.reduce((sum, g) => sum + g.percentage, 0) / recentGrades.length
    : 0

  // Calculate overall average
  const overallAverage = allGrades.length > 0
    ? allGrades.reduce((sum, g) => sum + g.percentage, 0) / allGrades.length
    : 0

  // Calculate grade variance (consistency indicator)
  const gradeVariance = allGrades.length > 0
    ? (() => {
        const mean = overallAverage
        const variance = allGrades.reduce((sum, g) => sum + Math.pow(g.percentage - mean, 2), 0) / allGrades.length
        return Math.sqrt(variance) // Standard deviation
      })()
    : 0

  // Days since last grade
  const daysSinceLastGrade = recentGrades.length > 0
    ? Math.floor((Date.now() - new Date(recentGrades[0].submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // Get subject scores (group by course)
  const subjectScores: number[] = []
  const subjectMap = new Map<string, number[]>()
  
  allGrades.forEach(grade => {
    const courseId = grade.courseId
    if (!subjectMap.has(courseId)) {
      subjectMap.set(courseId, [])
    }
    subjectMap.get(courseId)!.push(grade.percentage)
  })

  subjectMap.forEach((scores) => {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
    subjectScores.push(avg)
  })

  // Get engagement score (from student model or default)
  const engagementScore = student.engagement?.currentEngagement || 50

  // TODO: Get actual attendance data (for now, use default)
  const attendanceRate = 95 // Placeholder - should come from Attendance model

  // TODO: Get actual behavior incidents (for now, use default)
  const behaviorIncidents = 0 // Placeholder - should come from Behavior model

  return {
    gradeTrend,
    attendanceRate,
    completionRate,
    behaviorIncidents,
    engagementScore,
    daysSinceLastGrade,
    subjectScores,
    recentGradeAverage,
    overallAverage,
    gradeVariance
  }
}

/**
 * ML Model: Risk Score Calculation
 * Uses weighted scoring algorithm (can be replaced with trained ML model)
 */
function calculateRiskScore(features: AtRiskFeatures): AtRiskPrediction {
  // Feature weights (trained model would learn these)
  const weights = {
    gradeTrend: -0.3,        // Negative trend = higher risk
    attendanceRate: -0.2,    // Low attendance = higher risk
    completionRate: -0.15,   // Low completion = higher risk
    behaviorIncidents: 0.15,  // More incidents = higher risk
    engagementScore: -0.1,    // Low engagement = higher risk
    daysSinceLastGrade: 0.1,  // Long time since grade = higher risk
    recentGradeAverage: -0.15, // Low recent average = higher risk
    overallAverage: -0.1,     // Low overall = higher risk
    gradeVariance: 0.05       // High variance = slightly higher risk
  }

  // Normalize features to 0-1 scale
  const normalized = {
    gradeTrend: Math.max(0, Math.min(1, (features.gradeTrend + 10) / 20)), // -10 to +10 -> 0 to 1
    attendanceRate: features.attendanceRate / 100,
    completionRate: features.completionRate / 100,
    behaviorIncidents: Math.min(1, features.behaviorIncidents / 10), // 0-10+ incidents
    engagementScore: features.engagementScore / 100,
    daysSinceLastGrade: Math.min(1, features.daysSinceLastGrade / 30), // 0-30+ days
    recentGradeAverage: features.recentGradeAverage / 100,
    overallAverage: features.overallAverage / 100,
    gradeVariance: Math.min(1, features.gradeVariance / 20) // 0-20+ std dev
  }

  // Calculate weighted risk score
  let riskScore = 50 // Base score

  riskScore += normalized.gradeTrend * weights.gradeTrend * 100
  riskScore += (1 - normalized.attendanceRate) * weights.attendanceRate * 100
  riskScore += (1 - normalized.completionRate) * weights.completionRate * 100
  riskScore += normalized.behaviorIncidents * weights.behaviorIncidents * 100
  riskScore += (1 - normalized.engagementScore) * weights.engagementScore * 100
  riskScore += normalized.daysSinceLastGrade * weights.daysSinceLastGrade * 100
  riskScore += (1 - normalized.recentGradeAverage) * weights.recentGradeAverage * 100
  riskScore += (1 - normalized.overallAverage) * weights.overallAverage * 100
  riskScore += normalized.gradeVariance * weights.gradeVariance * 100

  // Clamp to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore))

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical'
  if (riskScore < 30) {
    riskLevel = 'low'
  } else if (riskScore < 50) {
    riskLevel = 'medium'
  } else if (riskScore < 70) {
    riskLevel = 'high'
  } else {
    riskLevel = 'critical'
  }

  // Calculate probability (risk score as probability)
  const probability = riskScore / 100

  // Identify contributing factors
  const factors: string[] = []
  if (features.gradeTrend < -2) factors.push('Declining grades')
  if (features.attendanceRate < 85) factors.push('Low attendance')
  if (features.completionRate < 70) factors.push('Low assignment completion')
  if (features.behaviorIncidents > 2) factors.push('Behavior concerns')
  if (features.engagementScore < 60) factors.push('Low engagement')
  if (features.daysSinceLastGrade > 14) factors.push('No recent submissions')
  if (features.recentGradeAverage < 70) factors.push('Recent poor performance')
  if (features.overallAverage < 70) factors.push('Below average performance')
  if (features.gradeVariance > 15) factors.push('Inconsistent performance')

  // Generate recommendations
  const recommendations: string[] = []
  if (features.gradeTrend < -2) {
    recommendations.push('Schedule a meeting with teachers to discuss declining grades')
  }
  if (features.attendanceRate < 85) {
    recommendations.push('Address attendance issues - consider intervention')
  }
  if (features.completionRate < 70) {
    recommendations.push('Create a study plan to improve assignment completion')
  }
  if (features.recentGradeAverage < 70) {
    recommendations.push('Focus on recent weak subjects with extra support')
  }
  if (features.engagementScore < 60) {
    recommendations.push('Increase engagement through interactive learning activities')
  }
  if (recommendations.length === 0) {
    recommendations.push('Continue current support - student is on track')
  }

  // Estimate timeline
  let timeline = 'No immediate intervention needed'
  if (riskLevel === 'critical') {
    timeline = 'Immediate intervention required (within 1 week)'
  } else if (riskLevel === 'high') {
    timeline = 'Intervention recommended within 2-3 weeks'
  } else if (riskLevel === 'medium') {
    timeline = 'Monitor closely - intervention may be needed in 1 month'
  }

  // Calculate confidence based on data quality
  const dataPoints = features.subjectScores.length
  const confidence = Math.min(0.95, 0.5 + (dataPoints * 0.05) + (features.recentGradeAverage > 0 ? 0.2 : 0))

  return {
    riskScore: Math.round(riskScore),
    riskLevel,
    probability: Math.round(probability * 100) / 100,
    factors,
    confidence: Math.round(confidence * 100) / 100,
    recommendations,
    timeline
  }
}

/**
 * Main function: Predict at-risk status for a student
 */
export async function predictAtRisk(studentId: string): Promise<AtRiskPrediction> {
  try {
    // Extract features
    const features = await extractFeatures(studentId)

    // Calculate risk score using ML algorithm
    const prediction = calculateRiskScore(features)

    return prediction
  } catch (error) {
    console.error('Error in at-risk prediction:', error)
    // Return default low-risk prediction on error
    return {
      riskScore: 0,
      riskLevel: 'low',
      probability: 0,
      factors: [],
      confidence: 0,
      recommendations: ['Unable to calculate risk - insufficient data'],
      timeline: 'N/A'
    }
  }
}

/**
 * Batch prediction for multiple students
 */
export async function predictAtRiskBatch(studentIds: string[]): Promise<Map<string, AtRiskPrediction>> {
  const predictions = new Map<string, AtRiskPrediction>()
  
  await Promise.all(
    studentIds.map(async (studentId) => {
      try {
        const prediction = await predictAtRisk(studentId)
        predictions.set(studentId, prediction)
      } catch (error) {
        console.error(`Error predicting risk for student ${studentId}:`, error)
      }
    })
  )

  return predictions
}

