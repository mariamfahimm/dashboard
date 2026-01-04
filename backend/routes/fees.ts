// Fees/Payments Routes
import { Router } from 'express'
import {
  getFeesByStudent,
  getFeeStats,
  getPaymentHistory,
  createFee,
  updateFee,
  recordPayment,
  deleteFee
} from '../controllers/feeController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/fees/:studentId - Get all fees for a student
router.get('/:studentId', getFeesByStudent)

// GET /api/fees/:studentId/stats - Get fee statistics
router.get('/:studentId/stats', getFeeStats)

// GET /api/fees/:studentId/history - Get payment history
router.get('/:studentId/history', getPaymentHistory)

// POST /api/fees - Create a new fee
router.post(
  '/',
  validateRequest({
    body: {
      studentId: { required: true, type: 'string' },
      feeType: { required: true, type: 'string', enum: ['tuition', 'activity', 'transport', 'library', 'technology', 'other'] },
      description: { required: true, type: 'string' },
      amount: { required: true, type: 'number' },
      dueDate: { required: true, type: 'string' },
      notes: { required: false, type: 'string' }
    }
  }),
  createFee
)

// PUT /api/fees/:id - Update fee
router.put('/:id', updateFee)

// POST /api/fees/:id/pay - Record a payment
router.post(
  '/:id/pay',
  validateRequest({
    body: {
      amount: { required: true, type: 'number' },
      paymentMethod: { required: false, type: 'string', enum: ['cash', 'check', 'bank_transfer', 'online', 'card'] },
      receiptNumber: { required: false, type: 'string' },
      notes: { required: false, type: 'string' }
    }
  }),
  recordPayment
)

// DELETE /api/fees/:id - Delete fee
router.delete('/:id', deleteFee)

export default router

