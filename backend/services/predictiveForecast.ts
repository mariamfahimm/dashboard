// Predictive Forecast Module - Simple ML/Predictive Logic
import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import Enrollment from '../models/Enrollment'
import Course from '../models/Course'
import { calculateWeeklyPerformanceChanges, calculateSubjectGrowthRates, detectTrend } from './analyticsEngine'

export interface ForecastResult {
  target: string
  currentValue: number
  targetValue: number
  predictedValue: number
  predictedDate: Date | null
  confidence: number // 0-1
  onTrack: boolean
  message: string
  weeksToTarget?: number
}

export interface GoalProgress {
  goalId: string
  goalName: string
  current: number
  target: number
  unit: string
  predictedCompletion: Date | null
  onTrack: boolean
  progressPercentage: number
  confidence: number
  forecast: ForecastResult
}

/**
 * Simple Linear Regression for trend projection
 */
function linearRegression(data: { x: number, y: number }[]): { slope: number, intercept: number, r2: number } {
  if (data.length < 2) {
    return { slope: 0, intercept: data[0]?.y || 0, r2: 0 }
  }

  const n = data.length
  const sumX = data.reduce((sum, p) => sum + p.x, 0)
  const sumY = data.reduce((sum, p) => sum + p.y, 0)
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumY2 = data.reduce((sum, p) => sum + p.y * p.y, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R² (coefficient of determination)
  const yMean = sumY / n
  const ssRes = data.reduce((sum, p) => {
    const predicted = slope * p.x + intercept
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)
  const ssTot = data.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0)
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) }
}

/**
 * Predict future value using linear regression
 */
function predictValue(
  historicalData: number[],
  weeksAhead: number
): { value: number, confidence: number } {
  if (historicalData.length < 2) {
    return { value: historicalData[0] || 0, confidence: 0.3 }
  }

  // Convert to {x, y} format where x is time index
  const data = historicalData.map((y, i) => ({ x: i, y }))
  const { slope, intercept, r2 } = linearRegression(data)

  // Predict future value
  const futureX = historicalData.length + weeksAhead - 1
  const predictedValue = slope * futureX + intercept

  // Confidence based on R² and data points
  const confidence = Math.min(0.95, r2 * 0.7 + (historicalData.length / 20) * 0.3)

  return {
    value: Math.max(0, Math.min(100, predictedValue)), // Clamp between 0-100
    confidence: Math.round(confidence * 100) / 100
  }
}

/**
 * Predict when a target will be reached
 */
function predictTargetDate(
  historicalData: number[],
  targetValue: number,
  maxWeeks: number = 12
): { date: Date | null, weeks: number, confidence: number } {
  if (historicalData.length < 2) {
    return { date: null, weeks: -1, confidence: 0.3 }
  }

  const data = historicalData.map((y, i) => ({ x: i, y }))
  const { slope, intercept, r2 } = linearRegression(data)

  if (slope <= 0) {
    // Not improving, unlikely to reach target
    return { date: null, weeks: -1, confidence: 0.2 }
  }

  // Solve: targetValue = slope * x + intercept
  // x = (targetValue - intercept) / slope
  const targetX = (targetValue - intercept) / slope
  const currentX = historicalData.length - 1
  const weeksNeeded = Math.ceil(targetX - currentX)

  if (weeksNeeded < 0 || weeksNeeded > maxWeeks) {
    return { date: null, weeks: -1, confidence: 0.3 }
  }

  // Calculate confidence
  const confidence = Math.min(0.9, r2 * 0.6 + (1 - weeksNeeded / maxWeeks) * 0.4)

  // Calculate date
  const today = new Date()
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + (weeksNeeded * 7))

  return {
    date: targetDate,
    weeks: weeksNeeded,
    confidence: Math.round(confidence * 100) / 100
  }
}

/**
 * Forecast grade target achievement
 */
export async function forecastGradeTarget(
  studentId: string,
  subject: string,
  targetGrade: number
): Promise<ForecastResult> {
  try {
    // Get enrollments and courses
    const enrollments = await Enrollment.find({ studentId })
    const courseIds = enrollments
      .map(e => e.courseId)
      .filter((id: any) => id && id !== 'undefined' && id !== undefined)
    
    if (courseIds.length === 0) {
      return {
        target: `${subject} Grade`,
        currentValue: 0,
        targetValue: targetGrade,
        predictedValue: 0,
        predictedDate: null,
        confidence: 0,
        onTrack: false,
        message: `No valid course enrollments found for this student.`
      }
    }
    
    const courses = await Course.find({ _id: { $in: courseIds }, subject })
    
    if (courses.length === 0) {
      return {
        target: `${subject} Grade`,
        currentValue: 0,
        targetValue: targetGrade,
        predictedValue: 0,
        predictedDate: null,
        confidence: 0,
        onTrack: false,
        message: `No ${subject} course found for this student.`
      }
    }

    const subjectCourseIds = courses.map(c => String(c._id))
    
    // Get grades for this subject, sorted by submission date (oldest to newest)
    const grades = await Grade.find({
      studentId,
      courseId: { $in: subjectCourseIds }
    }).sort({ submittedAt: 1 }).lean() // Sort by submittedAt ascending (oldest first)

    if (grades.length === 0) {
      return {
        target: `${subject} Grade`,
        currentValue: 0,
        targetValue: targetGrade,
        predictedValue: 0,
        predictedDate: null,
        confidence: 0,
        onTrack: false,
        message: `No grades available for ${subject} yet.`
      }
    }

    // Calculate percentages and filter invalid grades
    const validGrades = grades.filter((g: any) => 
      g.score != null && 
      g.maxScore != null && 
      g.maxScore > 0 &&
      g.submittedAt != null
    )
    
    if (validGrades.length === 0) {
      return {
        target: `${subject} Grade`,
        currentValue: 0,
        targetValue: targetGrade,
        predictedValue: 0,
        predictedDate: null,
        confidence: 0,
        onTrack: false,
        message: `No valid grades available for ${subject}.`
      }
    }
    
    // Calculate percentages (already sorted by submittedAt)
    const percentages = validGrades.map((g: any) => (g.score / g.maxScore) * 100)
    
    const currentValue = percentages.reduce((a, b) => a + b, 0) / percentages.length

    // Get historical data (last 8 grades or all available, already in chronological order)
    const historicalData = percentages.slice(-Math.min(8, percentages.length))

    // Predict future value (4 weeks ahead)
    const prediction = predictValue(historicalData, 4)
    const targetPrediction = predictTargetDate(historicalData, targetGrade, 12)

    const onTrack = prediction.value >= targetGrade || 
                   (targetPrediction.date !== null && targetPrediction.weeks > 0 && targetPrediction.weeks <= 8)

    let message = ''
    if (onTrack && targetPrediction.date) {
      message = `On track to reach ${targetGrade}% by ${targetPrediction.date.toLocaleDateString()} (${targetPrediction.weeks} weeks).`
    } else if (onTrack) {
      message = `Currently on track. Predicted to reach ${prediction.value.toFixed(1)}% in 4 weeks.`
    } else {
      message = `May need additional support. Current trajectory suggests ${prediction.value.toFixed(1)}% in 4 weeks.`
    }

    return {
      target: `${subject} Grade`,
      currentValue: Math.round(currentValue * 10) / 10,
      targetValue: targetGrade,
      predictedValue: Math.round(prediction.value * 10) / 10,
      predictedDate: targetPrediction.date,
      confidence: prediction.confidence,
      onTrack,
      message,
      weeksToTarget: targetPrediction.weeks > 0 ? targetPrediction.weeks : undefined
    }
  } catch (error) {
    console.error(`Error forecasting grade target for ${subject}:`, error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error details: ${errorMessage}`)
    console.error(`Stack: ${error instanceof Error ? error.stack : 'N/A'}`)
    return {
      target: `${subject} Grade`,
      currentValue: 0,
      targetValue: targetGrade,
      predictedValue: 0,
      predictedDate: null,
      confidence: 0,
      onTrack: false,
      message: `Error calculating forecast: ${errorMessage}`
    }
  }
}

/**
 * Forecast study time target
 */
export async function forecastStudyTimeTarget(
  studentId: string,
  targetHoursPerWeek: number
): Promise<ForecastResult> {
  try {
    // Get assignments to estimate study time
    const enrollments = await Enrollment.find({ studentId })
    const courseIds = enrollments.map(e => e.courseId)
    
    const assignments = await Assignment.find({
      courseId: { $in: courseIds },
      status: { $in: ['active', 'completed'] }
    }).sort({ dueDate: -1 }).limit(20).lean()

    if (assignments.length === 0) {
      return {
        target: 'Weekly Study Time',
        currentValue: 0,
        targetValue: targetHoursPerWeek,
        predictedValue: 0,
        predictedDate: null,
        confidence: 0,
        onTrack: false,
        message: 'No assignment data available to estimate study time.'
      }
    }

    // Estimate current study time (based on assignments)
    // Rough estimate: 1-2 hours per assignment per week
    const currentValue = Math.min(targetHoursPerWeek * 1.5, assignments.length * 1.5)

    // Use trend from analytics
    let growthFactor = 1.0
    try {
    const trend = await detectTrend(studentId)
      growthFactor = trend.overallTrend === 'improving' ? 1.1 : 
                        trend.overallTrend === 'declining' ? 0.9 : 1.0
    } catch (trendError) {
      console.error('Error detecting trend for study time forecast:', trendError)
      // Use default growth factor if trend detection fails
    }

    const predictedValue = currentValue * growthFactor
    const onTrack = predictedValue >= targetHoursPerWeek

    let message = ''
    if (onTrack) {
      message = `On track to meet ${targetHoursPerWeek} hours/week target. Current estimate: ${currentValue.toFixed(1)} hours.`
    } else {
      const deficit = targetHoursPerWeek - predictedValue
      message = `May need to increase study time by ${deficit.toFixed(1)} hours/week to meet target.`
    }

    return {
      target: 'Weekly Study Time',
      currentValue: Math.round(currentValue * 10) / 10,
      targetValue: targetHoursPerWeek,
      predictedValue: Math.round(predictedValue * 10) / 10,
      predictedDate: null,
      confidence: 0.6, // Lower confidence for estimated data
      onTrack,
      message
    }
  } catch (error) {
    console.error('Error forecasting study time target:', error)
    return {
      target: 'Weekly Study Time',
      currentValue: 0,
      targetValue: targetHoursPerWeek,
      predictedValue: 0,
      predictedDate: null,
      confidence: 0,
      onTrack: false,
      message: 'Error calculating forecast.'
    }
  }
}

/**
 * Forecast completion rate target
 */
export async function forecastCompletionRateTarget(
  studentId: string,
  targetRate: number
): Promise<ForecastResult> {
  try {
    const enrollments = await Enrollment.find({ studentId })
    const courseIds = enrollments.map(e => e.courseId)
    
    const assignments = await Assignment.find({
      courseId: { $in: courseIds }
    })

    if (assignments.length === 0) {
      return {
        target: 'Assignment Completion Rate',
        currentValue: 0,
        targetValue: targetRate,
        predictedValue: 0,
        predictedDate: null,
        confidence: 0,
        onTrack: false,
        message: 'No assignments available.'
      }
    }

    // Calculate current completion rate
    const completed = assignments.filter(a => a.status === 'completed').length
    const currentValue = (completed / assignments.length) * 100

    // Get trend and weekly changes with error handling
    let improvementRate = 0
    try {
    const trend = await detectTrend(studentId)
    const weeklyChanges = await calculateWeeklyPerformanceChanges(studentId, 4)
    
    // Estimate improvement rate
    const avgWeeklyChange = weeklyChanges.length > 1
      ? weeklyChanges.slice(1).reduce((sum, w) => sum + w.change, 0) / (weeklyChanges.length - 1)
      : 0

    // Predict based on trend
      improvementRate = trend.overallTrend === 'improving' ? Math.max(0, avgWeeklyChange / 10) : 0
    } catch (trendError) {
      console.error('Error getting trend for completion rate forecast:', trendError)
      // Use default improvement rate if trend calculation fails
      improvementRate = 0
    }
    const predictedValue = Math.min(100, currentValue + (improvementRate * 4)) // 4 weeks ahead

    const onTrack = predictedValue >= targetRate

    let message = ''
    if (onTrack) {
      message = `On track to reach ${targetRate}% completion rate. Current: ${currentValue.toFixed(1)}%, Predicted: ${predictedValue.toFixed(1)}%`
    } else {
      const gap = targetRate - predictedValue
      message = `May need to improve completion rate by ${gap.toFixed(1)}% to meet target.`
    }

    return {
      target: 'Assignment Completion Rate',
      currentValue: Math.round(currentValue * 10) / 10,
      targetValue: targetRate,
      predictedValue: Math.round(predictedValue * 10) / 10,
      predictedDate: null,
      confidence: 0.7,
      onTrack,
      message
    }
  } catch (error) {
    console.error('Error forecasting completion rate target:', error)
    return {
      target: 'Assignment Completion Rate',
      currentValue: 0,
      targetValue: targetRate,
      predictedValue: 0,
      predictedDate: null,
      confidence: 0,
      onTrack: false,
      message: 'Error calculating forecast.'
    }
  }
}

/**
 * Get goal progress with predictions
 */
export async function getGoalProgress(
  studentId: string,
  goals: Array<{ id: string, name: string, target: number, unit: string, type: 'grade' | 'time' | 'completion', subject?: string }>
): Promise<GoalProgress[]> {
  try {
    const progressPromises = goals.map(async (goal) => {
      let forecast: ForecastResult

      try {
      if (goal.type === 'grade' && goal.subject) {
        forecast = await forecastGradeTarget(studentId, goal.subject, goal.target)
      } else if (goal.type === 'time') {
        forecast = await forecastStudyTimeTarget(studentId, goal.target)
      } else if (goal.type === 'completion') {
        forecast = await forecastCompletionRateTarget(studentId, goal.target)
      } else {
        forecast = {
          target: goal.name,
          currentValue: 0,
          targetValue: goal.target,
          predictedValue: 0,
          predictedDate: null,
          confidence: 0,
          onTrack: false,
          message: 'Invalid goal type.'
          }
        }
      } catch (goalError) {
        console.error(`Error calculating forecast for goal ${goal.id}:`, goalError)
        // Return a safe default forecast if calculation fails
        forecast = {
          target: goal.name,
          currentValue: 0,
          targetValue: goal.target,
          predictedValue: 0,
          predictedDate: null,
          confidence: 0,
          onTrack: false,
          message: 'Unable to calculate forecast at this time.'
        }
      }

      const progressPercentage = forecast.targetValue > 0
        ? Math.min(100, (forecast.currentValue / forecast.targetValue) * 100)
        : 0

      return {
        goalId: goal.id,
        goalName: goal.name,
        current: forecast.currentValue,
        target: forecast.targetValue,
        unit: goal.unit,
        predictedCompletion: forecast.predictedDate,
        onTrack: forecast.onTrack,
        progressPercentage: Math.round(progressPercentage * 10) / 10,
        confidence: forecast.confidence,
        forecast
      }
    })

    return await Promise.all(progressPromises)
  } catch (error) {
    console.error('Error getting goal progress:', error)
    return []
  }
}

