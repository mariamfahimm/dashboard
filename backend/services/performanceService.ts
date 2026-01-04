// Performance Service
import Student, { IStudent } from '../models/Student'
import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import Enrollment from '../models/Enrollment'
import Course from '../models/Course'
import { 
  generateAcademicInsights, 
  calculateWeeklyPerformanceChanges,
  calculateSubjectGrowthRates,
  detectTrend,
  identifyStrengthsAndFocusAreas,
  type AcademicInsight
} from './analyticsEngine'

export interface PerformanceMetrics {
  studentId: string
  overallScore: number
  trend: 'improving' | 'stable' | 'declining'
  subjectBreakdown: {
    subject: string
    score: number
    change: number
  }[]
  weeklyProgress: {
    week: string
    score: number
  }[]
  riskLevel: 'low' | 'medium' | 'high'
  lastUpdated: string
}

export interface PerformanceInsight {
  type: 'strength' | 'weakness' | 'opportunity'
  subject: string
  message: string
  confidence: number
}

/**
 * Get performance metrics for a student
 * Calculates from actual grade data
 */
export async function getPerformanceMetrics(studentId: string): Promise<PerformanceMetrics | null> {
  try {
    // Support both MongoDB _id and studentId field
    const student = await Student.findOne({ 
      $or: [{ _id: studentId }, { studentId: studentId }] 
    })
    if (!student) return null

    const studentMongoId = String(student._id)

    // Get enrollments and courses (enrollments use MongoDB _id in studentId field)
    const enrollments = await Enrollment.find({ studentId: studentMongoId })
    const courseIds = enrollments.map(e => e.courseId).filter(id => id && id !== 'undefined')
    
    if (courseIds.length === 0) {
      // Return default structure if no enrollments
      return {
        studentId: studentMongoId,
        overallScore: 0,
        trend: 'stable',
        subjectBreakdown: [],
        weeklyProgress: [],
        riskLevel: 'low',
        lastUpdated: new Date().toISOString()
      }
    }
    
    const courses = await Course.find({ _id: { $in: courseIds } })

    // Get all grades (grades use MongoDB _id in studentId field)
    const grades = await Grade.find({ studentId: studentMongoId, courseId: { $in: courseIds } })
      .sort({ submittedAt: -1 })

    if (grades.length === 0) {
      // Return default structure if no grades
      return {
        studentId: studentMongoId,
        overallScore: 0,
        trend: 'stable',
        subjectBreakdown: [],
        weeklyProgress: [],
        riskLevel: 'low',
        lastUpdated: new Date().toISOString()
      }
    }

    // Calculate overall score
    const percentages = grades.map(g => (g.score / g.maxScore) * 100)
    const overallScore = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)

    // Calculate subject breakdown
    const subjectMap = new Map<string, { scores: number[], changes: number[] }>()
    courses.forEach(course => {
      subjectMap.set(course.subject, { scores: [], changes: [] })
    })

    grades.forEach(grade => {
      const course = courses.find(c => String(c._id) === String(grade.courseId))
      if (course) {
        const percentage = (grade.score / grade.maxScore) * 100
        subjectMap.get(course.subject)?.scores.push(percentage)
      }
    })

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      const recent = data.scores.slice(0, Math.floor(data.scores.length / 2))
      const previous = data.scores.slice(Math.floor(data.scores.length / 2))
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : recentAvg
      const change = Math.round(recentAvg - previousAvg)

      return {
        subject,
        score: Math.round(avgScore),
        change
      }
    })

    // Get weekly progress
    const weeklyChanges = await calculateWeeklyPerformanceChanges(studentId, 4)
    const weeklyProgress = weeklyChanges.map(w => ({
      week: w.week,
      score: w.score
    }))

    // Detect trend
    const trendAnalysis = await detectTrend(studentMongoId)

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (overallScore < 60 || trendAnalysis.overallTrend === 'declining') {
      riskLevel = 'high'
    } else if (overallScore < 70 || trendAnalysis.averageWeeklyChange < -1) {
      riskLevel = 'medium'
    }

    return {
      studentId: studentMongoId,
      overallScore,
      trend: trendAnalysis.overallTrend,
      subjectBreakdown,
      weeklyProgress,
      riskLevel,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    throw error
  }
}

/**
 * Get AI-generated performance insights
 * Uses rule-based analytics engine
 */
export async function getPerformanceInsights(studentId: string): Promise<PerformanceInsight[]> {
  try {
    const academicInsights = await generateAcademicInsights(studentId)
    
    // Convert AcademicInsight format to PerformanceInsight format
    return academicInsights.map(insight => {
      let type: 'strength' | 'weakness' | 'opportunity' = 'opportunity'
      
      if (insight.type === 'excellent' || insight.type === 'improving') {
        type = 'strength'
      } else if (insight.type === 'needs_attention' || insight.type === 'warning') {
        type = 'weakness'
      } else {
        type = 'opportunity'
      }

      return {
        type,
        subject: insight.subject || 'Overall',
        message: insight.message,
        confidence: insight.confidence
      }
    })
  } catch (error) {
    console.error('Error generating performance insights:', error)
    throw error
  }
}

/**
 * Calculate risk score for a student
 * TODO: Implement risk calculation algorithm
 */
export async function calculateRiskScore(studentId: string): Promise<number> {
  try {
    // TODO: Query student data and calculate risk
    // const student = await Student.findOne({ studentId })
    // const risk = calculateRisk(student.performance, student.engagement)
    
    // Mock calculation
    return 25 // Low risk
  } catch (error) {
    console.error('Error calculating risk score:', error)
    throw error
  }
}

/**
 * Update student performance data
 * TODO: Implement performance update logic
 */
export async function updatePerformance(
  studentId: string,
  performanceData: Partial<PerformanceMetrics>
): Promise<IStudent | null> {
  try {
    // TODO: Update student performance in database
    // const student = await Student.findOneAndUpdate(
    //   { studentId },
    //   { 
    //     $set: { 
    //       'performance.overallScore': performanceData.overallScore,
    //       'performance.trend': performanceData.trend,
    //       'performance.lastUpdated': new Date()
    //     }
    //   },
    //   { new: true }
    // )
    // return student
    
    return null
  } catch (error) {
    console.error('Error updating performance:', error)
    throw error
  }
}

