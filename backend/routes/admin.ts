// Admin Routes
import { Router } from 'express'
import {
  createParentAccount,
  bulkCreateParentAccounts,
  getAllParents,
  linkStudentToParent,
  resendCredentials,
  deleteParentAccount,
  migrateStudentIds,
} from '../controllers/adminController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All admin routes require authentication
router.use(authenticate)

// POST /api/admin/parents/create - Create single parent account
router.post(
  '/parents/create',
  validateRequest({
    body: {
      name: { required: true, type: 'string' },
      email: { required: true, type: 'string', email: true },
      studentIds: { required: false, type: 'array' },
      sendEmail: { required: false, type: 'boolean' },
      language: { required: false, type: 'string', enum: ['en', 'ar'] },
    },
  }),
  createParentAccount
)

// POST /api/admin/parents/bulk-create - Bulk create parent accounts
router.post(
  '/parents/bulk-create',
  validateRequest({
    body: {
      parents: { required: true, type: 'array' },
      sendEmails: { required: false, type: 'boolean' },
    },
  }),
  bulkCreateParentAccounts
)

// GET /api/admin/parents - Get all parents with students
router.get('/parents', getAllParents)

// POST /api/admin/parents/:parentId/link-student - Link student to parent
router.post(
  '/parents/:parentId/link-student',
  validateRequest({
    body: {
      studentId: { required: true, type: 'string' },
    },
  }),
  linkStudentToParent
)

// POST /api/admin/parents/:parentId/resend-credentials - Resend credentials
router.post(
  '/parents/:parentId/resend-credentials',
  validateRequest({
    body: {
      generateNewPassword: { required: false, type: 'boolean' },
    },
  }),
  resendCredentials
)

// DELETE /api/admin/parents/:parentId - Delete parent account
router.delete('/parents/:parentId', deleteParentAccount)

// POST /api/admin/students/migrate-ids - Migrate all students to new ID format
router.post('/students/migrate-ids', migrateStudentIds)

export default router

