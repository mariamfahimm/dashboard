// Course Controller
import { Request, Response } from 'express'
import Course from '../models/Course'
import User from '../models/User'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/courses - Get all courses
export const getAllCourses = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, subject } = req.query
  const filter: any = {}
  if (teacherId) filter.teacherId = teacherId
  if (subject) filter.subject = subject

  const courses = await Course.find(filter).sort({ createdAt: -1 })
  res.json({ success: true, count: courses.length, data: courses })
})

// GET /api/courses/:id - Get course by ID
export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id)
  
  if (!course) {
    throw new AppError('Course not found', 404)
  }

  res.json({ success: true, data: course })
})

// POST /api/courses - Create new course
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, teacherId, subject } = req.body

  // Verify teacher exists
  const teacher = await User.findOne({ _id: teacherId, role: 'teacher' })
  if (!teacher) {
    throw new AppError('Teacher not found', 404)
  }

  const course = await Course.create({ title, description, teacherId, subject })
  res.status(201).json({ success: true, data: course })
})

// PUT /api/courses/:id - Update course
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, teacherId, subject } = req.body
  const updateData: any = {}

  if (title) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (teacherId) {
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' })
    if (!teacher) {
      throw new AppError('Teacher not found', 404)
    }
    updateData.teacherId = teacherId
  }
  if (subject) updateData.subject = subject

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!course) {
    throw new AppError('Course not found', 404)
  }

  res.json({ success: true, data: course })
})

// DELETE /api/courses/:id - Delete course
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findByIdAndDelete(req.params.id)

  if (!course) {
    throw new AppError('Course not found', 404)
  }

  res.json({ success: true, message: 'Course deleted successfully' })
})

// GET /api/courses/student/:studentId - Get all courses for a student
export const getCoursesForStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const Enrollment = (await import('../models/Enrollment')).default
  const Student = (await import('../models/Student')).default

  // Support both MongoDB _id and studentId field
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId: studentId }] 
  })
  
  if (!student) {
    return res.json({ success: true, count: 0, data: [] })
  }

  const studentMongoId = String(student._id)

  // Find all enrollments for this student (by MongoDB _id in studentId field)
  const enrollments = await Enrollment.find({ studentId: studentMongoId })
  
  if (enrollments.length === 0) {
    return res.json({ success: true, count: 0, data: [] })
  }

  // Get course IDs (filter out undefined/null values)
  const courseIds = enrollments
    .map(e => e.courseId)
    .filter(id => id && id !== 'undefined' && id !== 'null')
  
  if (courseIds.length === 0) {
    return res.json({ success: true, count: 0, data: [] })
  }
  
  // Fetch courses
  const courses = await Course.find({ _id: { $in: courseIds } })
  
  // Include enrollment info
  const coursesWithEnrollment = courses.map(course => {
    const courseId = String(course._id)
    const enrollment = enrollments.find(e => e.courseId === courseId)
    return {
      ...course.toObject(),
      enrollment: {
        enrolledAt: enrollment?.enrolledAt,
        status: enrollment?.status
      }
    }
  })

  return res.json({ success: true, count: coursesWithEnrollment.length, data: coursesWithEnrollment })
})

// GET /api/courses/:courseId/students - Get all students in a course
export const getStudentsInCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params
  const Enrollment = (await import('../models/Enrollment')).default
  const Student = (await import('../models/Student')).default

  // Find all enrollments for this course
  const enrollments = await Enrollment.find({ courseId })
  
  if (enrollments.length === 0) {
    return res.json({ success: true, count: 0, data: [] })
  }

  // Get student IDs
  const studentIds = enrollments.map(e => e.studentId)
  
  // Fetch students
  const students = await Student.find({ studentId: { $in: studentIds } })
  
  // Include enrollment info
  const studentsWithEnrollment = students.map(student => {
    const enrollment = enrollments.find(e => e.studentId === student.studentId)
    return {
      ...student.toObject(),
      enrollment: {
        enrolledAt: enrollment?.enrolledAt,
        status: enrollment?.status
      }
    }
  })

  return res.json({ success: true, count: studentsWithEnrollment.length, data: studentsWithEnrollment })
})

