// Assignment Completion Prediction Routes
import { Router } from 'express'
import {
  getAssignmentPrediction,
  getAllAssignmentPredictions
} from '../controllers/assignmentCompletionController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/assignment-completion/:studentId/:assignmentId - Get prediction for one assignment
router.get('/:studentId/:assignmentId', getAssignmentPrediction)

// GET /api/assignment-completion/:studentId - Get predictions for all assignments
router.get('/:studentId', getAllAssignmentPredictions)

export default router

