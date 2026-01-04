// Assignment Completion Prediction
// Predicts if a student will complete assignments on time

import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import Enrollment from '../models/Enrollment'
import Course from '../models/Course'
import Student from '../models/Student'

export interface CompletionFeatures {
  daysUntilDue: number              // Days until due date
  historicalCompletionRate: number   // Overall completion rate (0-100)
  assignmentType: string              // Type of assignment (homework, project, etc.)
  subjectAverage: number              // Student's average in this subject (0-100)
  pendingAssignmentsCount: number     // Number of other active assignments
  recentCompletionTrend: number      // Trend from last 5 assignments (-1 to 1)
  daysSinceLastSubmission: number     // Days since last assignment submission
  engagementScore: number             // Current engagement level (0-100)
  workloadPressure: number            // Workload pressure score (0-100)
}

export interface CompletionPrediction {
  assignmentId: string
  assignmentTitle: string
  willCompleteOnTime: boolean
  probability: number                 // 0-100 probability of on-time completion
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number                   // 0-100 risk score
  riskFactors: string[]               // Contributing risk factors
  confidence: number                   // 0-1 confidence in prediction
  recommendedAction: string           // Actionable recommendation for parents
  daysUntilDue: number
}

/**
 * Extract features for a specific assignment
 */
async function extractFeatures(studentId: string, assignment: any): Promise<CompletionFeatures> {
  const now = new Date()
  const dueDate = new Date(assignment.dueDate)
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Get student
  const student = await Student.findById(studentId)
  const engagementScore = student?.engagement?.currentEngagement || 50

  // Get enrollments and courses
  const enrollments = await Enrollment.find({ studentId })
  const courseIds = enrollments.map(e => e.courseId).filter(id => id && id !== 'undefined')
  const courses = await Course.find({ _id: { $in: courseIds } })

  // Get all assignments for this student
  const allAssignments = await Assignment.find({ 
    courseId: { $in: courseIds } 
  }).sort({ dueDate: -1 })

  // Get all grades (to determine completion history)
  const allGrades = await Grade.find({ studentId })
    .sort({ submittedAt: -1 })

  // Calculate historical completion rate
  // An assignment is "completed on time" if there's a grade with submittedAt <= dueDate
  let completedOnTime = 0
  let totalAssignments = 0

  for (const assign of allAssignments) {
    if (assign.status === 'completed' || assign.status === 'cancelled') {
      totalAssignments++
      const grade = allGrades.find(g => String(g.assignmentId) === String(assign._id))
      if (grade) {
        const submittedDate = new Date(grade.submittedAt)
        const assignDueDate = new Date(assign.dueDate)
        if (submittedDate <= assignDueDate) {
          completedOnTime++
        }
      }
    }
  }

  const historicalCompletionRate = totalAssignments > 0
    ? (completedOnTime / totalAssignments) * 100
    : 100 // Default to 100% if no history

  // Get assignment type (simplified - would need type field in Assignment model)
  const assignmentType = 'homework' // Default, could be extracted from title/description

  // Get subject average for this assignment's subject
  const assignmentCourse = courses.find(c => String(c._id) === String(assignment.courseId))
  const subject = assignmentCourse?.subject || 'General'
  
  const subjectGrades = allGrades
    .filter(g => {
      const gradeCourse = courses.find(c => String(c._id) === String(g.courseId))
      return gradeCourse?.subject === subject
    })
    .map(g => g.percentage)

  const subjectAverage = subjectGrades.length > 0
    ? subjectGrades.reduce((sum, g) => sum + g, 0) / subjectGrades.length
    : 75 // Default average

  // Count pending assignments (active assignments with due date in future)
  const pendingAssignments = allAssignments.filter(a => {
    if (a.status === 'completed' || a.status === 'cancelled') return false
    const aDueDate = new Date(a.dueDate)
    return aDueDate > now && String(a._id) !== String(assignment._id)
  })
  const pendingAssignmentsCount = pendingAssignments.length

  // Calculate recent completion trend (last 5 assignments)
  const recentAssignments = allAssignments.slice(0, 5)
  let recentOnTime = 0
  let recentTotal = 0

  for (const assign of recentAssignments) {
    if (assign.status === 'completed') {
      recentTotal++
      const grade = allGrades.find(g => String(g.assignmentId) === String(assign._id))
      if (grade) {
        const submittedDate = new Date(grade.submittedAt)
        const assignDueDate = new Date(assign.dueDate)
        if (submittedDate <= assignDueDate) {
          recentOnTime++
        }
      }
    }
  }

  const recentCompletionRate = recentTotal > 0
    ? recentOnTime / recentTotal
    : 0.5 // Default to 50% if no recent data

  // Calculate trend: positive = improving, negative = declining
  const recentCompletionTrend = recentCompletionRate - (historicalCompletionRate / 100)

  // Days since last submission
  const lastGrade = allGrades[0]
  const daysSinceLastSubmission = lastGrade
    ? Math.floor((now.getTime() - new Date(lastGrade.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // Calculate workload pressure
  // More assignments + less time = higher pressure
  const upcomingAssignments = pendingAssignments.filter(a => {
    const aDueDate = new Date(a.dueDate)
    const daysUntil = Math.ceil((aDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 // Within next week
  }).length

  const workloadPressure = Math.min(100, (upcomingAssignments * 20) + (pendingAssignmentsCount * 5))

  return {
    daysUntilDue,
    historicalCompletionRate,
    assignmentType,
    subjectAverage,
    pendingAssignmentsCount,
    recentCompletionTrend,
    daysSinceLastSubmission,
    engagementScore,
    workloadPressure
  }
}

/**
 * Calculate completion prediction using weighted algorithm
 */
function calculateCompletionPrediction(
  assignment: any,
  features: CompletionFeatures
): CompletionPrediction {
  // Feature weights (trained model would learn these)
  const weights = {
    daysUntilDue: -0.25,              // More days = lower risk
    historicalCompletionRate: -0.30,  // Higher rate = lower risk
    recentCompletionTrend: -0.20,      // Improving trend = lower risk
    pendingAssignmentsCount: 0.15,     // More assignments = higher risk
    subjectAverage: -0.10,             // Better performance = lower risk
    workloadPressure: 0.10,            // More pressure = higher risk
    daysSinceLastSubmission: 0.05,     // Long time = higher risk
    engagementScore: -0.05             // Higher engagement = lower risk
  }

  // Normalize features to 0-1 scale
  const normalized = {
    daysUntilDue: Math.min(1, Math.max(0, features.daysUntilDue / 14)), // 0-14 days
    historicalCompletionRate: features.historicalCompletionRate / 100,
    recentCompletionTrend: Math.max(-1, Math.min(1, features.recentCompletionTrend)), // -1 to 1
    pendingAssignmentsCount: Math.min(1, features.pendingAssignmentsCount / 10), // 0-10+
    subjectAverage: features.subjectAverage / 100,
    workloadPressure: features.workloadPressure / 100,
    daysSinceLastSubmission: Math.min(1, features.daysSinceLastSubmission / 14), // 0-14 days
    engagementScore: features.engagementScore / 100
  }

  // Calculate risk score
  let riskScore = 50 // Base score

  riskScore += (1 - normalized.daysUntilDue) * weights.daysUntilDue * 100
  riskScore += (1 - normalized.historicalCompletionRate) * weights.historicalCompletionRate * 100
  riskScore += (1 - normalized.recentCompletionTrend) * weights.recentCompletionTrend * 100
  riskScore += normalized.pendingAssignmentsCount * weights.pendingAssignmentsCount * 100
  riskScore += (1 - normalized.subjectAverage) * weights.subjectAverage * 100
  riskScore += normalized.workloadPressure * weights.workloadPressure * 100
  riskScore += normalized.daysSinceLastSubmission * weights.daysSinceLastSubmission * 100
  riskScore += (1 - normalized.engagementScore) * weights.engagementScore * 100

  // Clamp to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore))

  // Calculate probability (inverse of risk)
  const probability = 100 - riskScore

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical'
  if (riskScore < 25) {
    riskLevel = 'low'
  } else if (riskScore < 50) {
    riskLevel = 'medium'
  } else if (riskScore < 75) {
    riskLevel = 'high'
  } else {
    riskLevel = 'critical'
  }

  // Determine if will complete on time
  const willCompleteOnTime = probability >= 50

  // Identify risk factors
  const riskFactors: string[] = []
  if (features.daysUntilDue < 3) {
    riskFactors.push(`Only ${features.daysUntilDue} day${features.daysUntilDue !== 1 ? 's' : ''} remaining`)
  }
  if (features.historicalCompletionRate < 70) {
    riskFactors.push(`Low completion rate (${Math.round(features.historicalCompletionRate)}%)`)
  }
  if (features.recentCompletionTrend < -0.2) {
    riskFactors.push('Declining completion trend')
  }
  if (features.pendingAssignmentsCount > 3) {
    riskFactors.push(`${features.pendingAssignmentsCount} other assignments pending`)
  }
  if (features.subjectAverage < 70) {
    riskFactors.push(`Struggling in ${assignment.subject || 'this subject'}`)
  }
  if (features.workloadPressure > 60) {
    riskFactors.push('High workload pressure')
  }
  if (features.daysSinceLastSubmission > 7) {
    riskFactors.push('No recent submissions')
  }
  if (features.engagementScore < 60) {
    riskFactors.push('Low engagement level')
  }

  // Generate recommendation
  let recommendedAction = 'Continue monitoring - assignment appears on track'
  if (riskLevel === 'critical') {
    recommendedAction = 'Immediate action needed - high risk of late submission. Consider helping your child prioritize this assignment.'
  } else if (riskLevel === 'high') {
    recommendedAction = 'This assignment needs attention. Check in with your child and offer support if needed.'
  } else if (riskLevel === 'medium') {
    recommendedAction = 'Monitor this assignment closely. A gentle reminder may be helpful.'
  }

  // Calculate confidence based on data quality
  const dataPoints = features.pendingAssignmentsCount + (features.historicalCompletionRate > 0 ? 1 : 0)
  const confidence = Math.min(0.95, 0.5 + (dataPoints * 0.05) + (features.historicalCompletionRate > 0 ? 0.3 : 0))

  return {
    assignmentId: String(assignment._id),
    assignmentTitle: assignment.title,
    willCompleteOnTime,
    probability: Math.round(probability),
    riskLevel,
    riskScore: Math.round(riskScore),
    riskFactors,
    confidence: Math.round(confidence * 100) / 100,
    recommendedAction,
    daysUntilDue: features.daysUntilDue
  }
}

/**
 * Predict completion for a single assignment
 */
export async function predictAssignmentCompletion(
  studentId: string,
  assignmentId: string
): Promise<CompletionPrediction | null> {
  try {
    // Get assignment
    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      return null
    }

    // Skip if already completed or cancelled
    if (assignment.status === 'completed' || assignment.status === 'cancelled') {
      return null
    }

    // Extract features
    const features = await extractFeatures(studentId, assignment)

    // Calculate prediction
    const prediction = calculateCompletionPrediction(assignment, features)

    return prediction
  } catch (error) {
    console.error('Error predicting assignment completion:', error)
    return null
  }
}

/**
 * Predict completion for all active assignments for a student
 */
export async function predictAllAssignments(
  studentId: string
): Promise<CompletionPrediction[]> {
  try {
    // Get enrollments and courses
    const enrollments = await Enrollment.find({ studentId })
    const courseIds = enrollments.map(e => e.courseId).filter(id => id && id !== 'undefined')

    // Get all active assignments
    const now = new Date()
    const assignments = await Assignment.find({
      courseId: { $in: courseIds },
      status: 'active',
      dueDate: { $gte: now } // Only future assignments
    }).sort({ dueDate: 1 }) // Sort by due date

    // Predict for each assignment
    const predictions: CompletionPrediction[] = []
    
    for (const assignment of assignments) {
      const prediction = await predictAssignmentCompletion(studentId, String(assignment._id))
      if (prediction) {
        predictions.push(prediction)
      }
    }

    // Sort by risk score (highest risk first)
    predictions.sort((a, b) => b.riskScore - a.riskScore)

    return predictions
  } catch (error) {
    console.error('Error predicting all assignments:', error)
    return []
  }
}

