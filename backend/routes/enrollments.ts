// Enrollment Routes
import { Router } from 'express'
import {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment
} from '../controllers/enrollmentController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// GET /api/enrollments
router.get('/', getAllEnrollments)

// GET /api/enrollments/:id
router.get('/:id', getEnrollmentById)

// POST /api/enrollments
router.post(
  '/',
  validateRequest({
    body: {
      userId: { required: true, type: 'string' },
      studentId: { required: true, type: 'string' },
      courseId: { required: true, type: 'string' }
    }
  }),
  createEnrollment
)

// PUT /api/enrollments/:id
router.put('/:id', updateEnrollment)

// DELETE /api/enrollments/:id
router.delete('/:id', deleteEnrollment)

export default router

