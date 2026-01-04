// Parent Recommendations Controller
import { Request, Response } from 'express'
import { getParentRecommendations, getParentRecommendationsBatch } from '../ml/parentRecommendationEngine'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/parent-recommendations/:studentId
 * Get personalized recommendations for a specific student
 */
export const getRecommendationsForStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params
  const language = req.query.language as string || 'en'

  // Support both MongoDB _id and studentId field
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId: studentId }] 
  })

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const studentMongoId = String(student._id)
  const recommendations = await getParentRecommendations(studentMongoId, language)

  res.json({
    success: true,
    data: {
      studentId: studentMongoId,
      studentName: student.name,
      recommendations,
      count: recommendations.length
    }
  })
})

/**
 * GET /api/parent-recommendations
 * Get recommendations for all students of the current user
 */
export const getAllRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  // Get recommendations for all students (support language)
  const language = req.query.language as string || 'en'
  const recommendationsMap = await getParentRecommendationsBatch(studentIds, language)

  // Format response
  const data = students.map(student => {
    const studentId = String(student._id)
    const recommendations = recommendationsMap.get(studentId) || []

    return {
      studentId,
      studentName: student.name,
      recommendations,
      count: recommendations.length
    }
  })

  res.json({
    success: true,
    count: data.length,
    data
  })
})

