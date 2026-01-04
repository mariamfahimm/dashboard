// Demo Controller - For seeding demo data (DEMO MODE ONLY)
import { Request, Response } from 'express'
import { AppError, asyncHandler } from '../utils/errors'
import User from '../models/User'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import Alert from '../models/Alert'
import Message from '../models/Message'
import bcrypt from 'bcryptjs'

// POST /api/demo/seed - Seed comprehensive demo data
export const seedDemoData = asyncHandler(async (req: Request, res: Response) => {
  // Only allow in demo mode
  if (process.env.DEMO_MODE !== 'true' && process.env.NODE_ENV === 'production') {
    throw new AppError('Demo seeding is disabled in production', 403)
  }

  const currentUser = (req as any).user

  // Only admins can seed demo data
  if (!currentUser || currentUser.role !== 'admin') {
    throw new AppError('Only admins can seed demo data', 403)
  }

  try {
    const hashedPassword = await bcrypt.hash('demo123', 10)

    // Create demo parent user
    let demoParent = await User.findOne({ email: 'demo-parent@educonnect.com' })
    if (!demoParent) {
      demoParent = await User.create({
        name: 'Demo Parent',
        email: 'demo-parent@educonnect.com',
        password: hashedPassword,
        role: 'parent'
      })
    }

    // Create demo teacher
    let demoTeacher = await User.findOne({ email: 'demo-teacher@educonnect.com' })
    if (!demoTeacher) {
      demoTeacher = await User.create({
        name: 'Demo Teacher',
        email: 'demo-teacher@educonnect.com',
        password: hashedPassword,
        role: 'teacher'
      })
    }

    // Create demo student
    let demoStudent = await Student.findOne({ userId: String(demoParent._id), name: 'Demo Student' })
    if (!demoStudent) {
      demoStudent = await Student.create({
        name: 'Demo Student',
        studentId: `DEMO-${Date.now()}`,
        gradeLevel: 10,
        userId: String(demoParent._id),
        performance: {
          overallScore: 85,
          trend: 'improving',
          subjectBreakdown: [],
          weeklyProgress: [],
          riskLevel: 'low',
          lastUpdated: new Date()
        },
        engagement: {
          currentEngagement: 80,
          predictedEngagement: 82,
          engagementTrend: 'increasing',
          factors: [],
          sessionData: [],
          lastActive: new Date()
        }
      })
    }

    // Create demo courses
    const subjects = ['Math', 'Science', 'English', 'History', 'CS']
    const courses = []
    for (const subject of subjects) {
      let course = await Course.findOne({ subject })
      if (!course) {
        course = await Course.create({
          title: `${subject} 101`,
          name: subject,
          code: `${subject}101`,
          subject: subject,
          description: `${subject} course for demo`,
          teacherId: String(demoTeacher._id),
          gradeLevel: 10
        })
      }
      courses.push(course)
    }

    // Create enrollments
    for (const course of courses) {
      const existing = await Enrollment.findOne({
        studentId: String(demoStudent._id),
        courseId: String(course._id)
      })
      if (!existing) {
        await Enrollment.create({
          userId: String(demoParent._id),
          studentId: String(demoStudent._id),
          courseId: String(course._id),
          enrolledAt: new Date(),
          status: 'active'
        })
      }
    }

    // Create demo assignments
    for (const course of courses.slice(0, 3)) {
      const assignment = await Assignment.create({
        title: `Demo Assignment - ${course.subject}`,
        description: `This is a demo assignment for ${course.subject}`,
        type: 'homework',
        courseId: String(course._id),
        subject: course.subject,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        maxScore: 100,
        status: 'active'
      })

      // Create a grade for one assignment
      const enrollment = await Enrollment.findOne({
        studentId: String(demoStudent._id),
        courseId: String(course._id)
      })
      if (enrollment) {
        await Grade.create({
          enrollmentId: String(enrollment._id),
          studentId: String(demoStudent._id),
          assignmentId: String(assignment._id),
          courseId: String(course._id),
          score: 85,
          maxScore: 100,
          percentage: 85,
          submittedAt: new Date(),
          gradedAt: new Date()
        })
      }
    }

    // Create demo alert
    await Alert.create({
      studentId: String(demoStudent._id),
      type: 'performance',
      priority: 'medium',
      title: 'Demo Alert',
      message: 'This is a demo alert for testing purposes',
      actionRequired: false,
      metadata: {}
    })

    // Create demo message
    await Message.create({
      from: {
        userId: String(demoTeacher._id),
        name: demoTeacher.name,
        role: 'teacher'
      },
      to: {
        userId: String(demoParent._id),
        name: demoParent.name,
        role: 'parent'
      },
      subject: 'Demo Message',
      content: 'This is a demo message for testing purposes',
      studentId: String(demoStudent._id),
      read: false,
      priority: 'normal',
      category: 'general'
    })

    res.json({
      success: true,
      message: 'Demo data seeded successfully',
      data: {
        parentEmail: 'demo-parent@educonnect.com',
        parentPassword: 'demo123',
        studentName: demoStudent.name,
        coursesCreated: courses.length
      }
    })
  } catch (error: any) {
    console.error('Demo seed error:', error)
    throw new AppError(`Failed to seed demo data: ${error.message}`, 500)
  }
})

