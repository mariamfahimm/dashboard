// Assignment Routes
import { Router } from 'express'
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsForCourse
} from '../controllers/assignmentController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// GET /api/assignments
router.get('/', getAllAssignments)

// GET /api/assignments/:id
router.get('/:id', getAssignmentById)

// GET /api/assignments/course/:courseId - Get all assignments for a course
router.get('/course/:courseId', getAssignmentsForCourse)

// POST /api/assignments
router.post(
  '/',
  validateRequest({
    body: {
      courseId: { required: true, type: 'string' },
      title: { required: true, type: 'string' },
      dueDate: { required: true, type: 'string' }
    }
  }),
  createAssignment
)

// PUT /api/assignments/:id
router.put('/:id', updateAssignment)

// DELETE /api/assignments/:id
router.delete('/:id', deleteAssignment)

export default router

