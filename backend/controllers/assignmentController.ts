// Assignment Controller
import { Request, Response } from 'express'
import Assignment from '../models/Assignment'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'
import { generateAcademicInsights } from '../services/analyticsEngine'
import { emitStudentUpdate } from '../services/eventEmitter'

// GET /api/assignments - Get all assignments
export const getAllAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, subject, status } = req.query
  const filter: any = {}
  if (courseId) filter.courseId = courseId
  if (subject) filter.subject = subject
  if (status) filter.status = status

  const assignments = await Assignment.find(filter).sort({ dueDate: 1 })
  res.json({ success: true, count: assignments.length, data: assignments })
})

// GET /api/assignments/:id - Get assignment by ID
export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await Assignment.findById(req.params.id)
  
  if (!assignment) {
    throw new AppError('Assignment not found', 404)
  }

  res.json({ success: true, data: assignment })
})

// POST /api/assignments - Create new assignment
export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, title, description, subject, dueDate, status } = req.body

  // Verify course exists
  const course = await Course.findById(courseId)
  if (!course) {
    throw new AppError('Course not found', 404)
  }

  // Validate dueDate
  if (dueDate && new Date(dueDate) < new Date()) {
    throw new AppError('Due date cannot be in the past', 400)
  }

  const assignment = await Assignment.create({
    courseId,
    title,
    description,
    subject: subject || course.subject,
    dueDate: dueDate || new Date(),
    status: status || 'active'
  })

  // Trigger analytics recalculation for affected students in background
  setImmediate(async () => {
    try {
      // Find all students enrolled in this course
      const enrollments = await Enrollment.find({ courseId })
      const studentIds = [...new Set(enrollments.map(e => e.studentId))]

      // Recalculate insights for each affected student
      for (const studentIdStr of studentIds) {
        const student = await Student.findOne({ studentId: studentIdStr })
        if (!student) continue

        const studentMongoId = String(student._id)
        const insights = await generateAcademicInsights(studentMongoId)

        emitStudentUpdate({
          studentId: studentMongoId,
          parentId: student.userId,
          type: 'assignment',
          data: {
            insights,
            message: `New assignment: ${assignment.title}`
          },
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.error('Error processing assignment analytics:', error)
    }
  })

  res.status(201).json({ success: true, data: assignment })
})

// PUT /api/assignments/:id - Update assignment
export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, subject, dueDate, status } = req.body
  const updateData: any = {}

  if (title) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (subject) updateData.subject = subject
  if (dueDate) {
    if (new Date(dueDate) < new Date()) {
      throw new AppError('Due date cannot be in the past', 400)
    }
    updateData.dueDate = dueDate
  }
  if (status) {
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status. Must be: active, completed, or cancelled', 400)
    }
    updateData.status = status
  }

  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!assignment) {
    throw new AppError('Assignment not found', 404)
  }

  res.json({ success: true, data: assignment })
})

// DELETE /api/assignments/:id - Delete assignment
export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await Assignment.findById(req.params.id)
  
  if (!assignment) {
    throw new AppError('Assignment not found', 404)
  }

  const courseId = assignment.courseId
  await Assignment.findByIdAndDelete(req.params.id)

  // Trigger analytics recalculation for affected students
  setImmediate(async () => {
    try {
      const enrollments = await Enrollment.find({ courseId })
      const studentIds = [...new Set(enrollments.map(e => e.studentId))]

      for (const studentIdStr of studentIds) {
        const student = await Student.findOne({ studentId: studentIdStr })
        if (!student) continue

        const studentMongoId = String(student._id)
        const insights = await generateAcademicInsights(studentMongoId)

        emitStudentUpdate({
          studentId: studentMongoId,
          parentId: student.userId,
          type: 'assignment',
          data: {
            insights,
            message: `Assignment deleted: ${assignment.title}`
          },
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.error('Error processing assignment deletion analytics:', error)
    }
  })

  res.json({ success: true, message: 'Assignment deleted successfully' })
})

// GET /api/assignments/course/:courseId - Get all assignments for a course
export const getAssignmentsForCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params

  // Verify course exists
  const course = await Course.findById(courseId)
  if (!course) {
    throw new AppError('Course not found', 404)
  }

  const assignments = await Assignment.find({ courseId }).sort({ dueDate: 1 })
  res.json({ success: true, count: assignments.length, data: assignments })
})

