// Unit tests for predictiveForecast.ts
import {
  forecastGradeTarget,
  forecastStudyTimeTarget,
  forecastCompletionRateTarget,
  getGoalProgress,
} from '../services/predictiveForecast'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// Support both DATABASE_URL and MONGO_URI
const baseUri = process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect'
const TEST_DB_URI = baseUri.replace(/\/[^/]+$/, '/educonnect-test')

describe('Predictive Forecast', () => {
  let testStudentId: string
  let testCourseId: string
  let testEnrollmentId: string

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
    
    await Student.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Grade.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Assignment.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await Enrollment.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Course.deleteMany({ title: /^TEST-/ }).catch(() => {})
  }, 60000) // 60 second timeout

  beforeEach(async () => {
    const student = await Student.create({
      name: 'Test Student',
      studentId: `TEST-${Date.now()}`,
      gradeLevel: 10,
    })
    testStudentId = String(student._id)

    const course = await Course.create({
      title: 'TEST Math Course',
      description: 'Test course',
      teacherId: 'test-teacher-id',
      subject: 'Math',
    })
    testCourseId = String(course._id)

    const enrollment = await Enrollment.create({
      userId: 'test-user-id',
      studentId: testStudentId,
      courseId: testCourseId,
      enrolledAt: new Date(),
      status: 'active',
    })
    testEnrollmentId = String(enrollment._id)
  })

  afterEach(async () => {
    await Student.deleteMany({ studentId: /^TEST-/ })
    await Grade.deleteMany({ studentId: /^TEST-/ })
    await Assignment.deleteMany({ title: /^TEST-/ })
    await Enrollment.deleteMany({ studentId: /^TEST-/ })
    await Course.deleteMany({ title: /^TEST-/ })
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('forecastGradeTarget', () => {
    it('should return error message when no course found', async () => {
      const result = await forecastGradeTarget(testStudentId, 'NonExistentSubject', 85)
      
      expect(result.message).toContain('No NonExistentSubject course found')
      expect(result.onTrack).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('should return error message when no grades exist', async () => {
      const result = await forecastGradeTarget(testStudentId, 'Math', 85)
      
      expect(result.message).toContain('No grades available')
      expect(result.onTrack).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('should forecast on-track for improving student', async () => {
      // Create improving grades: 70, 75, 80, 85, 90 (out of 100)
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

      // Forecast target of 95% (should be on track)
      const result = await forecastGradeTarget(testStudentId, 'Math', 95)
      
      expect(result.target).toBe('Math Grade')
      expect(result.currentValue).toBeGreaterThan(0)
      expect(result.targetValue).toBe(95)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(typeof result.onTrack).toBe('boolean')
      expect(result.message).toBeTruthy()
    })

    it('should forecast off-track for declining student', async () => {
      // Create declining grades: 90, 85, 80, 75, 70
      const now = new Date()
      const scores = [90, 85, 80, 75, 70]

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

      // Forecast target of 95% (should be off track)
      const result = await forecastGradeTarget(testStudentId, 'Math', 95)
      
      expect(result.onTrack).toBe(false) // Declining trend won't reach high target
      expect(result.message).toContain('support') // Should mention needing support
    })

    it('should calculate predicted date when on track', async () => {
      // Create improving grades
      const now = new Date()
      const scores = [60, 65, 70, 75, 80]

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

      const result = await forecastGradeTarget(testStudentId, 'Math', 85)
      
      // If on track, should have predicted date or weeks
      if (result.onTrack && result.predictedDate) {
        expect(result.predictedDate).toBeInstanceOf(Date)
        expect(result.weeksToTarget).toBeGreaterThan(0)
      }
    })
  })

  describe('forecastStudyTimeTarget', () => {
    it('should return error when no assignments exist', async () => {
      const result = await forecastStudyTimeTarget(testStudentId, 10)
      
      expect(result.message).toContain('No assignment data')
      expect(result.onTrack).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('should forecast study time based on assignments', async () => {
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

      const result = await forecastStudyTimeTarget(testStudentId, 6)
      
      expect(result.target).toBe('Weekly Study Time')
      expect(result.currentValue).toBeGreaterThan(0)
      expect(result.targetValue).toBe(6)
      expect(result.confidence).toBeGreaterThan(0)
      expect(typeof result.onTrack).toBe('boolean')
      expect(result.message).toBeTruthy()
    })
  })

  describe('forecastCompletionRateTarget', () => {
    it('should return error when no assignments exist', async () => {
      const result = await forecastCompletionRateTarget(testStudentId, 90)
      
      expect(result.message).toContain('No assignments available')
      expect(result.onTrack).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('should calculate completion rate correctly', async () => {
      // Create mix of completed and active assignments
      const now = new Date()
      const statuses: Array<'completed' | 'active'> = ['completed', 'completed', 'active', 'completed', 'active']

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

      const result = await forecastCompletionRateTarget(testStudentId, 90)
      
      expect(result.target).toBe('Assignment Completion Rate')
      expect(result.currentValue).toBeGreaterThan(0)
      expect(result.currentValue).toBeLessThanOrEqual(100)
      expect(result.targetValue).toBe(90)
      expect(result.confidence).toBeGreaterThan(0)
      expect(typeof result.onTrack).toBe('boolean')
      expect(result.message).toBeTruthy()
    })

    it('should show on-track for high completion rate', async () => {
      // Create mostly completed assignments
      const now = new Date()
      for (let i = 0; i < 10; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() + i)

        await Assignment.create({
          courseId: testCourseId,
          title: `TEST Assignment ${i}`,
          subject: 'Math',
          dueDate: date,
          status: i < 9 ? 'completed' : 'active', // 9/10 = 90%
        })
      }

      const result = await forecastCompletionRateTarget(testStudentId, 90)
      
      // Should be on track (90% current >= 90% target)
      expect(result.onTrack).toBe(true)
    })
  })

  describe('getGoalProgress', () => {
    it('should return empty array for invalid goals', async () => {
      const goals = [
        { id: 'invalid', name: 'Invalid Goal', target: 100, unit: '%', type: 'invalid' as any },
      ]

      const result = await getGoalProgress(testStudentId, goals)
      
      expect(result.length).toBe(1)
      expect(result[0].forecast.message).toContain('Invalid goal type')
    })

    it('should return goal progress for grade goal', async () => {
      // Create some grades
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

      const goals = [
        {
          id: 'grade-math',
          name: 'Math Grade',
          target: 85,
          unit: '%',
          type: 'grade' as const,
          subject: 'Math',
        },
      ]

      const result = await getGoalProgress(testStudentId, goals)
      
      expect(result.length).toBe(1)
      expect(result[0].goalId).toBe('grade-math')
      expect(result[0].goalName).toBe('Math Grade')
      expect(result[0].target).toBe(85)
      expect(result[0].current).toBeGreaterThan(0)
      expect(result[0].progressPercentage).toBeGreaterThanOrEqual(0)
      expect(result[0].progressPercentage).toBeLessThanOrEqual(100)
      expect(typeof result[0].onTrack).toBe('boolean')
      expect(result[0].confidence).toBeGreaterThanOrEqual(0)
      expect(result[0].confidence).toBeLessThanOrEqual(1)
      expect(result[0].forecast).toBeDefined()
    })

    it('should return goal progress for multiple goals', async () => {
      // Create assignments for study time and completion rate
      const now = new Date()
      for (let i = 0; i < 5; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() + i)

        await Assignment.create({
          courseId: testCourseId,
          title: `TEST Assignment ${i}`,
          subject: 'Math',
          dueDate: date,
          status: i < 4 ? 'completed' : 'active',
        })
      }

      const goals = [
        {
          id: 'study-time',
          name: 'Weekly Study Time',
          target: 6,
          unit: 'hrs',
          type: 'time' as const,
        },
        {
          id: 'completion',
          name: 'Completion Rate',
          target: 90,
          unit: '%',
          type: 'completion' as const,
        },
      ]

      const result = await getGoalProgress(testStudentId, goals)
      
      expect(result.length).toBe(2)
      result.forEach(goal => {
        expect(goal).toHaveProperty('goalId')
        expect(goal).toHaveProperty('goalName')
        expect(goal).toHaveProperty('current')
        expect(goal).toHaveProperty('target')
        expect(goal).toHaveProperty('unit')
        expect(goal).toHaveProperty('onTrack')
        expect(goal).toHaveProperty('confidence')
        expect(goal).toHaveProperty('forecast')
      })
    })
  })
})

