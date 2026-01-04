// Notice Routes
import { Router } from 'express'
import {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
} from '../controllers/noticeController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/notices - Get notices for current user
router.get(
  '/',
  validateRequest({
    query: {
      studentId: { required: false, type: 'string' },
      type: { required: false, type: 'string' },
      priority: { required: false, type: 'string' },
      limit: { required: false, type: 'number' }
    }
  }),
  getNotices
)

// GET /api/notices/:id - Get notice by ID
router.get('/:id', getNoticeById)

// POST /api/notices - Create new notice (admin/teacher only)
router.post(
  '/',
  validateRequest({
    body: {
      title: { required: true, type: 'string' },
      content: { required: true, type: 'string' }
    }
  }),
  createNotice
)

// PATCH /api/notices/:id - Update notice (admin/teacher only)
router.patch('/:id', updateNotice)

// DELETE /api/notices/:id - Delete notice (admin/teacher only)
router.delete('/:id', deleteNotice)

export default router

