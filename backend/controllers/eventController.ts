// Event Controller
import { Response } from 'express'
import Event from '../models/Event'
import { AppError, asyncHandler } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

// GET /api/events - Get events for current user/student
export const getEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.userId
  const { studentId, startDate, endDate, type } = req.query

  const filter: any = {}

  // Filter by student if provided
  if (studentId) {
    filter.studentId = studentId
  } else {
    // If no studentId, show events for all students linked to this user
    // For now, we'll show all events (can be refined later)
  }

  // Filter by date range
  if (startDate || endDate) {
    filter.startDate = {}
    if (startDate) {
      filter.startDate.$gte = new Date(startDate as string)
    }
    if (endDate) {
      filter.startDate.$lte = new Date(endDate as string)
    }
  }

  // Filter by type
  if (type) {
    filter.type = type
  }

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .limit(100)

  res.json({
    success: true,
    count: events.length,
    data: events
  })
})

// GET /api/events/:id - Get event by ID
export const getEventById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const event = await Event.findById(req.params.id)
  if (!event) {
    throw new AppError('Event not found', 404)
  }

  res.json({ success: true, data: event })
})

// POST /api/events - Create new event
export const createEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.userId
  const userName = req.user?.name || 'Unknown'
  const userRole = req.user?.role || 'parent'

  const {
    title,
    description,
    type,
    startDate,
    endDate,
    allDay,
    location,
    studentId,
    courseId,
    reminders,
    color,
    priority,
    recurring,
    attachments
  } = req.body

  if (!title || !startDate) {
    throw new AppError('Missing required fields: title, startDate', 400)
  }

  const event = await Event.create({
    title,
    description,
    type: type || 'school_event',
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : undefined,
    allDay: allDay || false,
    location,
    studentId,
    courseId,
    createdBy: {
      userId,
      name: userName,
      role: userRole as 'parent' | 'teacher' | 'admin'
    },
    reminders: reminders || [],
    color: color || getDefaultColor(type || 'school_event'),
    priority: priority || 'normal',
    recurring,
    attachments: attachments || []
  })

  res.status(201).json({ success: true, data: event })
})

// PUT /api/events/:id - Update event
export const updateEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const event = await Event.findById(req.params.id)
  if (!event) {
    throw new AppError('Event not found', 404)
  }

  const userId = req.user?._id || req.user?.userId
  // Only creator or admin can update
  if (event.createdBy.userId !== userId && req.user?.role !== 'admin') {
    throw new AppError('Unauthorized to update this event', 403)
  }

  const updateData: any = {}
  const allowedFields = [
    'title', 'description', 'type', 'startDate', 'endDate', 'allDay',
    'location', 'studentId', 'courseId', 'reminders', 'color', 'priority',
    'recurring', 'attachments'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'startDate' || field === 'endDate') {
        updateData[field] = new Date(req.body[field])
      } else {
        updateData[field] = req.body[field]
      }
    }
  })

  Object.assign(event, updateData)
  await event.save()

  res.json({ success: true, data: event })
})

// DELETE /api/events/:id - Delete event
export const deleteEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const event = await Event.findById(req.params.id)
  if (!event) {
    throw new AppError('Event not found', 404)
  }

  const userId = req.user?._id || req.user?.userId
  // Only creator or admin can delete
  if (event.createdBy.userId !== userId && req.user?.role !== 'admin') {
    throw new AppError('Unauthorized to delete this event', 403)
  }

  await event.deleteOne()
  res.json({ success: true, message: 'Event deleted' })
})

// Helper function to get default color for event type
function getDefaultColor(type: string): string {
  const colorMap: Record<string, string> = {
    assignment: '#f59e0b', // amber
    exam: '#ef4444', // red
    holiday: '#10b981', // green
    school_event: '#3b82f6', // blue
    meeting: '#8b5cf6', // purple
    deadline: '#f97316', // orange
    reminder: '#6366f1' // indigo
  }
  return colorMap[type] || '#3b82f6'
}

