// Behavior Pattern Analysis Controller
import { Request, Response } from 'express'
import { analyzeStudentBehavior } from '../ml/behaviorPatternAnalysis'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/behavior-analysis/:studentId
 * Get behavior pattern analysis for a specific student
 */
export const getBehaviorAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params

  // Support both MongoDB _id and studentId field
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId: studentId }] 
  })

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const studentMongoId = String(student._id)
  const analysis = await analyzeStudentBehavior(studentMongoId)

  if (!analysis) {
    throw new AppError('Failed to analyze behavior patterns', 500)
  }

  res.json({
    success: true,
    data: analysis
  })
})

