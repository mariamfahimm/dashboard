// Alert Routes (CRUD + Specialized)
import { Router } from 'express'
import {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  markAlertAsRead,
  getAlertsForStudent
} from '../controllers/alertController'
import {
  getStudentAlerts,
  getRules,
  generate as generateAlerts
} from '../controllers/alertsController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// ============================================
// Specialized Routes (must come before generic :id routes)
// ============================================
// GET /api/alerts/rules - Get alert rules
router.get('/rules', getRules)

// GET /api/alerts/student/:studentId - Get all alerts for a student (CRUD version)
router.get('/student/:studentId', getAlertsForStudent)

// GET /api/alerts/:studentId - Get all alerts for a student (specialized version)
router.get('/:studentId', getStudentAlerts)

// POST /api/alerts/:studentId/generate - Auto-generate alerts
router.post('/:studentId/generate', generateAlerts)

// ============================================
// CRUD Routes
// ============================================
// GET /api/alerts - Get all alerts
router.get('/', getAllAlerts)

// POST /api/alerts - Create new alert
router.post(
  '/',
  validateRequest({
    body: {
      title: { required: true, type: 'string' },
      message: { required: true, type: 'string' },
      studentId: { required: true, type: 'string' }
    }
  }),
  createAlert
)

// PATCH /api/alerts/:id/read - Mark alert as read
router.patch('/:id/read', markAlertAsRead)

// GET /api/alerts/:id - Get alert by ID (must be last to avoid conflicts)
router.get('/:id', getAlertById)

// PUT /api/alerts/:id - Update alert
router.put('/:id', updateAlert)

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', deleteAlert)

export default router

