// At-Risk Student Detection Routes
import { Router } from 'express'
import {
  getAtRiskPrediction,
  getAllAtRiskPredictions
} from '../controllers/atRiskController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/at-risk/:studentId - Get at-risk prediction for a student
router.get('/:studentId', getAtRiskPrediction)

// GET /api/at-risk - Get at-risk predictions for all user's students
router.get('/', getAllAtRiskPredictions)

export default router

