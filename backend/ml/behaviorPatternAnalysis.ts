// Behavior Pattern Analysis
// Detects patterns in behavior incidents and predicts likelihood of future incidents

import Message from '../models/Message'
import Alert from '../models/Alert'
import Grade from '../models/Grade'
import Student from '../models/Student'

export interface BehaviorFeatures {
  incidentHistory: {
    date: Date
    type: string
    severity: 'low' | 'medium' | 'high'
    category: string
  }[]
  dayOfWeekPattern: number[]  // [Mon, Tue, Wed, Thu, Fri] - incidents per day
  timeOfDayPattern: {
    morning: number  // 6am-12pm
    afternoon: number  // 12pm-5pm
    evening: number  // 5pm-10pm
  }
  subjectCorrelation: {
    subject: string
    incidentRate: number
    incidentCount: number
  }[]
  recentTrend: number  // -1 to 1 (declining to increasing)
  incidentFrequency: number  // Incidents per week
  severityDistribution: {
    low: number
    medium: number
    high: number
  }
  gradeBeforeIncident: number  // Average grade in week before incidents
  attendanceCorrelation: number  // Correlation with attendance issues
  daysSinceLastIncident: number
}

export interface BehaviorPattern {
  studentId: string
  incidentRisk: number  // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  patterns: string[]  // Detected patterns
  triggers: string[]  // Potential triggers
  predictions: {
    nextWeekIncidentProbability: number  // 0-1
    highRiskDays: string[]  // Days of week
    highRiskSubjects: string[]  // Subjects
    recommendedActions: string[]
  }
  confidence: number  // 0-1
  timeline: string  // When intervention might be needed
}

/**
 * Extract behavior features from student data
 */
async function extractBehaviorFeatures(studentId: string): Promise<BehaviorFeatures> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Get behavior-related messages
  const behaviorMessages = await Message.find({
    studentId,
    category: 'behavior',
    createdAt: { $gte: ninetyDaysAgo }
  }).sort({ createdAt: -1 })

  // Get behavior-related alerts
  const behaviorAlerts = await Alert.find({
    studentId,
    type: { $in: ['performance', 'engagement'] }, // These often correlate with behavior
    createdAt: { $gte: ninetyDaysAgo }
  }).sort({ timestamp: -1 })

  // Combine and process incidents
  const incidents: BehaviorFeatures['incidentHistory'] = []

  // Process messages as incidents
  behaviorMessages.forEach(msg => {
    // Message priority is 'low' | 'normal' | 'high'
    const severity = msg.priority === 'high' ? 'high' :
                     msg.priority === 'normal' ? 'medium' : 'low'
    incidents.push({
      date: new Date(msg.createdAt),
      type: 'message',
      severity,
      category: msg.category || 'general'
    })
  })

  // Process alerts as incidents
  behaviorAlerts.forEach(alert => {
    const severity = alert.priority === 'critical' ? 'high' :
                     alert.priority === 'high' ? 'high' :
                     alert.priority === 'medium' ? 'medium' : 'low'
    incidents.push({
      date: new Date(alert.timestamp),
      type: alert.type,
      severity,
      category: alert.type
    })
  })

  // Sort by date
  incidents.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Calculate day of week pattern
  const dayOfWeekCounts = [0, 0, 0, 0, 0] // Mon-Fri
  incidents.forEach(incident => {
    const day = incident.date.getDay()
    // Convert Sunday (0) to 6, then adjust for Mon=0
    const weekday = day === 0 ? 6 : day - 1
    if (weekday >= 0 && weekday < 5) {
      dayOfWeekCounts[weekday]++
    }
  })

  // Calculate time of day pattern
  const timePattern = {
    morning: 0,
    afternoon: 0,
    evening: 0
  }
  incidents.forEach(incident => {
    const hour = incident.date.getHours()
    if (hour >= 6 && hour < 12) {
      timePattern.morning++
    } else if (hour >= 12 && hour < 17) {
      timePattern.afternoon++
    } else if (hour >= 17 && hour < 22) {
      timePattern.evening++
    }
  })

  // Calculate subject correlation (using grades as proxy)
  const grades = await Grade.find({ studentId })
    .sort({ submittedAt: -1 })
    .limit(50)

  // Get courses to map grades to subjects
  const Enrollment = (await import('../models/Enrollment')).default
  const Course = (await import('../models/Course')).default
  
  const enrollments = await Enrollment.find({ studentId })
  const courseIds = enrollments.map(e => e.courseId).filter(Boolean)
  const courses = await Course.find({ _id: { $in: courseIds } })

  const subjectIncidentMap = new Map<string, number>()
  const subjectGradeMap = new Map<string, number[]>()

  // Map incidents to subjects (simplified - using recent grades as proxy)
  grades.forEach(grade => {
    const course = courses.find(c => String(c._id) === String(grade.courseId))
    if (course) {
      const subject = course.subject || 'General'
      if (!subjectGradeMap.has(subject)) {
        subjectGradeMap.set(subject, [])
      }
      subjectGradeMap.get(subject)!.push(grade.percentage)
    }
  })

  // Calculate incident rate per subject (simplified - using grade performance as indicator)
  const subjectCorrelation: BehaviorFeatures['subjectCorrelation'] = []
  subjectGradeMap.forEach((grades, subject) => {
    const avgGrade = grades.reduce((sum, g) => sum + g, 0) / grades.length
    // Lower grades might correlate with more incidents (simplified heuristic)
    const incidentRate = avgGrade < 70 ? 0.3 : avgGrade < 80 ? 0.15 : 0.05
    subjectCorrelation.push({
      subject,
      incidentRate,
      incidentCount: Math.round(incidents.length * incidentRate)
    })
  })

  // Calculate recent trend (last 30 days vs previous 30 days)
  const recentIncidents = incidents.filter(i => i.date >= thirtyDaysAgo).length
  const previousIncidents = incidents.filter(i => {
    const date = i.date
    return date >= ninetyDaysAgo && date < thirtyDaysAgo
  }).length

  const recentTrend = previousIncidents > 0
    ? (recentIncidents - previousIncidents) / Math.max(previousIncidents, 1)
    : recentIncidents > 0 ? 1 : 0

  // Calculate incident frequency (per week)
  const daysDiff = (now.getTime() - ninetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
  const incidentFrequency = incidents.length / (daysDiff / 7)

  // Calculate severity distribution
  const severityDistribution = {
    low: incidents.filter(i => i.severity === 'low').length,
    medium: incidents.filter(i => i.severity === 'medium').length,
    high: incidents.filter(i => i.severity === 'high').length
  }

  // Calculate average grade before incidents (last 10 incidents)
  let gradeBeforeIncident = 75 // Default
  if (incidents.length > 0 && grades.length > 0) {
    const recentIncidentDates = incidents.slice(0, 10).map(i => i.date)
    const gradesBeforeIncidents = grades.filter(g => {
      const gradeDate = new Date(g.submittedAt)
      return recentIncidentDates.some(incidentDate => {
        const weekBefore = new Date(incidentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        return gradeDate >= weekBefore && gradeDate < incidentDate
      })
    })
    if (gradesBeforeIncidents.length > 0) {
      gradeBeforeIncident = gradesBeforeIncidents.reduce((sum, g) => sum + g.percentage, 0) / gradesBeforeIncidents.length
    }
  }

  // Calculate attendance correlation (simplified - using alerts as proxy)
  const attendanceAlerts = behaviorAlerts.filter(a => a.type === 'attendance').length
  const attendanceCorrelation = behaviorAlerts.length > 0
    ? attendanceAlerts / behaviorAlerts.length
    : 0

  // Days since last incident
  const daysSinceLastIncident = incidents.length > 0
    ? Math.floor((now.getTime() - incidents[0].date.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  return {
    incidentHistory: incidents,
    dayOfWeekPattern: dayOfWeekCounts,
    timeOfDayPattern: timePattern,
    subjectCorrelation,
    recentTrend: Math.max(-1, Math.min(1, recentTrend)),
    incidentFrequency,
    severityDistribution,
    gradeBeforeIncident,
    attendanceCorrelation,
    daysSinceLastIncident
  }
}

/**
 * Analyze behavior patterns and predict risk
 */
function analyzeBehaviorPatterns(
  studentId: string,
  features: BehaviorFeatures
): BehaviorPattern {
  // Calculate incident risk score
  let riskScore = 0

  // Frequency factor (0-30 points)
  if (features.incidentFrequency > 2) {
    riskScore += 30
  } else if (features.incidentFrequency > 1) {
    riskScore += 20
  } else if (features.incidentFrequency > 0.5) {
    riskScore += 10
  }

  // Recent trend factor (0-25 points)
  if (features.recentTrend > 0.5) {
    riskScore += 25
  } else if (features.recentTrend > 0) {
    riskScore += 15
  } else if (features.recentTrend < -0.3) {
    riskScore -= 10 // Improving trend reduces risk
  }

  // Severity factor (0-20 points)
  const highSeverityRatio = features.severityDistribution.high / Math.max(features.incidentHistory.length, 1)
  if (highSeverityRatio > 0.5) {
    riskScore += 20
  } else if (highSeverityRatio > 0.3) {
    riskScore += 12
  } else if (highSeverityRatio > 0.1) {
    riskScore += 6
  }

  // Grade correlation (0-15 points)
  if (features.gradeBeforeIncident < 60) {
    riskScore += 15
  } else if (features.gradeBeforeIncident < 70) {
    riskScore += 10
  } else if (features.gradeBeforeIncident < 80) {
    riskScore += 5
  }

  // Attendance correlation (0-10 points)
  riskScore += features.attendanceCorrelation * 10

  // Clamp to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore))

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical'
  if (riskScore < 25) {
    riskLevel = 'low'
  } else if (riskScore < 50) {
    riskLevel = 'medium'
  } else if (riskScore < 75) {
    riskLevel = 'high'
  } else {
    riskLevel = 'critical'
  }

  // Detect patterns
  const patterns: string[] = []
  
  // Day of week pattern
  const maxDayIncidents = Math.max(...features.dayOfWeekPattern)
  const maxDayIndex = features.dayOfWeekPattern.indexOf(maxDayIncidents)
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  if (maxDayIncidents > 2) {
    patterns.push(`More incidents on ${dayNames[maxDayIndex]}s (${maxDayIncidents} incidents)`)
  }

  // Time of day pattern
  const maxTime = Math.max(
    features.timeOfDayPattern.morning,
    features.timeOfDayPattern.afternoon,
    features.timeOfDayPattern.evening
  )
  if (maxTime > 2) {
    if (features.timeOfDayPattern.morning === maxTime) {
      patterns.push('More incidents in the morning')
    } else if (features.timeOfDayPattern.afternoon === maxTime) {
      patterns.push('More incidents in the afternoon')
    } else {
      patterns.push('More incidents in the evening')
    }
  }

  // Subject correlation
  const highRiskSubjects = features.subjectCorrelation
    .filter(s => s.incidentRate > 0.2)
    .sort((a, b) => b.incidentRate - a.incidentRate)
    .slice(0, 3)
    .map(s => s.subject)
  
  if (highRiskSubjects.length > 0) {
    patterns.push(`Higher incident rate in: ${highRiskSubjects.join(', ')}`)
  }

  // Trend pattern
  if (features.recentTrend > 0.3) {
    patterns.push('Increasing trend in incidents')
  } else if (features.recentTrend < -0.3) {
    patterns.push('Decreasing trend in incidents (improving)')
  }

  // Identify triggers
  const triggers: string[] = []
  
  if (features.gradeBeforeIncident < 70) {
    triggers.push('Low academic performance')
  }
  
  if (features.attendanceCorrelation > 0.3) {
    triggers.push('Attendance issues')
  }
  
  if (highRiskSubjects.length > 0) {
    triggers.push(`Struggling in ${highRiskSubjects[0]}`)
  }

  // Predict next week incident probability
  const baseProbability = Math.min(0.9, features.incidentFrequency / 7)
  const trendAdjustment = features.recentTrend * 0.2
  const nextWeekIncidentProbability = Math.max(0, Math.min(1, baseProbability + trendAdjustment))

  // High risk days
  const highRiskDays = features.dayOfWeekPattern
    .map((count, index) => ({ day: dayNames[index], count }))
    .filter(d => d.count >= 2)
    .sort((a, b) => b.count - a.count)
    .map(d => d.day)

  // Recommended actions
  const recommendedActions: string[] = []
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendedActions.push('Schedule a meeting with teacher/counselor')
    recommendedActions.push('Review behavior patterns and discuss with child')
  }
  
  if (highRiskSubjects.length > 0) {
    recommendedActions.push(`Provide extra support in ${highRiskSubjects[0]}`)
  }
  
  if (highRiskDays.length > 0) {
    recommendedActions.push(`Monitor behavior closely on ${highRiskDays[0]}s`)
  }
  
  if (features.gradeBeforeIncident < 70) {
    recommendedActions.push('Address academic struggles that may be causing behavior issues')
  }
  
  if (recommendedActions.length === 0) {
    recommendedActions.push('Continue monitoring - patterns are within normal range')
  }

  // Calculate confidence
  const dataPoints = features.incidentHistory.length
  const confidence = Math.min(0.95, 0.5 + (dataPoints * 0.05))

  // Timeline
  let timeline = 'No immediate intervention needed'
  if (riskLevel === 'critical') {
    timeline = 'Immediate intervention recommended'
  } else if (riskLevel === 'high') {
    timeline = 'Intervention within 1-2 weeks recommended'
  } else if (riskLevel === 'medium') {
    timeline = 'Monitor closely, intervention may be needed soon'
  }

  return {
    studentId,
    incidentRisk: Math.round(riskScore),
    riskLevel,
    patterns,
    triggers,
    predictions: {
      nextWeekIncidentProbability: Math.round(nextWeekIncidentProbability * 100) / 100,
      highRiskDays,
      highRiskSubjects,
      recommendedActions
    },
    confidence: Math.round(confidence * 100) / 100,
    timeline
  }
}

/**
 * Analyze behavior patterns for a student
 */
export async function analyzeStudentBehavior(studentId: string): Promise<BehaviorPattern | null> {
  try {
    // Verify student exists
    const student = await Student.findById(studentId)
    if (!student) {
      return null
    }

    // Extract features
    const features = await extractBehaviorFeatures(studentId)

    // Analyze patterns
    const analysis = analyzeBehaviorPatterns(studentId, features)

    return analysis
  } catch (error) {
    console.error('Error analyzing behavior patterns:', error)
    return null
  }
}

