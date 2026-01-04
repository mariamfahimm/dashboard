// Recommendation Routes (CRUD + Specialized)
import { Router } from 'express'
import {
  getAllRecommendations,
  getRecommendationById,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  acceptRecommendation,
  dismissRecommendation,
  getRecommendationsForStudent,
  getStudentRecommendations,
  generate as generateRecommendations,
  accept,
  dismiss,
  getEffectiveness
} from '../controllers/recommendationController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// ============================================
// Specialized Routes (must come before generic :id routes)
// ============================================
// GET /api/recommendations/student/:studentId - Get all recommendations for a student (CRUD version)
router.get('/student/:studentId', getRecommendationsForStudent)

// GET /api/recommendations/:studentId - Get all recommendations for a student (specialized version)
router.get('/:studentId', getStudentRecommendations)

// POST /api/recommendations/generate - Generate recommendations
router.post('/generate', generateRecommendations)

// POST /api/recommendations/:recommendationId/accept - Accept recommendation (specialized)
router.post('/:recommendationId/accept', accept)

// POST /api/recommendations/:recommendationId/dismiss - Dismiss recommendation (specialized)
router.post('/:recommendationId/dismiss', dismiss)

// GET /api/recommendations/:recommendationId/effectiveness - Get recommendation effectiveness
router.get('/:recommendationId/effectiveness', getEffectiveness)

// ============================================
// CRUD Routes
// ============================================
// GET /api/recommendations - Get all recommendations
router.get('/', getAllRecommendations)

// POST /api/recommendations - Create new recommendation
router.post(
  '/',
  validateRequest({
    body: {
      title: { required: true, type: 'string' },
      description: { required: true, type: 'string' },
      studentId: { required: true, type: 'string' }
    }
  }),
  createRecommendation
)

// POST /api/recommendations/:id/accept - Accept recommendation (CRUD)
router.post('/:id/accept', acceptRecommendation)

// POST /api/recommendations/:id/dismiss - Dismiss recommendation (CRUD)
router.post('/:id/dismiss', dismissRecommendation)

// PUT /api/recommendations/:id - Update recommendation
router.put('/:id', updateRecommendation)

// GET /api/recommendations/:id - Get recommendation by ID (must be last to avoid conflicts)
router.get('/:id', getRecommendationById)

// DELETE /api/recommendations/:id - Delete recommendation
router.delete('/:id', deleteRecommendation)

export default router

