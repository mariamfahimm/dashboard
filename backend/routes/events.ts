// Event Routes
import { Router } from 'express'
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/events - Get events
router.get('/', getEvents)

// GET /api/events/:id - Get event by ID
router.get('/:id', getEventById)

// POST /api/events - Create new event
router.post('/', createEvent)

// PUT /api/events/:id - Update event
router.put('/:id', updateEvent)

// DELETE /api/events/:id - Delete event
router.delete('/:id', deleteEvent)

export default router

