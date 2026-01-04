// Unit tests for analyticsEngine.ts
import {
  calculateWeeklyPerformanceChanges,
  calculateSubjectGrowthRates,
  detectTrend,
  identifyStrengthsAndFocusAreas,
  generateAcademicInsights,
} from '../services/analyticsEngine'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// Use a test database
// Support both DATABASE_URL and MONGO_URI
const baseUri = process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect'
const TEST_DB_URI = baseUri.replace(/\/[^/]+$/, '/educonnect-test')

describe('Analytics Engine', () => {
  let testStudentId: string
  let testCourseId: string
  let testEnrollmentId: string

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
    
    // Clean up test data
    await Student.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Grade.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Assignment.deleteMany({ title: /^TEST-/ }).catch(() => {})
    await Enrollment.deleteMany({ studentId: /^TEST-/ }).catch(() => {})
    await Course.deleteMany({ title: /^TEST-/ }).catch(() => {})
  }, 60000) // 60 second timeout

  beforeEach(async () => {
    // Create test student
    const student = await Student.create({
      name: 'Test Student',
      studentId: `TEST-${Date.now()}`,
      gradeLevel: 10,
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
      userId: 'test-user-id',
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
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('calculateWeeklyPerformanceChanges', () => {
    it('should return empty array when no grades exist', async () => {
      const result = await calculateWeeklyPerformanceChanges(testStudentId, 4)
      expect(result).toEqual([])
    })

    it('should calculate weekly changes correctly', async () => {
      // Create grades over 4 weeks
      const now = new Date()
      const weeks = [3, 2, 1, 0] // weeks ago
      const scores = [70, 75, 80, 85] // improving trend

      for (let i = 0; i < weeks.length; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - (weeks[i] * 7))

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

      const result = await calculateWeeklyPerformanceChanges(testStudentId, 4)
      
      expect(result.length).toBeGreaterThan(0)
      // Should show improving trend
      const improvingWeeks = result.filter(w => w.trend === 'improving')
      expect(improvingWeeks.length).toBeGreaterThan(0)
    })

    it('should handle edge case with single grade', async () => {
      const date = new Date()
      const assignment = await Assignment.create({
        courseId: testCourseId,
        title: 'TEST Single Assignment',
        subject: 'Math',
        dueDate: date,
        status: 'completed',
      })

      await Grade.create({
        enrollmentId: testEnrollmentId,
        assignmentId: String(assignment._id),
        studentId: testStudentId,
        courseId: testCourseId,
        score: 80,
        maxScore: 100,
        percentage: 80,
        submittedAt: date,
        gradedAt: date,
      })

      const result = await calculateWeeklyPerformanceChanges(testStudentId, 4)
      // Should have at least one week with stable trend (no change)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('calculateSubjectGrowthRates', () => {
    it('should return empty array when no grades exist', async () => {
      const result = await calculateSubjectGrowthRates(testStudentId)
      expect(result).toEqual([])
    })

    it('should calculate growth rates correctly for improving subject', async () => {
      // Create grades showing improvement: 60, 65, 70, 75, 80
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

      const result = await calculateSubjectGrowthRates(testStudentId)
      
      expect(result.length).toBeGreaterThan(0)
      const mathSubject = result.find(r => r.subject === 'Math')
      expect(mathSubject).toBeDefined()
      if (mathSubject) {
        expect(mathSubject.growthRate).toBeGreaterThan(0) // Should be positive (improving)
        expect(mathSubject.trend).toBe('improving')
      }
    })

    it('should identify declining subject correctly', async () => {
      // Create grades showing decline: 85, 80, 75, 70, 65
      const now = new Date()
      const scores = [85, 80, 75, 70, 65]

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

      const result = await calculateSubjectGrowthRates(testStudentId)
      
      const mathSubject = result.find(r => r.subject === 'Math')
      expect(mathSubject).toBeDefined()
      if (mathSubject) {
        expect(mathSubject.growthRate).toBeLessThan(0) // Should be negative (declining)
        expect(mathSubject.trend).toBe('declining')
      }
    })
  })

  describe('detectTrend', () => {
    it('should return stable trend when insufficient data', async () => {
      const result = await detectTrend(testStudentId)
      expect(result.overallTrend).toBe('stable')
      expect(result.confidence).toBeLessThanOrEqual(0.5)
    })

    it('should detect improving trend', async () => {
      // Create grades showing improvement
      const now = new Date()
      const scores = [70, 72, 75, 78, 80, 82]

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

      const result = await detectTrend(testStudentId)
      expect(result.overallTrend).toBe('improving')
      expect(result.averageWeeklyChange).toBeGreaterThan(0)
    })

    it('should detect declining trend', async () => {
      // Create grades showing decline
      const now = new Date()
      const scores = [85, 83, 80, 77, 75, 72]

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

      const result = await detectTrend(testStudentId)
      expect(result.overallTrend).toBe('declining')
      expect(result.averageWeeklyChange).toBeLessThan(0)
    })
  })

  describe('identifyStrengthsAndFocusAreas', () => {
    it('should identify strengths correctly', async () => {
      // Create high-performing subject (Math: 90+)
      const now = new Date()
      const scores = [90, 92, 91, 93]

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

      const result = await identifyStrengthsAndFocusAreas(testStudentId)
      expect(result.strengths.length).toBeGreaterThan(0)
      const mathStrength = result.strengths.find(s => s.subject === 'Math')
      expect(mathStrength).toBeDefined()
    })

    it('should identify focus areas correctly', async () => {
      // Create low-performing subject (Math: <70)
      const now = new Date()
      const scores = [55, 58, 60, 62]

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

      const result = await identifyStrengthsAndFocusAreas(testStudentId)
      expect(result.focusAreas.length).toBeGreaterThan(0)
      const mathFocus = result.focusAreas.find(f => f.subject === 'Math')
      expect(mathFocus).toBeDefined()
      if (mathFocus) {
        expect(mathFocus.priority).toBeDefined()
        expect(['high', 'medium', 'low']).toContain(mathFocus.priority)
      }
    })
  })

  describe('generateAcademicInsights', () => {
    it('should generate insights for improving student', async () => {
      // Create improving trend
      const now = new Date()
      const scores = [70, 73, 76, 79, 82, 85]

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

      const insights = await generateAcademicInsights(testStudentId)
      expect(insights.length).toBeGreaterThan(0)
      
      // Should have at least one "improving" insight
      const improvingInsights = insights.filter(i => i.type === 'improving')
      expect(improvingInsights.length).toBeGreaterThan(0)
    })

    it('should generate insights for declining student', async () => {
      // Create declining trend
      const now = new Date()
      const scores = [85, 82, 79, 76, 73, 70]

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

      const insights = await generateAcademicInsights(testStudentId)
      expect(insights.length).toBeGreaterThan(0)
      
      // Should have at least one "needs_attention" or "warning" insight
      const attentionInsights = insights.filter(i => 
        i.type === 'needs_attention' || i.type === 'warning'
      )
      expect(attentionInsights.length).toBeGreaterThan(0)
    })

    it('should return insights with required fields', async () => {
      // Create some data
      const now = new Date()
      const scores = [75, 77, 79]

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

      const insights = await generateAcademicInsights(testStudentId)
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('type')
        expect(insight).toHaveProperty('category')
        expect(insight).toHaveProperty('title')
        expect(insight).toHaveProperty('message')
        expect(insight).toHaveProperty('confidence')
        expect(insight).toHaveProperty('actionable')
        expect(['improving', 'needs_attention', 'excellent', 'warning', 'stable']).toContain(insight.type)
        expect(insight.confidence).toBeGreaterThanOrEqual(0)
        expect(insight.confidence).toBeLessThanOrEqual(1)
      })
    })
  })
})

