// Grade Controller
import { Request, Response } from 'express'
import Grade from '../models/Grade'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Student from '../models/Student'
import Course from '../models/Course'
import { AppError, asyncHandler } from '../utils/errors'
import { generateAcademicInsights } from '../services/analyticsEngine'
import { getGoalProgress } from '../services/predictiveForecast'
import { emitStudentUpdate } from '../services/eventEmitter'
import Goal from '../models/Goal'

// GET /api/grades - Get all grades
export const getAllGrades = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, courseId, assignmentId, enrollmentId } = req.query
  const filter: any = {}
  if (studentId) filter.studentId = studentId
  if (courseId) filter.courseId = courseId
  if (assignmentId) filter.assignmentId = assignmentId
  if (enrollmentId) filter.enrollmentId = enrollmentId

  const grades = await Grade.find(filter).sort({ submittedAt: -1 })
  res.json({ success: true, count: grades.length, data: grades })
})

// GET /api/grades/:id - Get grade by ID
export const getGradeById = asyncHandler(async (req: Request, res: Response) => {
  const grade = await Grade.findById(req.params.id)
  
  if (!grade) {
    throw new AppError('Grade not found', 404)
  }

  res.json({ success: true, data: grade })
})

// POST /api/grades - Create new grade
export const createGrade = asyncHandler(async (req: Request, res: Response) => {
  const { enrollmentId, assignmentId, studentId, courseId, score, maxScore, submittedAt, gradedAt } = req.body

  // Verify enrollment exists
  const enrollment = await Enrollment.findById(enrollmentId)
  if (!enrollment) {
    throw new AppError('Enrollment not found', 404)
  }

  // Verify student exists - try by _id first, then by studentId field
  let student = await Student.findById(studentId)
  if (!student) {
    student = await Student.findOne({ studentId })
  }
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // If assignmentId is not provided, create a default assignment
  let assignment = null
  let finalAssignmentId = assignmentId
  
  if (!assignmentId && courseId) {
    // Create a default assignment for this grade
    const course = await Course.findById(courseId)
    if (course) {
      assignment = await Assignment.create({
        courseId: courseId,
        title: `Grade Entry - ${new Date().toLocaleDateString()}`,
        subject: course.subject || 'General',
        dueDate: new Date(),
        status: 'completed'
      })
      finalAssignmentId = String(assignment._id)
    }
  } else if (assignmentId) {
    // Verify assignment exists
    assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      throw new AppError('Assignment not found', 404)
    }
    finalAssignmentId = assignmentId
  } else {
    throw new AppError('Either assignmentId or courseId must be provided', 400)
  }

  // Check if grade already exists (only if assignmentId was provided)
  if (assignmentId) {
    const existingGrade = await Grade.findOne({ enrollmentId, assignmentId })
    if (existingGrade) {
      throw new AppError('Grade already exists for this enrollment and assignment', 400)
    }
  }

  // Calculate percentage
  const max = maxScore || 100
  const percentage = Math.round((score / max) * 100)

  // Validate score
  if (score < 0 || score > max) {
    throw new AppError(`Score must be between 0 and ${max}`, 400)
  }

  const grade = await Grade.create({
    enrollmentId,
    assignmentId: finalAssignmentId,
    studentId: String(student._id),
    courseId: courseId || (assignment ? assignment.courseId : enrollment.courseId),
    score,
    maxScore: max,
    percentage,
    submittedAt: submittedAt || new Date(),
    gradedAt: gradedAt || new Date()
  })

  // Trigger analytics and predictions in background (non-blocking)
  setImmediate(async () => {
    try {
      const student = await Student.findOne({ studentId })
      if (!student) return

      const studentMongoId = String(student._id)

      // Generate updated insights
      const insights = await generateAcademicInsights(studentMongoId)

      // Get updated forecasts for goals
      const goals = await Goal.find({ 
        studentId: studentMongoId,
        status: { $in: ['active', 'paused'] }
      })
      
      let forecasts: any[] = []
      if (goals.length > 0) {
        const forecastGoals = goals.map(g => ({
          id: String(g._id),
          name: g.name,
          target: g.target,
          unit: g.unit,
          type: g.type as 'grade' | 'time' | 'completion',
          subject: g.subject
        }))
        forecasts = await getGoalProgress(studentMongoId, forecastGoals)
      }

      // Emit real-time update event
      emitStudentUpdate({
        studentId: studentMongoId,
        parentId: student.userId,
        type: 'grade',
        data: {
          insights,
          forecasts,
          message: `New grade added: ${score}/${max} (${percentage}%)`
        },
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Error processing grade analytics:', error)
      // Don't fail the request if analytics fail
    }
  })

  res.status(201).json({ 
    success: true, 
    data: grade,
    message: 'Grade created. Analytics and predictions are being recalculated.'
  })
})

// PUT /api/grades/:id - Update grade
export const updateGrade = asyncHandler(async (req: Request, res: Response) => {
  const { score, maxScore, gradedAt } = req.body
  const updateData: any = {}

  const grade = await Grade.findById(req.params.id)
  if (!grade) {
    throw new AppError('Grade not found', 404)
  }

  if (score !== undefined) {
    const max = maxScore || grade.maxScore
    if (score < 0 || score > max) {
      throw new AppError(`Score must be between 0 and ${max}`, 400)
    }
    updateData.score = score
    updateData.percentage = Math.round((score / max) * 100)
  }

  if (maxScore !== undefined) {
    updateData.maxScore = maxScore
    if (updateData.score === undefined) {
      updateData.percentage = Math.round((grade.score / maxScore) * 100)
    }
  }

  if (gradedAt) {
    updateData.gradedAt = gradedAt
  }

  const updatedGrade = await Grade.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!updatedGrade) {
    throw new AppError('Grade not found', 404)
  }

  // Trigger analytics recalculation in background
  setImmediate(async () => {
    try {
      if (!updatedGrade) return
      
      const student = await Student.findOne({ studentId: updatedGrade.studentId })
      if (!student) return

      const studentMongoId = String(student._id)
      const insights = await generateAcademicInsights(studentMongoId)

      emitStudentUpdate({
        studentId: studentMongoId,
        parentId: student.userId,
        type: 'grade',
        data: {
          insights,
          message: `Grade updated: ${updatedGrade.score}/${updatedGrade.maxScore} (${updatedGrade.percentage}%)`
        },
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Error processing grade update analytics:', error)
    }
  })

  res.json({ 
    success: true, 
    data: updatedGrade,
    message: 'Grade updated. Analytics are being recalculated.'
  })
})

// DELETE /api/grades/:id - Delete grade
export const deleteGrade = asyncHandler(async (req: Request, res: Response) => {
  const grade = await Grade.findByIdAndDelete(req.params.id)

  if (!grade) {
    throw new AppError('Grade not found', 404)
  }

  res.json({ success: true, message: 'Grade deleted successfully' })
})

// GET /api/grades/student/:studentId - Get all grades for a student
export const getGradesForStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params

  // Verify student exists - support both _id and studentId field
  const student = await Student.findOne({ 
    $or: [{ _id: studentId }, { studentId: studentId }] 
  })
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // Use the MongoDB _id to find grades (Grade model stores studentId as _id)
  const studentMongoId = String(student._id)
  const grades = await Grade.find({ studentId: studentMongoId }).sort({ submittedAt: -1 })
  
  // Calculate statistics
  const totalGrades = grades.length
  const averageScore = totalGrades > 0
    ? grades.reduce((sum, g) => sum + g.percentage, 0) / totalGrades
    : 0

  res.json({
    success: true,
    count: totalGrades,
    average: Math.round(averageScore * 100) / 100,
    data: grades
  })
})

