// Controller for Optimal Study Time Predictions
import { Request, Response } from 'express'
import { AppError, asyncHandler } from '../utils/errors'
import { predictOptimalStudyTime } from '../ml/optimalStudyTimePrediction'
import Student from '../models/Student'

// GET /api/optimal-study-time/:studentId
export const getOptimalStudyTime = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const language = req.query.language as string || 'en'

  // Verify student exists (support both _id and studentId field)
  const student = await Student.findOne({
    $or: [{ _id: studentId }, { studentId: studentId }]
  })

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const studentMongoId = String(student._id)

  // Get optimal study time insights with language support
  const insights = await predictOptimalStudyTime(studentMongoId, language)

  res.json({
    success: true,
    data: insights
  })
})

