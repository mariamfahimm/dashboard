// Student Routes
import { Router } from 'express'
import {
  getAllStudents,
  getStudentById,
  getStudentByStudentId,
  createStudent,
  updateStudent,
  deleteStudent,
  generateLinkingCode,
  linkStudentByCode,
  verifyLinkingCode
} from '../controllers/studentController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// GET /api/students
router.get('/', getAllStudents)

// GET /api/students/studentId/:studentId (must come before /:id to avoid route conflicts)
router.get('/studentId/:studentId', getStudentByStudentId)

// GET /api/students/:id/courses - Get courses for a student (must come before /:id)
import { getCoursesForStudent } from '../controllers/courseController'
router.get('/:id/courses', getCoursesForStudent)

// GET /api/students/:id/recommendations - Get recommendations for a student
import { getRecommendationsForStudent } from '../controllers/recommendationController'
router.get('/:id/recommendations', getRecommendationsForStudent)

// GET /api/students/:id/goals - Get goals for a student
import { getGoalsForStudent } from '../controllers/goalController'
router.get('/:id/goals', getGoalsForStudent)

// POST /api/students/:id/generate-linking-code - Generate linking code (protected, admin/teacher only)
router.post('/:id/generate-linking-code', authenticate, generateLinkingCode)

// GET /api/students/:id (must be last to avoid route conflicts)
router.get('/:id', getStudentById)

// POST /api/students
router.post(
  '/',
  validateRequest({
    body: {
      name: { required: true, type: 'string' },
      studentId: { required: false, type: 'string' }, // Optional - will be auto-generated if not provided
      gradeLevel: { required: true, type: 'number', min: 1, max: 12 }
    }
  }),
  createStudent
)

// PUT /api/students/:id
router.put('/:id', updateStudent)

// DELETE /api/students/:id
router.delete('/:id', deleteStudent)

// POST /api/students/link - Link student to parent using code (protected)
router.post(
  '/link',
  authenticate,
  validateRequest({
    body: {
      linkingCode: { required: true, type: 'string' }
    }
  }),
  linkStudentByCode
)

// GET /api/students/linking-code/:code - Verify linking code (protected)
router.get('/linking-code/:code', authenticate, verifyLinkingCode)

export default router

