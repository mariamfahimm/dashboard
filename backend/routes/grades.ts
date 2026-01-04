// Grade Routes
import { Router } from 'express'
import {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradesForStudent
} from '../controllers/gradeController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// GET /api/grades
router.get('/', getAllGrades)

// GET /api/grades/:id
router.get('/:id', getGradeById)

// GET /api/grades/student/:studentId - Get all grades for a student
router.get('/student/:studentId', getGradesForStudent)

// POST /api/grades
router.post(
  '/',
  validateRequest({
    body: {
      enrollmentId: { required: true, type: 'string' },
      assignmentId: { required: false, type: 'string' }, // Optional - will auto-create if missing
      studentId: { required: true, type: 'string' },
      courseId: { required: false, type: 'string' }, // Required if assignmentId is missing
      score: { required: true, type: 'number', min: 0 }
    }
  }),
  createGrade
)

// PUT /api/grades/:id
router.put('/:id', updateGrade)

// DELETE /api/grades/:id
router.delete('/:id', deleteGrade)

export default router

