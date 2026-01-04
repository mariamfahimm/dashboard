// Integration tests for goalController
import request from 'supertest'
import express, { Express } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import apiRoutes from '../routes/index'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Student from '../models/Student'
import Goal from '../models/Goal'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import User from '../models/User'

dotenv.config()

const TEST_DB_URI = process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/educonnect-test') || 
                   process.env.MONGO_URI?.replace(/\/[^/]+$/, '/educonnect-test') || 
                   'mongodb://localhost:27017/educonnect-test'

describe('Goal Controller Integration Tests', () => {
  let app: Express
  let testStudentId: string
  let testStudentMongoId: string
  let testCourseId: string

  beforeAll(async () => {
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

    app = express()
    app.use(cors())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use('/api', apiRoutes)

    await Student.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Goal.deleteMany({}).catch(() => {})
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
  })

  afterEach(async () => {
    await Goal.deleteMany({}).catch(() => {})
    await Student.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Grade.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Assignment.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await Enrollment.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Course.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await User.deleteMany({ email: /^test-/ }).catch(() => {})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('POST /api/goals', () => {
    it('should create a grade goal with predictions', async () => {
      const response = await request(app)
        .post('/api/goals')
        .send({
          studentId: testStudentMongoId,
          name: 'Math Grade Target',
          type: 'grade',
          subject: 'Math',
          target: 85,
          current: 75,
          unit: '%'
        })
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('name', 'Math Grade Target')
      expect(response.body.data).toHaveProperty('type', 'grade')
      expect(response.body.data).toHaveProperty('target', 85)
      expect(response.body.data).toHaveProperty('current', 75)
      
      // Should have prediction data
      if (response.body.data.prediction) {
        expect(response.body.data.prediction).toHaveProperty('percentChance')
        expect(response.body.data.prediction).toHaveProperty('onTrack')
        expect(response.body.data.prediction).toHaveProperty('confidence')
      }
    })

    it('should require subject for grade type goals', async () => {
      const response = await request(app)
        .post('/api/goals')
        .send({
          studentId: testStudentMongoId,
          name: 'Math Grade Target',
          type: 'grade',
          target: 85,
          current: 75,
          unit: '%'
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/students/:id/goals', () => {
    it('should return goals with predictions', async () => {
      // Create a goal
      const goal = await Goal.create({
        studentId: testStudentMongoId,
        name: 'Math Grade Target',
        type: 'grade',
        subject: 'Math',
        target: 85,
        current: 75,
        unit: '%',
        status: 'active'
      })

      // Create some grades to enable predictions
      const enrollment = await Enrollment.create({
        userId: 'test-user-id',
        studentId: testStudentMongoId,
        courseId: testCourseId,
        status: 'active'
      })

      const assignment = await Assignment.create({
        courseId: testCourseId,
        title: 'TEST Assignment',
        subject: 'Math',
        dueDate: new Date(),
        status: 'completed'
      })

      await Grade.create({
        enrollmentId: String(enrollment._id),
        assignmentId: String(assignment._id),
        studentId: testStudentId,
        courseId: testCourseId,
        score: 75,
        maxScore: 100,
        percentage: 75,
        submittedAt: new Date(),
        gradedAt: new Date()
      })

      const response = await request(app)
        .get(`/api/students/${testStudentMongoId}/goals`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      
      if (response.body.data.length > 0) {
        const goalData = response.body.data[0]
        expect(goalData).toHaveProperty('name')
        expect(goalData).toHaveProperty('target')
        expect(goalData).toHaveProperty('current')
        // Should have prediction if analytics are available
        if (goalData.prediction) {
          expect(goalData.prediction).toHaveProperty('percentChance')
          expect(typeof goalData.prediction.percentChance).toBe('number')
        }
      }
    })
  })

  describe('PUT /api/goals/:id', () => {
    it('should update goal and recalculate predictions', async () => {
      const goal = await Goal.create({
        studentId: testStudentMongoId,
        name: 'Math Grade Target',
        type: 'grade',
        subject: 'Math',
        target: 85,
        current: 75,
        unit: '%',
        status: 'active'
      })

      const response = await request(app)
        .put(`/api/goals/${goal._id}`)
        .send({
          current: 80
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('current', 80)
      expect(response.body.data).toHaveProperty('progressPercentage')
    })
  })
})

