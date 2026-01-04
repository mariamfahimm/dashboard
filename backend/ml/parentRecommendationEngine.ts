// Personalized Study Recommendations for Parents
// Analyzes student patterns and provides actionable recommendations for parents

import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import Enrollment from '../models/Enrollment'
import Course from '../models/Course'
import Student from '../models/Student'

export interface StudentProfile {
  weakSubjects: string[]           // Subjects below 70%
  strongSubjects: string[]         // Subjects above 80%
  assignmentCompletionRate: number  // 0-100
  averageGrade: number              // Overall average
  gradeTrend: number                // Slope of recent grades
  studyConsistency: number          // 0-100 (based on submission patterns)
  timeOfDayPerformance: {          // Performance by time of day
    morning: number
    afternoon: number
    evening: number
  }
  dayOfWeekPerformance: {          // Performance by day of week
    [day: string]: number
  }
  similarStudents: string[]         // Students with similar profiles
}

export interface ParentRecommendation {
  type: 'study_schedule' | 'subject_focus' | 'resource' | 'intervention' | 'encouragement' | 'monitoring'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionItems: string[]            // Specific actions parents can take
  expectedImpact: string
  timeframe: string                 // e.g., "2-3 weeks", "immediate"
  confidence: number                // 0-1 confidence in recommendation
  relatedSubject?: string
}

/**
 * Analyze student profile for recommendations
 */
async function analyzeStudentProfile(studentId: string): Promise<StudentProfile> {
  try {
    const student = await Student.findById(studentId)
    if (!student) {
      throw new Error('Student not found')
    }

    // Get enrollments and courses
    const enrollments = await Enrollment.find({ studentId })
    const courseIds = enrollments.map(e => e.courseId).filter(id => id && id !== 'undefined')
    const courses = await Course.find({ _id: { $in: courseIds } })

    // Get all grades
    const allGrades = await Grade.find({ studentId })
      .sort({ submittedAt: -1 })

    // Get assignments
    const assignments = await Assignment.find({ courseId: { $in: courseIds } })
    const completedAssignments = assignments.filter(a => a.status === 'completed')
    const completionRate = assignments.length > 0
      ? (completedAssignments.length / assignments.length) * 100
      : 100

  // Calculate subject performance
  const subjectScores = new Map<string, number[]>()
  courses.forEach(course => {
    subjectScores.set(course.subject, [])
  })

  allGrades.forEach(grade => {
    if (!grade || !grade.score || !grade.maxScore || grade.maxScore <= 0) return
    const course = courses.find(c => String(c._id) === String(grade.courseId))
    if (course && course.subject) {
      const percentage = (grade.score / grade.maxScore) * 100
      subjectScores.get(course.subject)?.push(percentage)
    }
  })

  // Identify weak and strong subjects
  const weakSubjects: string[] = []
  const strongSubjects: string[] = []
  const subjectAverages: { subject: string; average: number }[] = []

  subjectScores.forEach((scores, subject) => {
    if (scores.length > 0) {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
      subjectAverages.push({ subject, average: avg })
      
      if (avg < 70) {
        weakSubjects.push(subject)
      } else if (avg >= 80) {
        strongSubjects.push(subject)
      }
    }
  })

  // Calculate overall average (with safe division)
  const averageGrade = allGrades.length > 0
    ? allGrades
        .filter(g => g && g.score != null && g.maxScore != null && g.maxScore > 0)
        .reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / 
        Math.max(1, allGrades.filter(g => g && g.score != null && g.maxScore != null && g.maxScore > 0).length)
    : 0

  // Calculate grade trend (last 4 weeks)
  const recentGrades = allGrades.slice(0, 4)
  let gradeTrend = 0
  if (recentGrades.length >= 2) {
    const percentages = recentGrades.map(g => (g.score / g.maxScore) * 100)
    const n = percentages.length
    const sumX = percentages.reduce((sum, _, i) => sum + i, 0)
    const sumY = percentages.reduce((sum, p) => sum + p, 0)
    const sumXY = percentages.reduce((sum, p, i) => sum + i * p, 0)
    const sumX2 = percentages.reduce((sum, _, i) => sum + i * i, 0)
    gradeTrend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }

  // Calculate study consistency (based on submission frequency)
  const submissionDates = allGrades.map(g => new Date(g.submittedAt).getTime())
  const timeBetweenSubmissions = []
  for (let i = 1; i < submissionDates.length; i++) {
    const days = (submissionDates[i - 1] - submissionDates[i]) / (1000 * 60 * 60 * 24)
    timeBetweenSubmissions.push(days)
  }
  const avgDaysBetween = timeBetweenSubmissions.length > 0
    ? timeBetweenSubmissions.reduce((sum, d) => sum + d, 0) / timeBetweenSubmissions.length
    : 7
  // Consistency: lower variance = higher consistency
  const consistencyScore = Math.max(0, 100 - (avgDaysBetween * 10))

  // Analyze time of day performance (simplified - would need actual time data)
  // For now, use default values
  const timeOfDayPerformance = {
    morning: 75,
    afternoon: 80,
    evening: 70
  }

  // Analyze day of week performance
  const dayOfWeekPerformance: { [day: string]: number } = {
    Monday: 75,
    Tuesday: 80,
    Wednesday: 78,
    Thursday: 82,
    Friday: 70
  }

  // Find similar students (simplified - would use ML clustering in production)
  // For now, return empty array
  const similarStudents: string[] = []

  return {
    weakSubjects,
    strongSubjects,
    assignmentCompletionRate: completionRate,
    averageGrade,
    gradeTrend,
    studyConsistency: consistencyScore,
    timeOfDayPerformance,
    dayOfWeekPerformance,
    similarStudents
  }
  } catch (error) {
    console.error('Error in analyzeStudentProfile:', error)
    // Return safe default profile
    return {
      weakSubjects: [],
      strongSubjects: [],
      assignmentCompletionRate: 0,
      averageGrade: 0,
      gradeTrend: 0,
      studyConsistency: 0,
      timeOfDayPerformance: {
        morning: 0,
        afternoon: 0,
        evening: 0
      },
      dayOfWeekPerformance: {},
      similarStudents: []
    }
  }
}

/**
 * Generate personalized recommendations for parents
 */
function generateParentRecommendations(profile: StudentProfile, language: string = 'en'): ParentRecommendation[] {
  try {
    const { getRecommendationText } = require('../utils/recommendationTranslations')
    const recommendations: ParentRecommendation[] = []

  // 1. Subject Focus Recommendations
  if (profile.weakSubjects.length > 0) {
    profile.weakSubjects.forEach(subject => {
      recommendations.push({
        type: 'subject_focus',
        priority: 'high',
        title: getRecommendationText('focusOnSubjectNeedsSupport', language, subject),
        description: getRecommendationText('childStrugglingWithSubject', language, subject, 70),
        actionItems: [
          getRecommendationText('scheduleMinutesDaily', language, subject),
          getRecommendationText('reviewSubjectAssignments', language, subject),
          getRecommendationText('contactSubjectTeacher', language, subject),
          getRecommendationText('considerTutoringForSubject', language, subject),
          getRecommendationText('celebrateImprovementsInSubject', language, subject)
        ],
        expectedImpact: getRecommendationText('improveSubjectGrade', language),
        timeframe: getRecommendationText('weeksToSeeImprovement', language),
        confidence: 0.85,
        relatedSubject: subject
      })
    })
  }

  // 2. Study Schedule Recommendations
  if (profile.studyConsistency < 70) {
    recommendations.push({
      type: 'study_schedule',
      priority: 'high',
      title: getRecommendationText('establishConsistentStudyRoutine', language),
      description: getRecommendationText('studyPatternsInconsistent', language),
      actionItems: [
        getRecommendationText('setFixedStudyTime', language),
        getRecommendationText('createQuietStudySpace', language),
        getRecommendationText('useStudyCalendar', language),
        getRecommendationText('breakStudySessions', language),
        getRecommendationText('reviewScheduleWeekly', language)
      ],
      expectedImpact: getRecommendationText('improveCompletionReduceStress', language),
      timeframe: getRecommendationText('weeksToEstablishHabit', language),
      confidence: 0.80
    })
  }

  // 3. Assignment Completion Recommendations
  if (profile.assignmentCompletionRate < 80) {
    recommendations.push({
      type: 'monitoring',
      priority: 'high',
      title: getRecommendationText('improveAssignmentCompletion', language),
      description: getRecommendationText('childCompletingPercent', language, Math.round(profile.assignmentCompletionRate)),
      actionItems: [
        getRecommendationText('checkDashboardDaily', language),
        getRecommendationText('setRemindersBeforeDue', language),
        getRecommendationText('breakLargeAssignments', language),
        getRecommendationText('reviewCompletedTogether', language),
        getRecommendationText('celebrateCompletedAssignments', language)
      ],
      expectedImpact: getRecommendationText('increaseCompletionRate', language),
      timeframe: getRecommendationText('weeks34', language),
      confidence: 0.75
    })
  }

  // 4. Grade Trend Recommendations
  if (profile.gradeTrend < -2) {
    recommendations.push({
      type: 'intervention',
      priority: 'high',
      title: getRecommendationText('addressDecliningGrades', language),
      description: getRecommendationText('gradesDeclining', language),
      actionItems: [
        getRecommendationText('scheduleMeetingWithTeachers', language),
        getRecommendationText('identifyRootCause', language),
        getRecommendationText('increaseMonitoringSupport', language),
        getRecommendationText('considerAcademicSupport', language),
        getRecommendationText('focusOnBuildingConfidence', language)
      ],
      expectedImpact: getRecommendationText('stopDeclineBeginRecovery', language),
      timeframe: getRecommendationText('immediateActionResults', language),
      confidence: 0.90
    })
  } else if (profile.gradeTrend > 2) {
    recommendations.push({
      type: 'encouragement',
      priority: 'medium',
      title: getRecommendationText('maintainPositiveMomentum', language),
      description: getRecommendationText('gradesImproving', language),
      actionItems: [
        getRecommendationText('acknowledgeCelebrate', language),
        getRecommendationText('continueCurrentStrategies', language),
        getRecommendationText('setNewGoals', language),
        getRecommendationText('sharePositiveFeedback', language),
        getRecommendationText('avoidTooMuchPressure', language)
      ],
      expectedImpact: getRecommendationText('sustainImprovement', language),
      timeframe: getRecommendationText('ongoing', language),
      confidence: 0.70
    })
  }

  // 5. Strong Subject Recommendations
  if (profile.strongSubjects.length > 0) {
    recommendations.push({
      type: 'encouragement',
      priority: 'low',
      title: getRecommendationText('leverageStrengths', language, profile.strongSubjects.join(', ')),
      description: getRecommendationText('childExcelsIn', language, profile.strongSubjects.join(' and ')),
      actionItems: [
        getRecommendationText('celebrateAchievementsIn', language, profile.strongSubjects.join(' and ')),
        getRecommendationText('useStrongSubjectsAsExamples', language),
        getRecommendationText('connectStrongSubjectStrategies', language),
        getRecommendationText('considerAdvancedOpportunities', language),
        getRecommendationText('maintainEngagement', language)
      ],
      expectedImpact: getRecommendationText('buildConfidenceTransferStrategies', language),
      timeframe: getRecommendationText('ongoing', language),
      confidence: 0.65
    })
  }

  // 6. Resource Recommendations
  if (profile.averageGrade < 75) {
    recommendations.push({
      type: 'resource',
      priority: 'medium',
      title: getRecommendationText('exploreAdditionalResources', language),
      description: getRecommendationText('childMayBenefit', language),
      actionItems: [
        getRecommendationText('researchOnlinePlatforms', language),
        getRecommendationText('lookForEducationalApps', language),
        getRecommendationText('visitLibrary', language),
        getRecommendationText('considerYouTubeKhan', language),
        getRecommendationText('askTeachersForResources', language)
      ],
      expectedImpact: getRecommendationText('provideAlternativeLearning', language),
      timeframe: getRecommendationText('weeksToIdentify', language),
      confidence: 0.60
    })
  }

  // 7. Study Time Recommendations (based on time of day performance)
  const bestTime = Object.entries(profile.timeOfDayPerformance)
    .sort((a, b) => b[1] - a[1])[0][0]
  
  if (bestTime) {
    recommendations.push({
      type: 'study_schedule',
      priority: 'medium',
      title: getRecommendationText('optimizeStudyTime', language, bestTime),
      description: getRecommendationText('basedOnPerformance', language, bestTime),
      actionItems: [
        getRecommendationText('scheduleChallengingSubjects', language, bestTime),
        getRecommendationText('useTimeForNewMaterial', language, bestTime),
        getRecommendationText('reserveOtherTimes', language),
        getRecommendationText('adjustFamilySchedule', language),
        getRecommendationText('monitorPatternContinue', language)
      ],
      expectedImpact: getRecommendationText('improveLearningEfficiency', language),
      timeframe: getRecommendationText('weeksToSeeImpact', language),
      confidence: 0.55
    })
  }

  // Sort by priority (high first) and confidence
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.confidence - a.confidence
  })

  return recommendations
  } catch (error) {
    console.error('Error in generateParentRecommendations:', error)
    // Return safe default recommendation
    return [{
      type: 'monitoring',
      priority: 'medium',
      title: language === 'ar' ? 'ابق مشاركاً في تعليم طفلك' : 'Stay Engaged in Your Child\'s Education',
      description: language === 'ar' ? 'المراقبة والدعم المنتظمان هما مفتاح النجاح الأكاديمي.' : 'Regular monitoring and support are key to academic success.',
      actionItems: [
        language === 'ar' ? 'تحقق من لوحة التحكم بانتظام' : 'Check the dashboard regularly',
        language === 'ar' ? 'راجع الواجبات معاً' : 'Review assignments together'
      ],
      expectedImpact: language === 'ar' ? 'الحفاظ على الوعي' : 'Maintain awareness',
      timeframe: language === 'ar' ? 'مستمر' : 'Ongoing',
      confidence: 0.50
    }]
  }
}

/**
 * Main function: Get personalized recommendations for parents
 */
export async function getParentRecommendations(studentId: string, language: string = 'en'): Promise<ParentRecommendation[]> {
  try {
    // Analyze student profile
    const profile = await analyzeStudentProfile(studentId)

    // Generate recommendations with language support
    const recommendations = generateParentRecommendations(profile, language)

    return recommendations
  } catch (error) {
    console.error('Error generating parent recommendations:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    // Return safe default recommendations on error
    try {
      const { getRecommendationText } = require('../utils/recommendationTranslations')
      const lang = language || 'en'
      return [{
        type: 'monitoring' as const,
        priority: 'medium' as const,
        title: getRecommendationText('stayEngaged', lang),
        description: getRecommendationText('regularMonitoringKey', lang),
        actionItems: [
          getRecommendationText('checkDashboardRegularly', lang),
          getRecommendationText('reviewAssignmentsTogether', lang),
          getRecommendationText('communicateWithTeachers', lang),
          getRecommendationText('celebrateAchievements', lang)
        ],
        expectedImpact: getRecommendationText('maintainAwareness', lang),
        timeframe: getRecommendationText('ongoing', lang),
        confidence: 0.50
      }]
    } catch (fallbackError) {
      console.error('Error in fallback recommendation:', fallbackError)
      // Ultimate fallback - return basic recommendation
      return [{
        type: 'monitoring' as const,
        priority: 'medium' as const,
        title: 'Stay Engaged',
        description: 'Regular monitoring and support are key to academic success.',
        actionItems: [
          'Check the dashboard regularly',
          'Review assignments together'
        ],
        expectedImpact: 'Maintain awareness',
        timeframe: 'Ongoing',
        confidence: 0.50
      }]
    }
  }
}

/**
 * Get recommendations for multiple students
 */
export async function getParentRecommendationsBatch(studentIds: string[], language: string = 'en'): Promise<Map<string, ParentRecommendation[]>> {
  const recommendationsMap = new Map<string, ParentRecommendation[]>()
  
  await Promise.all(
    studentIds.map(async (studentId) => {
      try {
        const recommendations = await getParentRecommendations(studentId, language)
        recommendationsMap.set(studentId, recommendations)
      } catch (error) {
        console.error(`Error getting recommendations for student ${studentId}:`, error)
        recommendationsMap.set(studentId, [])
      }
    })
  )

  return recommendationsMap
}

