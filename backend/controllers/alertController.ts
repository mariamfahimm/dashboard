// Alert Controller (CRUD operations)
import { Request, Response } from 'express'
import Alert from '../models/Alert'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/alerts - Get all alerts
export const getAllAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, type, priority, read } = req.query
  const filter: any = {}
  if (studentId) filter.studentId = studentId
  if (type) filter.type = type
  if (priority) filter.priority = priority
  if (read !== undefined) filter.read = read === 'true'

  const alerts = await Alert.find(filter).sort({ timestamp: -1 })
  res.json({ success: true, count: alerts.length, data: alerts })
})

// GET /api/alerts/:id - Get alert by ID
export const getAlertById = asyncHandler(async (req: Request, res: Response) => {
  const alert = await Alert.findById(req.params.id)
  
  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  res.json({ success: true, data: alert })
})

// POST /api/alerts - Create new alert
export const createAlert = asyncHandler(async (req: Request, res: Response) => {
  const { type, priority, title, message, studentId, actionRequired, metadata } = req.body

  // Verify student exists
  const student = await Student.findOne({ studentId })
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // Validate type and priority
  const validTypes = ['performance', 'engagement', 'attendance', 'deadline', 'achievement']
  const validPriorities = ['low', 'medium', 'high', 'critical']

  if (type && !validTypes.includes(type)) {
    throw new AppError(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 400)
  }

  if (priority && !validPriorities.includes(priority)) {
    throw new AppError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`, 400)
  }

  const alert = await Alert.create({
    type: type || 'performance',
    priority: priority || 'medium',
    title,
    message,
    studentId,
    actionRequired: actionRequired || false,
    metadata: metadata || {}
  })

  res.status(201).json({ success: true, data: alert })
})

// PUT /api/alerts/:id - Update alert
export const updateAlert = asyncHandler(async (req: Request, res: Response) => {
  const { title, message, priority, read, actionRequired, metadata } = req.body
  const updateData: any = {}

  if (title) updateData.title = title
  if (message) updateData.message = message
  if (priority) {
    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (!validPriorities.includes(priority)) {
      throw new AppError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`, 400)
    }
    updateData.priority = priority
  }
  if (read !== undefined) updateData.read = read
  if (actionRequired !== undefined) updateData.actionRequired = actionRequired
  if (metadata) updateData.metadata = metadata

  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  res.json({ success: true, data: alert })
})

// DELETE /api/alerts/:id - Delete alert
export const deleteAlert = asyncHandler(async (req: Request, res: Response) => {
  const alert = await Alert.findByIdAndDelete(req.params.id)

  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  res.json({ success: true, message: 'Alert deleted successfully' })
})

// PATCH /api/alerts/:id/read - Mark alert as read
export const markAlertAsRead = asyncHandler(async (req: Request, res: Response) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  )

  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  res.json({ success: true, data: alert })
})

// GET /api/alerts/student/:studentId - Get all alerts for a student
export const getAlertsForStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const { read, type, priority } = req.query

  // Verify student exists
  const student = await Student.findOne({ studentId })
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const filter: any = { studentId }
  if (read !== undefined) filter.read = read === 'true'
  if (type) filter.type = type
  if (priority) filter.priority = priority

  const alerts = await Alert.find(filter).sort({ timestamp: -1 })
  const unreadCount = await Alert.countDocuments({ studentId, read: false })

  res.json({
    success: true,
    count: alerts.length,
    unreadCount,
    data: alerts
  })
})

