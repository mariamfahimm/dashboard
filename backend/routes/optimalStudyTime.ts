// Routes for Optimal Study Time Predictions
import express from 'express'
import { authenticate } from '../middleware/auth'
import { getOptimalStudyTime } from '../controllers/optimalStudyTimeController'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// GET /api/optimal-study-time/:studentId
router.get('/:studentId', getOptimalStudyTime)

export default router

