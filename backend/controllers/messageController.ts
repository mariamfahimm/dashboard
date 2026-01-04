// Message Controller
import { Response } from 'express'
import Message from '../models/Message'
import { AppError, asyncHandler } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

// GET /api/messages - Get messages for current user
export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.userId
  if (!userId) {
    throw new AppError('User not authenticated', 401)
  }

  const { studentId, read, category, limit = 50 } = req.query
  const filter: any = {
    $or: [
      { 'to.userId': userId },
      { 'from.userId': userId }
    ]
  }

  if (studentId) filter.studentId = studentId
  if (read !== undefined) filter.read = read === 'true'
  if (category) filter.category = category

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))

  // Get unread count
  const unreadCount = await Message.countDocuments({
    'to.userId': userId,
    read: false
  })

  res.json({
    success: true,
    count: messages.length,
    unreadCount,
    data: messages
  })
})

// GET /api/messages/:id - Get message by ID
export const getMessageById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const message = await Message.findById(req.params.id)
  if (!message) {
    throw new AppError('Message not found', 404)
  }

  const userId = req.user?._id || req.user?.userId
  if (message.to.userId !== userId && message.from.userId !== userId) {
    throw new AppError('Unauthorized to view this message', 403)
  }

  res.json({ success: true, data: message })
})

// POST /api/messages - Create new message
export const createMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.userId
  const userName = req.user?.name || 'Unknown'
  const userRole = req.user?.role || 'parent'

  // Parse body - could be JSON or FormData
  let to, studentId, subject, content, priority, category
  
  if (typeof req.body.to === 'string') {
    // FormData - parse JSON strings
    try {
      to = JSON.parse(req.body.to)
    } catch {
      throw new AppError('Invalid "to" field format', 400)
    }
    studentId = req.body.studentId
    subject = req.body.subject
    content = req.body.content
    priority = req.body.priority
    category = req.body.category
  } else {
    // JSON body
    ({ to, studentId, subject, content, priority, category } = req.body)
  }

  if (!to || !to.userId || !subject || !content) {
    throw new AppError('Missing required fields: to, subject, content', 400)
  }

  // Handle file attachments from multer
  const attachments: string[] = []
  const files = (req as any).files as Express.Multer.File[] | undefined
  if (files && Array.isArray(files)) {
    attachments.push(...files.map((file: Express.Multer.File) => {
      // Return URL to access the file
      return `/uploads/messages/${file.filename}`
    }))
  } else if (req.body.attachments && Array.isArray(req.body.attachments)) {
    // Fallback: if attachments are passed as URLs in body
    attachments.push(...req.body.attachments)
  }

  const message = await Message.create({
    from: {
      userId,
      name: userName,
      role: userRole as 'parent' | 'teacher' | 'admin',
      avatar: req.user?.avatar
    },
    to,
    studentId,
    subject,
    content,
    priority: priority || 'normal',
    category: category || 'general',
    attachments
  })

  res.status(201).json({ success: true, data: message })
})

// PATCH /api/messages/:id/read - Mark message as read
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const message = await Message.findById(req.params.id)
  if (!message) {
    throw new AppError('Message not found', 404)
  }

  const userId = req.user?._id || req.user?.userId
  if (message.to.userId !== userId) {
    throw new AppError('Unauthorized', 403)
  }

  message.read = true
  message.readAt = new Date()
  await message.save()

  res.json({ success: true, data: message })
})

// DELETE /api/messages/:id - Delete message
export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const message = await Message.findById(req.params.id)
  if (!message) {
    throw new AppError('Message not found', 404)
  }

  const userId = req.user?._id || req.user?.userId
  if (message.from.userId !== userId && message.to.userId !== userId) {
    throw new AppError('Unauthorized', 403)
  }

  await message.deleteOne()
  res.json({ success: true, message: 'Message deleted' })
})

