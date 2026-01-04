// Goal Routes
import { Router } from 'express'
import {
  getAllGoals,
  getGoalById,
  getGoalsForStudent,
  createGoal,
  updateGoal,
  deleteGoal,
  recalculateGoal
} from '../controllers/goalController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// GET /api/goals
router.get('/', getAllGoals)

// GET /api/goals/:id
router.get('/:id', getGoalById)

// GET /api/goals/student/:id (alternative route)
router.get('/student/:id', getGoalsForStudent)

// POST /api/goals
router.post(
  '/',
  validateRequest({
    body: {
      studentId: { required: true, type: 'string' },
      name: { required: true, type: 'string' },
      type: { required: true, type: 'string' },
      target: { required: true, type: 'number', min: 0 }
    }
  }),
  createGoal
)

// PUT /api/goals/:id
router.put('/:id', updateGoal)

// DELETE /api/goals/:id
router.delete('/:id', deleteGoal)

// POST /api/goals/:id/recalculate
router.post('/:id/recalculate', recalculateGoal)

export default router

