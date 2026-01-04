// Goal Controller
import { Request, Response } from 'express'
import Goal from '../models/Goal'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'
import { getStudentGoalsWithPredictions, recalculateGoalProgress } from '../services/goalService'

// GET /api/goals - Get all goals
export const getAllGoals = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, status, type } = req.query
  const filter: any = {}
  if (studentId) {
    // Support both MongoDB _id and studentId string
    const student = await Student.findOne({ 
      $or: [{ _id: studentId }, { studentId }] 
    })
    if (student) {
      filter.studentId = String(student._id)
    }
  }
  if (status) filter.status = status
  if (type) filter.type = type

  const goals = await Goal.find(filter).sort({ createdAt: -1 })
  res.json({ success: true, count: goals.length, data: goals })
})

// GET /api/goals/:id - Get goal by ID
export const getGoalById = asyncHandler(async (req: Request, res: Response) => {
  const goal = await Goal.findById(req.params.id)
  
  if (!goal) {
    throw new AppError('Goal not found', 404)
  }

  // Include prediction if available
  const goalWithPrediction = await recalculateGoalProgress(String(goal._id))
  res.json({ success: true, data: goalWithPrediction || goal })
})

// GET /api/students/:id/goals - Get all goals for a student with predictions
export const getGoalsForStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  // Find student by _id or studentId
  const student = await Student.findOne({ 
    $or: [{ _id: id }, { studentId: id }] 
  })
  
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const goalsWithPredictions = await getStudentGoalsWithPredictions(String(student._id))
  res.json({ success: true, count: goalsWithPredictions.length, data: goalsWithPredictions })
})

// POST /api/goals - Create new goal
export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, name, description, type, subject, target, current, unit, targetDate, status } = req.body

  // Verify student exists
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId }] 
  })
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // Validate type-specific requirements
  if (type === 'grade' && !subject) {
    throw new AppError('Subject is required for grade goals', 400)
  }

  // Calculate initial progress
  const progressPercentage = target > 0 ? Math.min(100, Math.round((current || 0) / target * 100)) : 0

  const goal = await Goal.create({
    studentId: String(student._id),
    name,
    description,
    type,
    subject,
    target,
    current: current || 0,
    unit: unit || '%',
    targetDate,
    status: status || 'active',
    progressPercentage
  })

  // Calculate predictions
  const goalWithPrediction = await recalculateGoalProgress(String(goal._id))

  res.status(201).json({ success: true, data: goalWithPrediction || goal })
})

// PUT /api/goals/:id - Update goal
export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, target, current, unit, targetDate, status, subject } = req.body
  const updateData: any = {}

  const goal = await Goal.findById(req.params.id)
  if (!goal) {
    throw new AppError('Goal not found', 404)
  }

  if (name) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (target !== undefined) {
    updateData.target = target
    // Recalculate progress
    const newCurrent = current !== undefined ? current : goal.current
    updateData.progressPercentage = target > 0 ? Math.min(100, Math.round((newCurrent / target) * 100)) : 0
  }
  if (current !== undefined) {
    updateData.current = current
    // Recalculate progress
    updateData.progressPercentage = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0
  }
  if (unit) updateData.unit = unit
  if (targetDate !== undefined) updateData.targetDate = targetDate
  if (status) {
    if (!['active', 'completed', 'paused', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400)
    }
    updateData.status = status
  }
  if (subject !== undefined) updateData.subject = subject

  const updatedGoal = await Goal.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!updatedGoal) {
    throw new AppError('Goal not found', 404)
  }

  // Recalculate predictions
  const goalWithPrediction = await recalculateGoalProgress(String(updatedGoal._id))

  res.json({ success: true, data: goalWithPrediction || updatedGoal })
})

// DELETE /api/goals/:id - Delete goal
export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await Goal.findByIdAndDelete(req.params.id)

  if (!goal) {
    throw new AppError('Goal not found', 404)
  }

  res.json({ success: true, message: 'Goal deleted successfully' })
})

// POST /api/goals/:id/recalculate - Manually recalculate goal predictions
export const recalculateGoal = asyncHandler(async (req: Request, res: Response) => {
  const goalWithPrediction = await recalculateGoalProgress(req.params.id)

  if (!goalWithPrediction) {
    throw new AppError('Goal not found', 404)
  }

  res.json({ success: true, data: goalWithPrediction })
})

