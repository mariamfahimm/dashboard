// Assignment Completion Prediction Controller
import { Request, Response } from 'express'
import { predictAssignmentCompletion, predictAllAssignments } from '../ml/assignmentCompletionPrediction'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/assignment-completion/:studentId/:assignmentId
 * Get completion prediction for a specific assignment
 */
export const getAssignmentPrediction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, assignmentId } = req.params

  // Support both MongoDB _id and studentId field
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId: studentId }] 
  })

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const studentMongoId = String(student._id)
  const prediction = await predictAssignmentCompletion(studentMongoId, assignmentId)

  if (!prediction) {
    throw new AppError('Assignment not found or already completed', 404)
  }

  res.json({
    success: true,
    data: prediction
  })
})

/**
 * GET /api/assignment-completion/:studentId
 * Get completion predictions for all active assignments
 */
export const getAllAssignmentPredictions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params

  // Support both MongoDB _id and studentId field
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId: studentId }] 
  })

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const studentMongoId = String(student._id)
  const predictions = await predictAllAssignments(studentMongoId)

  res.json({
    success: true,
    count: predictions.length,
    data: predictions
  })
})

