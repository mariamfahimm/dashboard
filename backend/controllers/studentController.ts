// Student Controller
import { Request, Response } from 'express'
import Student from '../models/Student'
import User from '../models/User'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/students - Get all students
export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { gradeLevel, demo, userId } = req.query
    const filter: any = {}
    
    if (gradeLevel) filter.gradeLevel = parseInt(gradeLevel as string)
    if (demo === 'true') {
      // Filter for demo students (those with STU-DEMO- prefix)
      filter.studentId = /^STU-DEMO-/
    }
    
    // Filter by userId if provided (for parents to see only their children)
    if (userId) {
      filter.userId = userId
    }

    const students = await Student.find(filter).sort({ name: 1 })
    res.json({ success: true, count: students.length, data: students })
  } catch (error) {
    console.error('Error in getAllStudents:', error)
    throw error
  }
})

// GET /api/students/:id - Get student by ID
export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const student = await Student.findById(req.params.id)
  
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  res.json({ success: true, data: student })
})

// GET /api/students/studentId/:studentId - Get student by studentId
export const getStudentByStudentId = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const student = await Student.findOne({ studentId })
  
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  res.json({ success: true, data: student })
})

// POST /api/students - Create new student
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  let { name, studentId, gradeLevel, userId, performance, engagement } = req.body

  // Auto-generate student ID if not provided (starting from 100)
  // Completely ignores all existing old IDs and starts fresh from 100
  if (!studentId || studentId.trim() === '') {
    const allStudents = await Student.find({})
    // Extract ONLY new-style numeric IDs (100-9999 range) that we've created with this new system
    // Completely ignore all old IDs regardless of format
    const newStyleIds = allStudents
      .map(s => {
        // Only match pure numeric IDs (no letters, no dashes, no prefixes)
        const match = s.studentId?.match(/^(\d+)$/)
        if (match) {
          const numId = parseInt(match[1])
          // Only consider IDs in the new range 100-9999 (completely ignore everything else)
          return (numId >= 100 && numId <= 9999) ? numId : null
        }
        return null
      })
      .filter(id => id !== null) as number[]
    
    // If we have new-style IDs, find the max and increment
    // Otherwise, start fresh from 100
    if (newStyleIds.length > 0) {
      const maxId = Math.max(...newStyleIds)
      const nextId = maxId + 1
      // Ensure we stay in valid range
      if (nextId > 9999) {
        // If we've exceeded the range, start from 100 again (but this shouldn't happen)
        studentId = '100'
      } else {
        studentId = nextId.toString()
      }
    } else {
      // No new-style IDs exist, start fresh from 100
      studentId = '100'
    }
  }

  // Check if studentId already exists
  const existingStudent = await Student.findOne({ studentId })
  if (existingStudent) {
    throw new AppError('Student with this studentId already exists', 400)
  }

  // Verify user exists if userId provided
  if (userId) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }
  }

  const student = await Student.create({
    name,
    studentId,
    gradeLevel,
    userId: userId || undefined, // Include userId if provided
    performance: performance || {
      overallScore: 0,
      trend: 'stable',
      subjectBreakdown: [],
      weeklyProgress: [],
      riskLevel: 'low'
    },
    engagement: engagement || {
      currentEngagement: 0,
      predictedEngagement: 0,
      engagementTrend: 'stable',
      factors: [],
      sessionData: [],
      lastActive: new Date()
    }
  })

  res.status(201).json({ success: true, data: student })
})

// PUT /api/students/:id - Update student
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, gradeLevel, userId, performance, engagement } = req.body
  const updateData: any = {}

  if (name) updateData.name = name
  if (userId !== undefined) updateData.userId = userId
  if (gradeLevel !== undefined) {
    if (gradeLevel < 1 || gradeLevel > 12) {
      throw new AppError('Grade level must be between 1 and 12', 400)
    }
    updateData.gradeLevel = gradeLevel
  }
  if (performance) updateData.performance = performance
  if (engagement) updateData.engagement = engagement

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  res.json({ success: true, data: student })
})

// DELETE /api/students/:id - Delete student
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await Student.findByIdAndDelete(req.params.id)

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  res.json({ success: true, message: 'Student deleted successfully' })
})

// Helper function to generate secure linking code
function generateSecureLinkingCode(): string {
  // Generate a 8-character alphanumeric code (uppercase letters and numbers only)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluded 0, O, I, 1 to avoid confusion
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// POST /api/students/:id/generate-linking-code - Generate linking code for a student
export const generateLinkingCode = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const student = await Student.findById(id)
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // Generate unique code (retry if collision)
  let code: string
  let attempts = 0
  do {
    code = generateSecureLinkingCode()
    const existing = await Student.findOne({ linkingCode: code, _id: { $ne: id } })
    if (!existing) break
    attempts++
    if (attempts > 10) {
      throw new AppError('Failed to generate unique linking code', 500)
    }
  } while (true)

  // Set expiry to 30 days from now
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)

  student.linkingCode = code
  student.linkingCodeExpiry = expiryDate
  await student.save()

  res.json({
    success: true,
    data: {
      code,
      expiryDate: expiryDate.toISOString()
    },
    message: 'Linking code generated successfully'
  })
})

// POST /api/students/link - Link a student to parent account using linking code
export const linkStudentByCode = asyncHandler(async (req: Request, res: Response) => {
  const { linkingCode } = req.body
  const userId = (req as any).user?._id || (req as any).user?.id

  if (!linkingCode) {
    throw new AppError('Linking code is required', 400)
  }

  if (!userId) {
    throw new AppError('User not authenticated', 401)
  }

  // Find student by linking code
  const student = await Student.findOne({ linkingCode })
  if (!student) {
    throw new AppError('Invalid linking code', 404)
  }

  // Check if code is expired
  if (student.linkingCodeExpiry && new Date() > new Date(student.linkingCodeExpiry)) {
    throw new AppError('Linking code has expired. Please request a new code from your school.', 400)
  }

  // Check if student is already linked to this user
  if (student.userId === userId) {
    throw new AppError('This student is already linked to your account', 400)
  }

  // Check if student is already linked to another user
  if (student.userId && student.userId !== userId) {
    throw new AppError('This student is already linked to another account', 400)
  }

  // Link student to user
  student.userId = userId
  student.linkingCode = undefined // Clear the code after successful linking
  student.linkingCodeExpiry = undefined
  await student.save()

  res.json({
    success: true,
    data: student,
    message: 'Student linked successfully'
  })
})

// GET /api/students/linking-code/:code - Verify if a linking code is valid (without linking)
export const verifyLinkingCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params

  const student = await Student.findOne({ linkingCode: code })
  if (!student) {
    throw new AppError('Invalid linking code', 404)
  }

  // Check if code is expired
  if (student.linkingCodeExpiry && new Date() > new Date(student.linkingCodeExpiry)) {
    throw new AppError('Linking code has expired', 400)
  }

  // Return student info (without sensitive data)
  res.json({
    success: true,
    data: {
      name: student.name,
      gradeLevel: student.gradeLevel,
      studentId: student.studentId,
      valid: true
    }
  })
})

