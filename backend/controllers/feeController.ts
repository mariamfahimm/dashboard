// Fee/Payment Controller
import { Request, Response } from 'express'
import Fee from '../models/Fee'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/fees/:studentId - Get all fees for a student
export const getFeesByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const { status, feeType, startDate, endDate } = req.query

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  const filter: any = { studentId }

  if (status) {
    filter.status = status
  }

  if (feeType) {
    filter.feeType = feeType
  }

  // Date range filter
  if (startDate || endDate) {
    filter.dueDate = {}
    if (startDate) {
      filter.dueDate.$gte = new Date(startDate as string)
    }
    if (endDate) {
      filter.dueDate.$lte = new Date(endDate as string)
    }
  }

  const fees = await Fee.find(filter)
    .sort({ dueDate: -1 })

  res.json({
    success: true,
    count: fees.length,
    data: fees
  })
})

// GET /api/fees/:studentId/stats - Get fee statistics for a student
export const getFeeStats = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  const fees = await Fee.find({ studentId })

  const stats = {
    totalFees: fees.length,
    totalAmount: fees.reduce((sum, fee) => sum + fee.amount, 0),
    totalPaid: fees.reduce((sum, fee) => sum + fee.paidAmount, 0),
    totalPending: fees.reduce((sum, fee) => {
      if (fee.status === 'pending' || fee.status === 'overdue' || fee.status === 'partial') {
        return sum + (fee.amount - fee.paidAmount)
      }
      return sum
    }, 0),
    overdueCount: fees.filter(f => f.status === 'overdue').length,
    overdueAmount: fees
      .filter(f => f.status === 'overdue')
      .reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0),
    pendingCount: fees.filter(f => f.status === 'pending').length,
    paidCount: fees.filter(f => f.status === 'paid').length
  }

  res.json({
    success: true,
    data: stats
  })
})

// GET /api/fees/:studentId/history - Get payment history
export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  // Get fees that have been paid (at least partially)
  const fees = await Fee.find({
    studentId,
    $or: [
      { status: 'paid' },
      { status: 'partial' },
      { paidAmount: { $gt: 0 } }
    ]
  })
    .sort({ paidDate: -1, dueDate: -1 })

  res.json({
    success: true,
    count: fees.length,
    data: fees
  })
})

// POST /api/fees - Create a new fee
export const createFee = asyncHandler(async (req: Request, res: Response) => {
  const {
    studentId,
    feeType,
    description,
    amount,
    dueDate,
    notes
  } = req.body

  if (!studentId || !feeType || !description || !amount || !dueDate) {
    throw new AppError('Student ID, fee type, description, amount, and due date are required', 400)
  }

  if (amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400)
  }

  // Determine status based on due date
  let status: 'pending' | 'overdue' = 'pending'
  const due = new Date(dueDate)
  if (due < new Date()) {
    status = 'overdue'
  }

  const fee = await Fee.create({
    studentId,
    feeType,
    description,
    amount,
    dueDate: due,
    status,
    notes,
    paidAmount: 0
  })

  res.status(201).json({
    success: true,
    data: fee,
    message: 'Fee created successfully'
  })
})

// PUT /api/fees/:id - Update fee
export const updateFee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { description, amount, dueDate, status, notes } = req.body

  const fee = await Fee.findById(id)
  if (!fee) {
    throw new AppError('Fee not found', 404)
  }

  if (description) fee.description = description
  if (amount !== undefined) {
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400)
    }
    fee.amount = amount
  }
  if (dueDate) {
    fee.dueDate = new Date(dueDate)
    // Update status if overdue
    if (fee.dueDate < new Date() && fee.status === 'pending') {
      fee.status = 'overdue'
    }
  }
  if (status) fee.status = status
  if (notes !== undefined) fee.notes = notes

  await fee.save()

  res.json({
    success: true,
    data: fee,
    message: 'Fee updated successfully'
  })
})

// POST /api/fees/:id/pay - Record a payment
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { amount, paymentMethod, receiptNumber, notes } = req.body

  if (!amount || amount <= 0) {
    throw new AppError('Payment amount is required and must be greater than 0', 400)
  }

  const fee = await Fee.findById(id)
  if (!fee) {
    throw new AppError('Fee not found', 404)
  }

  const newPaidAmount = fee.paidAmount + amount

  if (newPaidAmount > fee.amount) {
    throw new AppError('Payment amount exceeds the remaining balance', 400)
  }

  fee.paidAmount = newPaidAmount
  fee.paidDate = new Date()

  if (paymentMethod) fee.paymentMethod = paymentMethod
  if (receiptNumber) fee.receiptNumber = receiptNumber
  if (notes) fee.notes = (fee.notes ? fee.notes + '\n' : '') + notes

  // Update status based on payment
  if (newPaidAmount >= fee.amount) {
    fee.status = 'paid'
  } else if (newPaidAmount > 0) {
    fee.status = 'partial'
  } else {
    // Check if overdue
    if (fee.dueDate < new Date()) {
      fee.status = 'overdue'
    } else {
      fee.status = 'pending'
    }
  }

  await fee.save()

  res.json({
    success: true,
    data: fee,
    message: 'Payment recorded successfully'
  })
})

// DELETE /api/fees/:id - Delete fee
export const deleteFee = asyncHandler(async (req: Request, res: Response) => {
  const fee = await Fee.findByIdAndDelete(req.params.id)

  if (!fee) {
    throw new AppError('Fee not found', 404)
  }

  res.json({
    success: true,
    message: 'Fee deleted successfully'
  })
})

