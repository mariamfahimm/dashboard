// Admin Controller - For managing parent accounts and bulk operations
import { Request, Response } from 'express'
import User from '../models/User'
import Student from '../models/Student'
import { AppError, asyncHandler } from '../utils/errors'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '../services/emailService'

// Generate a secure random password
const generatePassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// POST /api/admin/parents/create - Create a single parent account with pre-linked students
export const createParentAccount = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, studentIds, sendEmail = true, language = 'en' } = req.body

  // Validate input
  if (!name || !email) {
    throw new AppError('Name and email are required', 400)
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new AppError('User with this email already exists', 400)
  }

  // Generate temporary password
  const tempPassword = generatePassword(12)

  // Hash password
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  // Create parent user
  const parent = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'parent',
    mustChangePassword: true, // Require password change on first login
    language: language === 'ar' ? 'ar' : 'en', // Store language preference
  })

  // Link students if provided
  const linkedStudents: string[] = []
  if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
    for (const studentId of studentIds) {
      const student = await Student.findById(studentId)
      if (student) {
        student.userId = String(parent._id)
        await student.save()
        linkedStudents.push(student.name)
      }
    }
  }

  // Send welcome email if requested
  let emailSent = false
  if (sendEmail) {
    try {
      await sendWelcomeEmail(email, name, tempPassword, linkedStudents, language === 'ar' ? 'ar' : 'en')
      emailSent = true
    } catch (error: any) {
      console.error('Failed to send welcome email:', error.message || error)
      // Don't fail the request if email fails - account is still created
      emailSent = false
    }
  }

  // Return response (don't include password in response)
  res.status(201).json({
    success: true,
    data: {
      user: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        role: parent.role,
      },
      temporaryPassword: tempPassword, // Include in response for admin to share manually if needed
      linkedStudents: linkedStudents,
      emailSent: emailSent,
    },
    message: 'Parent account created successfully',
  })
})

// POST /api/admin/parents/bulk-create - Create multiple parent accounts (bulk import)
export const bulkCreateParentAccounts = asyncHandler(async (req: Request, res: Response) => {
  const { parents, sendEmails = true } = req.body

  // Validate input
  if (!Array.isArray(parents) || parents.length === 0) {
    throw new AppError('Parents array is required and must not be empty', 400)
  }

  const results = {
    successful: [] as any[],
    failed: [] as any[],
  }

  // Process each parent
  for (const parentData of parents) {
    try {
      const { name, email, studentIds } = parentData

      if (!name || !email) {
        results.failed.push({
          email: email || 'unknown',
          error: 'Name and email are required',
        })
        continue
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        results.failed.push({
          email,
          error: 'User already exists',
        })
        continue
      }

      // Generate temporary password
      const tempPassword = generatePassword(12)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      // Create parent user
      const parent = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'parent',
        mustChangePassword: true,
      })

      // Link students if provided
      const linkedStudents: string[] = []
      if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
        for (const studentId of studentIds) {
          const student = await Student.findById(studentId)
          if (student) {
            student.userId = String(parent._id)
            await student.save()
            linkedStudents.push(student.name)
          }
        }
      }

      // Send welcome email if requested
      let emailSent = false
      if (sendEmails) {
        try {
          await sendWelcomeEmail(email, name, tempPassword, linkedStudents)
          emailSent = true
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error)
        }
      }

      results.successful.push({
        email,
        name,
        temporaryPassword: tempPassword,
        linkedStudents,
        emailSent,
      })
    } catch (error: any) {
      results.failed.push({
        email: parentData.email || 'unknown',
        error: error.message || 'Unknown error',
      })
    }
  }

  res.status(201).json({
    success: true,
    data: {
      total: parents.length,
      successful: results.successful.length,
      failed: results.failed.length,
      results: {
        successful: results.successful,
        failed: results.failed,
      },
    },
    message: `Created ${results.successful.length} parent account(s) successfully`,
  })
})

// GET /api/admin/parents - Get all parent accounts with their linked students
export const getAllParents = asyncHandler(async (req: Request, res: Response) => {
  const parents = await User.find({ role: 'parent' })
    .select('-password')
    .sort({ createdAt: -1 })

  // Get students for each parent
  const parentsWithStudents = await Promise.all(
    parents.map(async (parent) => {
      const students = await Student.find({ userId: String(parent._id) })
      return {
        ...parent.toObject(),
        students: students.map((s) => ({
          id: s._id,
          name: s.name,
          studentId: s.studentId,
          gradeLevel: s.gradeLevel,
        })),
        studentCount: students.length,
      }
    })
  )

  res.json({
    success: true,
    count: parentsWithStudents.length,
    data: parentsWithStudents,
  })
})

// POST /api/admin/parents/:parentId/link-student - Link a student to an existing parent
export const linkStudentToParent = asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.params
  const { studentId } = req.body

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  // Find parent
  const parent = await User.findById(parentId)
  if (!parent || parent.role !== 'parent') {
    throw new AppError('Parent not found', 404)
  }

  // Find student
  const student = await Student.findById(studentId)
  if (!student) {
    throw new AppError('Student not found', 404)
  }

  // Check if student is already linked to another parent
  if (student.userId && student.userId !== String(parentId)) {
    throw new AppError('Student is already linked to another parent', 400)
  }

  // Link student to parent
  student.userId = String(parentId)
  await student.save()

  res.json({
    success: true,
    data: {
      parent: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
      },
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
      },
    },
    message: 'Student linked to parent successfully',
  })
})

// POST /api/admin/parents/:parentId/resend-credentials - Resend welcome email with credentials
export const resendCredentials = asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.params
  const { generateNewPassword = false } = req.body

  // Find parent
  const parent = await User.findById(parentId)
  if (!parent || parent.role !== 'parent') {
    throw new AppError('Parent not found', 404)
  }

  // Generate new password if requested
  let tempPassword: string
  if (generateNewPassword) {
    tempPassword = generatePassword(12)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    parent.password = hashedPassword
    parent.mustChangePassword = true
    await parent.save()
  } else {
    // For security, we can't retrieve the original password
    // So we must generate a new one
    tempPassword = generatePassword(12)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    parent.password = hashedPassword
    parent.mustChangePassword = true
    await parent.save()
  }

  // Get linked students
  const students = await Student.find({ userId: String(parent._id) })
  const studentNames = students.map((s) => s.name)

  // Send welcome email (use parent's language preference)
  try {
    const parentLanguage = (parent as any).language || 'en'
    await sendWelcomeEmail(parent.email, parent.name, tempPassword, studentNames, parentLanguage)
  } catch (error) {
    console.error('Failed to send email:', error)
    throw new AppError('Failed to send email', 500)
  }

  res.json({
    success: true,
    data: {
      email: parent.email,
      temporaryPassword: tempPassword,
      emailSent: true,
    },
    message: 'Credentials sent successfully',
  })
})

// DELETE /api/admin/parents/:parentId - Delete a parent account
export const deleteParentAccount = asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.params

  // Find parent
  const parent = await User.findById(parentId)
  if (!parent || parent.role !== 'parent') {
    throw new AppError('Parent not found', 404)
  }

  // Unlink all students from this parent
  await Student.updateMany(
    { userId: String(parent._id) },
    { $unset: { userId: '' } }
  )

  // Delete the parent account
  await User.findByIdAndDelete(parentId)

  res.json({
    success: true,
    message: 'Parent account deleted successfully',
    data: {
      deletedParent: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
      },
    },
  })
})

// POST /api/admin/students/migrate-ids - Migrate all existing students to new ID format (100, 101, 102, etc.)
export const migrateStudentIds = asyncHandler(async (req: Request, res: Response) => {
  // Get all students, sorted by creation date to maintain order
  const allStudents = await Student.find({}).sort({ createdAt: 1 })
  
  let nextId = 100
  const updates: Array<{ _id: string, oldId: string, newId: string, name: string }> = []
  
  for (const student of allStudents) {
    const oldId = student.studentId
    const newId = nextId.toString()
    const studentId = String(student._id)
    
    // Check if this ID is already in use by another student
    const existing = await Student.findOne({ studentId: newId, _id: { $ne: studentId } })
    if (existing) {
      // Skip this student if ID is already taken, but continue with next ID
      nextId++
      if (nextId > 9999) break
      continue
    }
    
    // Update the student's ID
    student.studentId = newId
    await student.save()
    
    updates.push({
      _id: studentId,
      oldId: oldId,
      newId: newId,
      name: student.name
    })
    
    nextId++
    
    // Safety check: don't exceed 9999
    if (nextId > 9999) {
      break
    }
  }
  
  res.status(200).json({
    success: true,
    message: `Migrated ${updates.length} students to new ID format`,
    updated: updates.length,
    total: allStudents.length,
    updates: updates
  })
})

