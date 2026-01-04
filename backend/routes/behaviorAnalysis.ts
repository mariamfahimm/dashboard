// Behavior Pattern Analysis Routes
import { Router } from 'express'
import { getBehaviorAnalysis } from '../controllers/behaviorAnalysisController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/behavior-analysis/:studentId - Get behavior analysis for a student
router.get('/:studentId', getBehaviorAnalysis)

export default router

