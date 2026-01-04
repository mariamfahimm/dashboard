// Demo Routes (DEMO MODE ONLY)
import { Router } from 'express'
import { seedDemoData } from '../controllers/demoController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All demo routes require authentication and admin role
router.use(authenticate)

// POST /api/demo/seed - Seed demo data (admin only, demo mode only)
router.post('/seed', seedDemoData)

export default router

