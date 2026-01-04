// Authentication Routes
import { Router } from 'express'
import { register, login, getMe, logout, changePassword, impersonate } from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// POST /api/auth/register
router.post(
  '/register',
  validateRequest({
    body: {
      name: { required: true, type: 'string' },
      email: { required: true, type: 'string', email: true },
      password: { required: true, type: 'string' },
      role: { required: true, type: 'string', enum: ['student', 'teacher', 'admin'] },
    },
  }),
  register
)

// POST /api/auth/login
router.post(
  '/login',
  validateRequest({
    body: {
      email: { required: true, type: 'string', email: true },
      password: { required: true, type: 'string' },
    },
  }),
  login
)

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, getMe)

// POST /api/auth/logout
router.post('/logout', authenticate, logout)

// POST /api/auth/change-password - Change password (protected)
router.post(
  '/change-password',
  authenticate,
  validateRequest({
    body: {
      currentPassword: { required: true, type: 'string' },
      newPassword: { required: true, type: 'string' },
    },
  }),
  changePassword
)

// POST /api/auth/impersonate - Impersonate user (DEMO MODE ONLY, admin required)
router.post(
  '/impersonate',
  authenticate,
  validateRequest({
    body: {
      email: { required: true, type: 'string', email: true },
    },
  }),
  impersonate
)

export default router

