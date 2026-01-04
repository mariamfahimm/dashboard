// Attendance Routes
import { Router } from 'express'
import {
  getAttendanceByStudent,
  getAttendanceStats,
  createOrUpdateAttendance,
  getAllAttendance
} from '../controllers/attendanceController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/attendance/:studentId - Get attendance for a student
router.get('/:studentId', getAttendanceByStudent)

// GET /api/attendance/:studentId/stats - Get attendance statistics
router.get('/:studentId/stats', getAttendanceStats)

// POST /api/attendance - Create or update attendance record
router.post(
  '/',
  validateRequest({
    body: {
      studentId: { required: true, type: 'string' },
      date: { required: true, type: 'string' },
      status: { required: true, type: 'string', enum: ['present', 'absent', 'late', 'excused'] },
      time: { required: false, type: 'string' },
      notes: { required: false, type: 'string' }
    }
  }),
  createOrUpdateAttendance
)

// GET /api/attendance - Get all attendance (with optional filters)
router.get('/', getAllAttendance)

export default router

