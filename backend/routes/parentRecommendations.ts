// Parent Recommendations Routes
import { Router } from 'express'
import {
  getRecommendationsForStudent,
  getAllRecommendations
} from '../controllers/parentRecommendationController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/parent-recommendations/:studentId - Get recommendations for a student
router.get('/:studentId', getRecommendationsForStudent)

// GET /api/parent-recommendations - Get recommendations for all user's students
router.get('/', getAllRecommendations)

export default router

