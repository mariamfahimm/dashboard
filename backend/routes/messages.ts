// Message Routes
import { Router } from 'express'
import {
  getMessages,
  getMessageById,
  createMessage,
  markAsRead,
  deleteMessage
} from '../controllers/messageController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { upload } from '../middleware/upload'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/messages - Get messages for current user
router.get(
  '/',
  validateRequest({
    query: {
      studentId: { required: false, type: 'string' },
      read: { required: false, type: 'string' },
      category: { required: false, type: 'string' },
      limit: { required: false, type: 'number' }
    }
  }),
  getMessages
)

// GET /api/messages/:id - Get message by ID
router.get('/:id', getMessageById)

// POST /api/messages - Create new message (with file upload support)
// Note: validation runs after multer, so body fields are parsed from FormData
router.post(
  '/',
  upload.array('attachments', 5), // Max 5 files, field name: 'attachments'
  createMessage // Validation handled in controller
)

// PATCH /api/messages/:id/read - Mark message as read
router.patch('/:id/read', markAsRead)

// DELETE /api/messages/:id - Delete message
router.delete('/:id', deleteMessage)

export default router

