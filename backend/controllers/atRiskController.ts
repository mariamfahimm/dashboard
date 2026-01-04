// At-Risk Student Detection Controller
import { Request, Response } from 'express'
import { predictAtRisk, predictAtRiskBatch } from '../ml/atRiskPrediction'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/at-risk/:studentId
 * Get at-risk prediction for a specific student
 */
export const getAtRiskPrediction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params

  // Support both MongoDB _id and studentId field
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId: studentId }] 
  })

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const studentMongoId = String(student._id)
  const prediction = await predictAtRisk(studentMongoId)

  res.json({
    success: true,
    data: {
      studentId: studentMongoId,
      studentName: student.name,
      ...prediction
    }
  })
})

/**
 * GET /api/at-risk
 * Get at-risk predictions for all students of the current user
 */
export const getAllAtRiskPredictions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.userId

  if (!userId) {
    throw new AppError('User not authenticated', 401)
  }

  // Get all students for this user
  const students = await Student.find({ userId: String(userId) })
  const studentIds = students.map(s => String(s._id))

  if (studentIds.length === 0) {
    res.json({
      success: true,
      count: 0,
      data: []
    })
    return
  }

  // Get predictions for all students
  const predictionsMap = await predictAtRiskBatch(studentIds)

  // Format response
  const data = students.map(student => {
    const studentId = String(student._id)
    const prediction = predictionsMap.get(studentId) || {
      riskScore: 0,
      riskLevel: 'low' as const,
      probability: 0,
      factors: [],
      confidence: 0,
      recommendations: [],
      timeline: 'N/A'
    }

    return {
      studentId,
      studentName: student.name,
      ...prediction
    }
  })

  // Sort by risk score (highest first)
  data.sort((a, b) => b.riskScore - a.riskScore)

  res.json({
    success: true,
    count: data.length,
    data
  })
})

