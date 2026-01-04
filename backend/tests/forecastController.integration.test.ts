// Integration tests for forecastController.ts
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

dotenv.config()

// Support both DATABASE_URL and MONGO_URI
const baseUri = process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect'
const TEST_DB_URI = baseUri.replace(/\/[^/]+$/, '/educonnect-test')

describe('Forecast Controller Integration Tests', () => {
  let app: Express
  let testStudentId: string
  let testCourseId: string
  let testEnrollmentId: string
  let testUserId: string

  beforeAll(async () => {
    // Connect to test database with timeout options
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(TEST_DB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        })
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error)
        throw new Error('MongoDB connection failed. Please ensure MongoDB is running.')
      }
    }

    // Setup Express app
    app = express()
    app.use(cors())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use('/api', apiRoutes)

    // Clean up test data
    await Student.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Grade.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Assignment.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await Enrollment.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Course.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await User.deleteMany({ email: /^test-/ }).catch(() => {})
  }, 60000) // 60 second timeout

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@test.com`,
      password: 'test123',
      role: 'student',
    })
    testUserId = String(user._id)

    // Create test student
    const student = await Student.create({
      name: 'Test Student',
      studentId: `TEST-${Date.now()}`,
      gradeLevel: 10,
      userId: testUserId,
    })
    testStudentId = String(student._id)

    // Create test course
    const course = await Course.create({
      title: 'TEST Math Course',
      description: 'Test course',
      teacherId: 'test-teacher-id',
      subject: 'Math',
    })
    testCourseId = String(course._id)

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: testUserId,
      studentId: testStudentId,
      courseId: testCourseId,
      enrolledAt: new Date(),
      status: 'active',
    })
    testEnrollmentId = String(enrollment._id)
  })

  afterEach(async () => {
    // Clean up test data
    await Student.deleteMany({ studentId: /^TEST-/ })
    await Grade.deleteMany({ studentId: /^TEST-/ })
    await Assignment.deleteMany({ title: /^TEST-/ })
    await Enrollment.deleteMany({ studentId: /^TEST-/ })
    await Course.deleteMany({ title: /^TEST-/ })
    await User.deleteMany({ email: /^test-/ })
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('GET /api/forecast/:studentId', () => {
    it('should return 400 if studentId is missing', async () => {
      const response = await request(app)
        .get('/api/forecast/')
        .expect(404) // Route not found

      // Try with empty studentId
      const response2 = await request(app)
        .get('/api/forecast/ ')
        .expect(400)
    })

    it('should return forecasts for student with default goals', async () => {
      // Create some grades for the student
      const now = new Date()
      const scores = [70, 75, 80, 85]

      for (let i = 0; i < scores.length; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - ((scores.length - i) * 7))

        const assignment = await Assignment.create({
          courseId: testCourseId,
          title: `TEST Assignment ${i}`,
          subject: 'Math',
          dueDate: date,
          status: 'completed',
        })

        await Grade.create({
          enrollmentId: testEnrollmentId,
          assignmentId: String(assignment._id),
          studentId: testStudentId,
          courseId: testCourseId,
          score: scores[i],
          maxScore: 100,
          percentage: scores[i],
          submittedAt: date,
          gradedAt: date,
        })
      }

      const response = await request(app)
        .get(`/api/forecast/${testStudentId}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)

      // Check structure of forecast items
      const forecast = response.body.data[0]
      expect(forecast).toHaveProperty('goalId')
      expect(forecast).toHaveProperty('goalName')
      expect(forecast).toHaveProperty('current')
      expect(forecast).toHaveProperty('target')
      expect(forecast).toHaveProperty('unit')
      expect(forecast).toHaveProperty('onTrack')
      expect(typeof forecast.onTrack).toBe('boolean')
      expect(forecast).toHaveProperty('confidence')
      expect(forecast.confidence).toBeGreaterThanOrEqual(0)
      expect(forecast.confidence).toBeLessThanOrEqual(1)
      expect(forecast).toHaveProperty('forecast')
    })

    it('should return empty forecasts for student with no data', async () => {
      const response = await request(app)
        .get(`/api/forecast/${testStudentId}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      // May return forecasts with low confidence or error messages
    })
  })

  describe('POST /api/forecast/grade', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/forecast/grade')
        .send({ studentId: testStudentId })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should forecast grade target correctly', async () => {
      // Create improving grades
      const now = new Date()
      const scores = [70, 75, 80, 85, 90]

      for (let i = 0; i < scores.length; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - ((scores.length - i) * 7))

        const assignment = await Assignment.create({
          courseId: testCourseId,
          title: `TEST Assignment ${i}`,
          subject: 'Math',
          dueDate: date,
          status: 'completed',
        })

        await Grade.create({
          enrollmentId: testEnrollmentId,
          assignmentId: String(assignment._id),
          studentId: testStudentId,
          courseId: testCourseId,
          score: scores[i],
          maxScore: 100,
          percentage: scores[i],
          submittedAt: date,
          gradedAt: date,
        })
      }

      const response = await request(app)
        .post('/api/forecast/grade')
        .send({
          studentId: testStudentId,
          subject: 'Math',
          targetGrade: 95,
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      
      const forecast = response.body.data
      expect(forecast).toHaveProperty('target')
      expect(forecast).toHaveProperty('currentValue')
      expect(forecast).toHaveProperty('targetValue', 95)
      expect(forecast).toHaveProperty('predictedValue')
      expect(forecast).toHaveProperty('confidence')
      expect(forecast).toHaveProperty('onTrack')
      expect(typeof forecast.onTrack).toBe('boolean')
      expect(forecast).toHaveProperty('message')
      expect(forecast.message).toBeTruthy()
    })
  })

  describe('POST /api/forecast/study-time', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/forecast/study-time')
        .send({ studentId: testStudentId })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should forecast study time target', async () => {
      // Create some assignments
      const now = new Date()
      for (let i = 0; i < 5; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() + i)

        await Assignment.create({
          courseId: testCourseId,
          title: `TEST Assignment ${i}`,
          subject: 'Math',
          dueDate: date,
          status: 'active',
        })
      }

      const response = await request(app)
        .post('/api/forecast/study-time')
        .send({
          studentId: testStudentId,
          targetHours: 6,
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      
      const forecast = response.body.data
      expect(forecast).toHaveProperty('target', 'Weekly Study Time')
      expect(forecast).toHaveProperty('currentValue')
      expect(forecast).toHaveProperty('targetValue', 6)
      expect(forecast).toHaveProperty('onTrack')
      expect(forecast).toHaveProperty('confidence')
      expect(forecast).toHaveProperty('message')
    })
  })

  describe('POST /api/forecast/completion-rate', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/forecast/completion-rate')
        .send({ studentId: testStudentId })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should forecast completion rate target', async () => {
      // Create mix of completed and active assignments
      const now = new Date()
      const statuses: Array<'completed' | 'active'> = ['completed', 'completed', 'active', 'completed']

      for (let i = 0; i < statuses.length; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() + i)

        await Assignment.create({
          courseId: testCourseId,
          title: `TEST Assignment ${i}`,
          subject: 'Math',
          dueDate: date,
          status: statuses[i],
        })
      }

      const response = await request(app)
        .post('/api/forecast/completion-rate')
        .send({
          studentId: testStudentId,
          targetRate: 90,
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      
      const forecast = response.body.data
      expect(forecast).toHaveProperty('target', 'Assignment Completion Rate')
      expect(forecast).toHaveProperty('currentValue')
      expect(forecast.currentValue).toBeGreaterThanOrEqual(0)
      expect(forecast.currentValue).toBeLessThanOrEqual(100)
      expect(forecast).toHaveProperty('targetValue', 90)
      expect(forecast).toHaveProperty('onTrack')
      expect(forecast).toHaveProperty('confidence')
      expect(forecast).toHaveProperty('message')
    })
  })

  describe('POST /api/forecast/goals', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/forecast/goals')
        .send({ studentId: testStudentId })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return goal progress for multiple goals', async () => {
      // Create data for all goal types
      const now = new Date()
      const scores = [70, 75, 80]

      for (let i = 0; i < scores.length; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - ((scores.length - i) * 7))

        const assignment = await Assignment.create({
          courseId: testCourseId,
          title: `TEST Assignment ${i}`,
          subject: 'Math',
          dueDate: date,
          status: i < 2 ? 'completed' : 'active',
        })

        await Grade.create({
          enrollmentId: testEnrollmentId,
          assignmentId: String(assignment._id),
          studentId: testStudentId,
          courseId: testCourseId,
          score: scores[i],
          maxScore: 100,
          percentage: scores[i],
          submittedAt: date,
          gradedAt: date,
        })
      }

      const goals = [
        {
          id: 'grade-math',
          name: 'Math Grade',
          target: 85,
          unit: '%',
          type: 'grade',
          subject: 'Math',
        },
        {
          id: 'study-time',
          name: 'Weekly Study Time',
          target: 6,
          unit: 'hrs',
          type: 'time',
        },
        {
          id: 'completion',
          name: 'Completion Rate',
          target: 90,
          unit: '%',
          type: 'completion',
        },
      ]

      const response = await request(app)
        .post('/api/forecast/goals')
        .send({
          studentId: testStudentId,
          goals,
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(3)

      // Verify each goal has required fields
      response.body.data.forEach((goal: any) => {
        expect(goal).toHaveProperty('goalId')
        expect(goal).toHaveProperty('goalName')
        expect(goal).toHaveProperty('current')
        expect(goal).toHaveProperty('target')
        expect(goal).toHaveProperty('unit')
        expect(goal).toHaveProperty('onTrack')
        expect(typeof goal.onTrack).toBe('boolean')
        expect(goal).toHaveProperty('confidence')
        expect(goal.confidence).toBeGreaterThanOrEqual(0)
        expect(goal.confidence).toBeLessThanOrEqual(1)
        expect(goal).toHaveProperty('forecast')
        expect(goal.forecast).toHaveProperty('message')
      })
    })

    it('should handle Mariam scenario (goal: reach grade 15 in math)', async () => {
      // Mariam's scenario: grades 8, 9, 11, 10, 11, 11 out of 15
      const mariamGrades = [8, 9, 11, 10, 11, 11]
      const maxScore = 15
      const now = new Date()

      for (let i = 0; i < mariamGrades.length; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - ((mariamGrades.length - i) * 7))

        const assignment = await Assignment.create({
          courseId: testCourseId,
          title: `Math Quiz ${i + 1}`,
          subject: 'Math',
          dueDate: date,
          status: 'completed',
        })

        await Grade.create({
          enrollmentId: testEnrollmentId,
          assignmentId: String(assignment._id),
          studentId: testStudentId,
          courseId: testCourseId,
          score: mariamGrades[i],
          maxScore: maxScore,
          percentage: (mariamGrades[i] / maxScore) * 100,
          submittedAt: date,
          gradedAt: date,
        })
      }

      // Forecast goal: reach grade 15 (100%) within 12 weeks
      const goals = [
        {
          id: 'grade-math-15',
          name: 'Math Grade Target',
          target: 100, // 15/15 = 100%
          unit: '%',
          type: 'grade',
          subject: 'Math',
        },
      ]

      const response = await request(app)
        .post('/api/forecast/goals')
        .send({
          studentId: testStudentId,
          goals,
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data.length).toBe(1)

      const forecast = response.body.data[0]
      expect(forecast.goalId).toBe('grade-math-15')
      expect(forecast.current).toBeGreaterThan(0) // Should be around 73% (average of grades)
      expect(forecast.target).toBe(100)
      expect(forecast).toHaveProperty('predictedCompletion') // May be null if not on track
      expect(forecast).toHaveProperty('onTrack')
      expect(forecast).toHaveProperty('confidence')
      expect(forecast.confidence).toBeGreaterThan(0)
      
      // With improving trend, should have reasonable confidence
      if (forecast.onTrack) {
        expect(forecast.predictedCompletion).toBeInstanceOf(String) // JSON date string
      }

      // Verify forecast message
      expect(forecast.forecast).toHaveProperty('message')
      expect(forecast.forecast.message).toBeTruthy()
    })
  })
})

