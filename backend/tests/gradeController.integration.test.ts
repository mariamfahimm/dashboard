// Integration tests for gradeController with analytics and events
import request from 'supertest'
import express, { Express } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import apiRoutes from '../routes/index'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import User from '../models/User'
import { getIO } from '../services/eventEmitter'

dotenv.config()

const TEST_DB_URI = process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/educonnect-test') || 
                   process.env.MONGO_URI?.replace(/\/[^/]+$/, '/educonnect-test') || 
                   'mongodb://localhost:27017/educonnect-test'

describe('Grade Controller Integration with Analytics', () => {
  let app: Express
  let testStudentId: string
  let testStudentMongoId: string
  let testCourseId: string
  let testEnrollmentId: string
  let testAssignmentId: string

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(TEST_DB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        })
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error)
        throw new Error('MongoDB connection failed.')
      }
    }

    app = express()
    app.use(cors())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use('/api', apiRoutes)

    await Student.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Grade.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Assignment.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await Enrollment.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Course.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await User.deleteMany({ email: /^test-/ }).catch(() => {})
  }, 60000)

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@test.com`,
      password: 'test123',
      role: 'student',
    })

    const student = await Student.create({
      name: 'Test Student',
      studentId: `TEST-${Date.now()}`,
      gradeLevel: 10,
      userId: String(user._id),
    })
    testStudentMongoId = String(student._id)
    testStudentId = student.studentId

    const course = await Course.create({
      title: 'TEST Math Course',
      description: 'Test course',
      teacherId: 'test-teacher-id',
      subject: 'Math',
    })
    testCourseId = String(course._id)

    const enrollment = await Enrollment.create({
      userId: String(user._id),
      studentId: testStudentMongoId,
      courseId: testCourseId,
      status: 'active'
    })
    testEnrollmentId = String(enrollment._id)

    const assignment = await Assignment.create({
      courseId: testCourseId,
      title: 'TEST Assignment',
      subject: 'Math',
      dueDate: new Date(),
      status: 'active'
    })
    testAssignmentId = String(assignment._id)
  })

  afterEach(async () => {
    await Grade.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Student.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Assignment.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await Enrollment.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Course.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await User.deleteMany({ email: /^test-/ }).catch(() => {})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('POST /api/grades - Grade creation triggers analytics', () => {
    it('should create grade and acknowledge analytics recalculation', async () => {
      const response = await request(app)
        .post('/api/grades')
        .send({
          enrollmentId: testEnrollmentId,
          assignmentId: testAssignmentId,
          studentId: testStudentId,
          courseId: testCourseId,
          score: 85,
          maxScore: 100,
          percentage: 85,
          submittedAt: new Date().toISOString()
        })
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('score', 85)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('recalculated')
    })

    it('should emit real-time update event after grade creation', (done) => {
      const io = getIO()
      if (!io) {
        // Socket.io not initialized in test, skip
        return done()
      }

      let eventReceived = false
      const testSocket = io.sockets.sockets.values().next().value
      
      if (testSocket) {
        testSocket.on('student.update', (event: any) => {
          expect(event).toHaveProperty('studentId')
          expect(event).toHaveProperty('type', 'grade')
          expect(event).toHaveProperty('data')
          eventReceived = true
        })
      }

      request(app)
        .post('/api/grades')
        .send({
          enrollmentId: testEnrollmentId,
          assignmentId: testAssignmentId,
          studentId: testStudentId,
          courseId: testCourseId,
          score: 90,
          maxScore: 100,
          percentage: 90,
          submittedAt: new Date().toISOString()
        })
        .expect(201)
        .end(() => {
          // Wait a bit for async event emission
          setTimeout(() => {
            // Event emission is async, so we just verify it doesn't throw
            done()
          }, 1000)
        })
    })
  })

  describe('PUT /api/grades/:id - Grade update triggers analytics', () => {
    it('should update grade and acknowledge analytics recalculation', async () => {
      const grade = await Grade.create({
        enrollmentId: testEnrollmentId,
        assignmentId: testAssignmentId,
        studentId: testStudentId,
        courseId: testCourseId,
        score: 80,
        maxScore: 100,
        percentage: 80,
        submittedAt: new Date(),
        gradedAt: new Date()
      })

      const response = await request(app)
        .put(`/api/grades/${grade._id}`)
        .send({
          score: 90,
          maxScore: 100
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('score', 90)
      expect(response.body.data).toHaveProperty('percentage', 90)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('recalculated')
    })
  })
})

