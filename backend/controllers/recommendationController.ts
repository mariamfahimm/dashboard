// Recommendation Controller (CRUD operations)
import { Request, Response } from 'express'
import Recommendation from '../models/Recommendation'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/recommendations - Get all recommendations
export const getAllRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, category, accepted, dismissed } = req.query
  const filter: any = {}
  if (studentId) filter.studentId = studentId
  if (category) filter.category = category
  if (accepted !== undefined) filter.accepted = accepted === 'true'
  if (dismissed !== undefined) filter.dismissed = dismissed === 'true'

  const recommendations = await Recommendation.find(filter)
    .sort({ priority: -1, createdAt: -1 })
  res.json({ success: true, count: recommendations.length, data: recommendations })
})

// GET /api/recommendations/:id - Get recommendation by ID
export const getRecommendationById = asyncHandler(async (req: Request, res: Response) => {
  const recommendation = await Recommendation.findById(req.params.id)
  
  if (!recommendation) {
    throw new AppError('Recommendation not found', 404)
  }

  res.json({ success: true, data: recommendation })
})

// POST /api/recommendations - Create new recommendation
export const createRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const {
    category,
    title,
    description,
    priority,
    confidence,
    studentId,
    reasoning,
    actionUrl,
    metadata
  } = req.body

  // Verify student exists
  const student = await Student.findOne({ studentId })
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // Validate category
  const validCategories = ['study_plan', 'resource', 'activity', 'goal', 'intervention']
  if (category && !validCategories.includes(category)) {
    throw new AppError(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 400)
  }

  // Validate priority and confidence
  if (priority !== undefined && (priority < 1 || priority > 10)) {
    throw new AppError('Priority must be between 1 and 10', 400)
  }

  if (confidence !== undefined && (confidence < 0 || confidence > 1)) {
    throw new AppError('Confidence must be between 0 and 1', 400)
  }

  const recommendation = await Recommendation.create({
    category: category || 'activity',
    title,
    description,
    priority: priority || 5,
    confidence: confidence || 0.7,
    studentId,
    reasoning: reasoning || '',
    actionUrl,
    metadata: metadata || {}
  })

  res.status(201).json({ success: true, data: recommendation })
})

// PUT /api/recommendations/:id - Update recommendation
export const updateRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    priority,
    confidence,
    reasoning,
    actionUrl,
    metadata
  } = req.body
  const updateData: any = {}

  if (title) updateData.title = title
  if (description) updateData.description = description
  if (priority !== undefined) {
    if (priority < 1 || priority > 10) {
      throw new AppError('Priority must be between 1 and 10', 400)
    }
    updateData.priority = priority
  }
  if (confidence !== undefined) {
    if (confidence < 0 || confidence > 1) {
      throw new AppError('Confidence must be between 0 and 1', 400)
    }
    updateData.confidence = confidence
  }
  if (reasoning) updateData.reasoning = reasoning
  if (actionUrl !== undefined) updateData.actionUrl = actionUrl
  if (metadata) updateData.metadata = metadata

  const recommendation = await Recommendation.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!recommendation) {
    throw new AppError('Recommendation not found', 404)
  }

  res.json({ success: true, data: recommendation })
})

// DELETE /api/recommendations/:id - Delete recommendation
export const deleteRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const recommendation = await Recommendation.findByIdAndDelete(req.params.id)

  if (!recommendation) {
    throw new AppError('Recommendation not found', 404)
  }

  res.json({ success: true, message: 'Recommendation deleted successfully' })
})

// POST /api/recommendations/:id/accept - Accept recommendation
export const acceptRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const recommendation = await Recommendation.findByIdAndUpdate(
    req.params.id,
    { accepted: true, dismissed: false },
    { new: true }
  )

  if (!recommendation) {
    throw new AppError('Recommendation not found', 404)
  }

  res.json({ success: true, data: recommendation })
})

// POST /api/recommendations/:id/dismiss - Dismiss recommendation
export const dismissRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const recommendation = await Recommendation.findByIdAndUpdate(
    req.params.id,
    { dismissed: true, accepted: false },
    { new: true }
  )

  if (!recommendation) {
    throw new AppError('Recommendation not found', 404)
  }

  res.json({ success: true, data: recommendation })
})

// GET /api/recommendations/student/:studentId - Get all recommendations for a student
export const getRecommendationsForStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const { accepted, dismissed, category } = req.query

  // Verify student exists (support both _id and studentId string)
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId }] 
  })
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const filter: any = { studentId: String(student._id) }
  if (accepted !== undefined) filter.accepted = accepted === 'true'
  if (dismissed !== undefined) filter.dismissed = dismissed === 'true'
  if (category) filter.category = category

  const recommendations = await Recommendation.find(filter)
    .sort({ priority: -1, createdAt: -1 })

  res.json({
    success: true,
    count: recommendations.length,
    data: recommendations
  })
})

// ============================================
// Specialized Functions (for backward compatibility with services)
// ============================================
import * as recommendationService from '../services/recommendationService'

// GET /api/recommendations/:studentId - Get recommendations (specialized version using service)
export const getStudentRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const recommendations = await recommendationService.getRecommendations(studentId)
  res.json({ success: true, data: recommendations })
})

// POST /api/recommendations/generate - Generate recommendations
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const context = req.body
  const recommendations = await recommendationService.generateRecommendations(context)
  res.json({ success: true, generated: recommendations.length, data: recommendations })
})

// POST /api/recommendations/:recommendationId/accept - Accept recommendation (specialized)
export const accept = asyncHandler(async (req: Request, res: Response) => {
  const { recommendationId } = req.params
  const { studentId } = req.body
  await recommendationService.acceptRecommendation(recommendationId, studentId)
  res.json({ success: true, message: 'Recommendation accepted' })
})

// POST /api/recommendations/:recommendationId/dismiss - Dismiss recommendation (specialized)
export const dismiss = asyncHandler(async (req: Request, res: Response) => {
  const { recommendationId } = req.params
  const { studentId } = req.body
  await recommendationService.dismissRecommendation(recommendationId, studentId)
  res.json({ success: true, message: 'Recommendation dismissed' })
})

// GET /api/recommendations/:recommendationId/effectiveness - Get effectiveness
export const getEffectiveness = asyncHandler(async (req: Request, res: Response) => {
  const { recommendationId } = req.params
  const { studentId } = req.query
  const effectiveness = await recommendationService.getRecommendationEffectiveness(
    recommendationId,
    studentId as string
  )
  res.json({ success: true, data: effectiveness })
})
