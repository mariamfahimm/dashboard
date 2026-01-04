// User Routes
import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePreferences
} from '../controllers/userController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// GET /api/users
router.get('/', getAllUsers)

// GET /api/users/:id
router.get('/:id', getUserById)

// PUT /api/users/:id/preferences - Update user preferences (must come before /:id route)
router.put('/:id/preferences', updatePreferences)

// POST /api/users
router.post(
  '/',
  validateRequest({
    body: {
      name: { required: true, type: 'string' },
      email: { required: true, type: 'string', email: true },
      password: { required: true, type: 'string' },
      role: { required: true, type: 'string', enum: ['student', 'teacher', 'admin', 'parent'] }
    }
  }),
  createUser
)

// PUT /api/users/:id
router.put('/:id', updateUser)

// DELETE /api/users/:id
router.delete('/:id', deleteUser)

export default router

