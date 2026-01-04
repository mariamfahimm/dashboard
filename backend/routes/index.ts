// API Routes
import { Router } from 'express'
import {
  getPerformance,
  getInsights as getPerformanceInsights,
  getRiskScore
} from '../controllers/performanceController'
import {
  getEngagement,
  predict,
  getInsights as getEngagementInsights
} from '../controllers/engagementController'
// Note: Alerts and Recommendations controllers are imported in their respective route files

// Import CRUD routes
import authRoutes from './auth'
import usersRoutes from './users'
import studentsRoutes from './students'
import coursesRoutes from './courses'
import enrollmentsRoutes from './enrollments'
import assignmentsRoutes from './assignments'
import gradesRoutes from './grades'
import goalsRoutes from './goals'
import filesRoutes from './files'
import alertsCrudRoutes from './alerts'
import recommendationsCrudRoutes from './recommendations'
import messagesRoutes from './messages'
import noticesRoutes from './notices'
import eventsRoutes from './events'
import atRiskRoutes from './atRisk'
import parentRecommendationsRoutes from './parentRecommendations'
import assignmentCompletionRoutes from './assignmentCompletion'
import behaviorAnalysisRoutes from './behaviorAnalysis'
import optimalStudyTimeRoutes from './optimalStudyTime'
import attendanceRoutes from './attendance'
import scheduleRoutes from './schedule'
import feesRoutes from './fees'
import demoRoutes from './demo'
import adminRoutes from './admin'

const router = Router()

// ============================================
// Authentication Routes (public)
// ============================================
router.use('/auth', authRoutes)

// ============================================
// CRUD Routes
// ============================================
router.use('/users', usersRoutes)
router.use('/students', studentsRoutes)
router.use('/courses', coursesRoutes)
router.use('/enrollments', enrollmentsRoutes)
router.use('/assignments', assignmentsRoutes)
router.use('/grades', gradesRoutes)
router.use('/goals', goalsRoutes)
router.use('/files', filesRoutes)
router.use('/alerts', alertsCrudRoutes)
router.use('/recommendations', recommendationsCrudRoutes)
router.use('/messages', messagesRoutes)
router.use('/notices', noticesRoutes)
router.use('/events', eventsRoutes)
router.use('/at-risk', atRiskRoutes)
router.use('/parent-recommendations', parentRecommendationsRoutes)
router.use('/assignment-completion', assignmentCompletionRoutes)
router.use('/behavior-analysis', behaviorAnalysisRoutes)
router.use('/optimal-study-time', optimalStudyTimeRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/schedule', scheduleRoutes)
router.use('/fees', feesRoutes)
router.use('/demo', demoRoutes)
router.use('/admin', adminRoutes)

// ============================================
// Specialized Routes (Performance, Engagement, etc.)
// ============================================
// Performance Routes
router.get('/performance/:studentId', getPerformance)
router.get('/performance/:studentId/insights', getPerformanceInsights)
router.get('/performance/:studentId/risk', getRiskScore)

// Engagement Routes
router.get('/engagement/:studentId', getEngagement)
router.get('/engagement/:studentId/predict', predict)
router.get('/engagement/:studentId/insights', getEngagementInsights)

// Forecast Routes
import {
  forecastGrade,
  forecastStudyTime,
  forecastCompletionRate,
  forecastGoals,
  getStudentForecasts
} from '../controllers/forecastController'

router.get('/forecast/:studentId', getStudentForecasts)
router.post('/forecast/grade', forecastGrade)
router.post('/forecast/study-time', forecastStudyTime)
router.post('/forecast/completion-rate', forecastCompletionRate)
router.post('/forecast/goals', forecastGoals)

// Note: Alerts and Recommendations specialized routes are now in ./alerts.ts and ./recommendations.ts

export default router

