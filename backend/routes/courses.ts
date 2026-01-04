// Course Routes
import { Router } from 'express'
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesForStudent,
  getStudentsInCourse
} from '../controllers/courseController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// GET /api/courses
router.get('/', getAllCourses)

// GET /api/courses/:id
router.get('/:id', getCourseById)

// GET /api/courses/student/:studentId - Get all courses for a student
router.get('/student/:studentId', getCoursesForStudent)

// GET /api/courses/:courseId/students - Get all students in a course
router.get('/:courseId/students', getStudentsInCourse)

// POST /api/courses
router.post(
  '/',
  validateRequest({
    body: {
      title: { required: true, type: 'string' },
      teacherId: { required: true, type: 'string' },
      subject: { required: true, type: 'string' }
    }
  }),
  createCourse
)

// PUT /api/courses/:id
router.put('/:id', updateCourse)

// DELETE /api/courses/:id
router.delete('/:id', deleteCourse)

export default router

