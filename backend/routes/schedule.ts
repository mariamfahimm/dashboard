// Schedule/Timetable Routes
import { Router } from 'express'
import {
  getScheduleByStudent,
  getWeeklySchedule,
  createOrUpdateSchedule,
  deleteSchedule
} from '../controllers/scheduleController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/schedule/:studentId - Get timetable for a student
router.get('/:studentId', getScheduleByStudent)

// GET /api/schedule/:studentId/weekly - Get weekly timetable organized by day
router.get('/:studentId/weekly', getWeeklySchedule)

// POST /api/schedule - Create or update schedule entry
router.post(
  '/',
  validateRequest({
    body: {
      studentId: { required: true, type: 'string' },
      courseId: { required: true, type: 'string' },
      dayOfWeek: { required: true, type: 'number', min: 0, max: 6 },
      period: { required: true, type: 'number', min: 1 },
      startTime: { required: true, type: 'string' },
      endTime: { required: true, type: 'string' },
      room: { required: false, type: 'string' },
      teacherId: { required: false, type: 'string' },
      teacherName: { required: false, type: 'string' }
    }
  }),
  createOrUpdateSchedule
)

// DELETE /api/schedule/:id - Delete schedule entry
router.delete('/:id', deleteSchedule)

export default router

