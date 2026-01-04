// Forecast Controller
import { Request, Response } from 'express'
import { AppError, asyncHandler } from '../utils/errors'
import {
  forecastGradeTarget,
  forecastStudyTimeTarget,
  forecastCompletionRateTarget,
  getGoalProgress,
  type ForecastResult,
  type GoalProgress
} from '../services/predictiveForecast'

/**
 * POST /api/forecast/grade
 * Forecast grade target achievement
 */
export const forecastGrade = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, subject, targetGrade } = req.body

  if (!studentId || !subject || !targetGrade) {
    throw new AppError('studentId, subject, and targetGrade are required', 400)
  }

  const forecast = await forecastGradeTarget(studentId, subject, targetGrade)
  res.json({ success: true, data: forecast })
})

/**
 * POST /api/forecast/study-time
 * Forecast study time target
 */
export const forecastStudyTime = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, targetHours } = req.body

  if (!studentId || !targetHours) {
    throw new AppError('studentId and targetHours are required', 400)
  }

  const forecast = await forecastStudyTimeTarget(studentId, targetHours)
  res.json({ success: true, data: forecast })
})

/**
 * POST /api/forecast/completion-rate
 * Forecast completion rate target
 */
export const forecastCompletionRate = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, targetRate } = req.body

  if (!studentId || !targetRate) {
    throw new AppError('studentId and targetRate are required', 400)
  }

  const forecast = await forecastCompletionRateTarget(studentId, targetRate)
  res.json({ success: true, data: forecast })
})

/**
 * POST /api/forecast/goals
 * Get goal progress with predictions
 */
export const forecastGoals = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, goals } = req.body

  if (!studentId || !goals || !Array.isArray(goals)) {
    throw new AppError('studentId and goals array are required', 400)
  }

  const progress = await getGoalProgress(studentId, goals)
  res.json({ success: true, data: progress })
})

/**
 * GET /api/forecast/:studentId
 * Get all forecasts for a student (default goals)
 */
export const getStudentForecasts = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params

  if (!studentId) {
    throw new AppError('studentId is required', 400)
  }

  // Get student's enrolled courses to determine available subjects
  const Enrollment = require('../models/Enrollment').default
  const Course = require('../models/Course').default
  const enrollments = await Enrollment.find({ studentId })
  const courseIds = enrollments
    .map((e: any) => e.courseId)
    .filter((id: any) => id && id !== 'undefined' && id !== undefined)
  
  let availableSubject = 'Math' // Default
  if (courseIds.length > 0) {
    const courses = await Course.find({ _id: { $in: courseIds } }).limit(1)
    if (courses.length > 0 && courses[0].subject) {
      availableSubject = courses[0].subject
    }
  }

  // Default goals for demonstration
  const defaultGoals = [
    { id: `grade-${availableSubject.toLowerCase()}`, name: `${availableSubject} Grade`, target: 85, unit: '%', type: 'grade' as const, subject: availableSubject },
    { id: 'study-time', name: 'Weekly Study Time', target: 6, unit: 'hrs', type: 'time' as const },
    { id: 'completion', name: 'Completion Rate', target: 90, unit: '%', type: 'completion' as const }
  ]

  const progress = await getGoalProgress(studentId, defaultGoals)
  // Filter out forecasts with "No ... course found" errors
  const validProgress = progress.filter((p: any) => {
    const msg = p.forecast?.message || ''
    return !(msg.toLowerCase().includes('no ') && msg.toLowerCase().includes('course found') && p.current === 0)
  })
  res.json({ success: true, data: validProgress })
})

