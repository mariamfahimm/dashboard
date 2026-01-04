// Notice Controller
import { Response } from 'express'
import Notice from '../models/Notice'
import { AppError, asyncHandler } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

// GET /api/notices - Get notices for current user
export const getNotices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.userId
  const userRole = req.user?.role || 'parent'
  const { studentId, type, priority, limit = 20 } = req.query

  const filter: any = {
    published: true,
    $or: [
      { targetAudience: 'all' },
      { targetAudience: 'parents' },
      { targetAudience: { $in: [userId] } }
    ]
  }

  // If user is a parent, also show notices for their students
  if (userRole === 'parent' && studentId) {
    filter.$or.push({ studentId })
  }

  // Filter by date range (show only active notices)
  // Show notices where:
  // - startDate is in the past or doesn't exist
  // - AND endDate is in the future or doesn't exist
  const now = new Date()
  filter.$and = [
    {
      $or: [
        { startDate: { $lte: now } },
        { startDate: { $exists: false } }
      ]
    },
    {
      $or: [
        { endDate: { $gte: now } },
        { endDate: { $exists: false } }
      ]
    }
  ]

  if (type) filter.type = type
  if (priority) filter.priority = priority

  const notices = await Notice.find(filter)
    .sort({ priority: -1, publishedAt: -1 })
    .limit(Number(limit))

  res.json({
    success: true,
    count: notices.length,
    data: notices
  })
})

// GET /api/notices/:id - Get notice by ID
export const getNoticeById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notice = await Notice.findById(req.params.id)
  if (!notice) {
    throw new AppError('Notice not found', 404)
  }

  if (!notice.published) {
    throw new AppError('Notice not published', 404)
  }

  res.json({ success: true, data: notice })
})

// POST /api/notices - Create new notice (admin/teacher only)
export const createNotice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.userId
  const userName = req.user?.name || 'Unknown'
  const userRole = req.user?.role

  if (userRole !== 'admin' && userRole !== 'teacher') {
    throw new AppError('Unauthorized: Only admins and teachers can create notices', 403)
  }

  const {
    title,
    content,
    type,
    priority,
    targetAudience,
    studentId,
    startDate,
    endDate,
    attachments
  } = req.body

  if (!title || !content) {
    throw new AppError('Missing required fields: title, content', 400)
  }

  const notice = await Notice.create({
    title,
    content,
    type: type || 'info',
    priority: priority || 'normal',
    targetAudience: targetAudience || 'all',
    studentId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    attachments: attachments || [],
    createdBy: {
      userId,
      name: userName,
      role: userRole as 'admin' | 'teacher'
    },
    published: true,
    publishedAt: new Date()
  })

  res.status(201).json({ success: true, data: notice })
})

// PATCH /api/notices/:id - Update notice (admin/teacher only)
export const updateNotice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notice = await Notice.findById(req.params.id)
  if (!notice) {
    throw new AppError('Notice not found', 404)
  }

  const userRole = req.user?.role
  if (userRole !== 'admin' && userRole !== 'teacher') {
    throw new AppError('Unauthorized', 403)
  }

  const updates = req.body
  Object.assign(notice, updates)
  await notice.save()

  res.json({ success: true, data: notice })
})

// DELETE /api/notices/:id - Delete notice (admin/teacher only)
export const deleteNotice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notice = await Notice.findById(req.params.id)
  if (!notice) {
    throw new AppError('Notice not found', 404)
  }

  const userRole = req.user?.role
  if (userRole !== 'admin' && userRole !== 'teacher') {
    throw new AppError('Unauthorized', 403)
  }

  await notice.deleteOne()
  res.json({ success: true, message: 'Notice deleted' })
})

