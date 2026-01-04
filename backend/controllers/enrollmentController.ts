// Enrollment Controller
import { Request, Response } from 'express'
import Enrollment from '../models/Enrollment'
import User from '../models/User'
import Course from '../models/Course'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/enrollments - Get all enrollments
export const getAllEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const { userId, studentId, courseId, status } = req.query
  const filter: any = {}
  if (userId) filter.userId = userId
  if (studentId) filter.studentId = studentId
  if (courseId) filter.courseId = courseId
  if (status) filter.status = status

  const enrollments = await Enrollment.find(filter).sort({ enrolledAt: -1 })
  res.json({ success: true, count: enrollments.length, data: enrollments })
})

// GET /api/enrollments/:id - Get enrollment by ID
export const getEnrollmentById = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findById(req.params.id)
  
  if (!enrollment) {
    throw new AppError('Enrollment not found', 404)
  }

  res.json({ success: true, data: enrollment })
})

// POST /api/enrollments - Create new enrollment
export const createEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { userId, studentId, courseId, status } = req.body

  // Verify user exists
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Verify student exists
  const student = await Student.findOne({ studentId })
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // Verify course exists
  const course = await Course.findById(courseId)
  if (!course) {
    throw new AppError('Course not found', 404)
  }

  // Check if enrollment already exists
  const existingEnrollment = await Enrollment.findOne({ userId, courseId })
  if (existingEnrollment) {
    throw new AppError('Student is already enrolled in this course', 400)
  }

  const enrollment = await Enrollment.create({
    userId,
    studentId,
    courseId,
    status: status || 'active'
  })

  res.status(201).json({ success: true, data: enrollment })
})

// PUT /api/enrollments/:id - Update enrollment
export const updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body
  const updateData: any = {}

  if (status) {
    if (!['active', 'completed', 'dropped'].includes(status)) {
      throw new AppError('Invalid status. Must be: active, completed, or dropped', 400)
    }
    updateData.status = status
  }

  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!enrollment) {
    throw new AppError('Enrollment not found', 404)
  }

  res.json({ success: true, data: enrollment })
})

// DELETE /api/enrollments/:id - Delete enrollment
export const deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id)

  if (!enrollment) {
    throw new AppError('Enrollment not found', 404)
  }

  res.json({ success: true, message: 'Enrollment deleted successfully' })
})

