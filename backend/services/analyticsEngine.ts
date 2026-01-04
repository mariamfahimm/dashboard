// Academic Analytics Engine - Rule-Based Insights Generation
import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import Enrollment from '../models/Enrollment'
import Course from '../models/Course'
import Student from '../models/Student'

export interface WeeklyPerformanceChange {
  week: string
  score: number
  change: number
  trend: 'improving' | 'stable' | 'declining'
}

export interface SubjectGrowthRate {
  subject: string
  currentScore: number
  previousScore: number
  growthRate: number // percentage change
  trend: 'improving' | 'stable' | 'declining'
  weeksOfData: number
}

export interface TrendAnalysis {
  overallTrend: 'improving' | 'stable' | 'declining'
  confidence: number // 0-1
  weeksAnalyzed: number
  averageWeeklyChange: number
}

export interface StrengthArea {
  subject: string
  score: number
  trend: 'improving' | 'stable'
  reason: string
}

export interface FocusArea {
  subject: string
  score: number
  trend: 'declining' | 'stable'
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface AcademicInsight {
  type: 'improving' | 'needs_attention' | 'excellent' | 'warning' | 'stable'
  category: 'overall' | 'subject' | 'trend'
  title: string
  message: string
  subject?: string
  confidence: number
  actionable: boolean
  recommendation?: string
}

/**
 * Calculate weekly performance changes
 */
export async function calculateWeeklyPerformanceChanges(
  studentId: string,
  weeks: number = 4
): Promise<WeeklyPerformanceChange[]> {
  try {
    // Get all grades for the student
    const grades = await Grade.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    if (grades.length === 0) {
      return []
    }

    // Group grades by week
    const weeklyData = new Map<string, { scores: number[], dates: Date[] }>()
    
    grades.forEach(grade => {
      const date = new Date((grade as any).submittedAt || (grade as any).gradedAt || Date.now())
      const weekKey = getWeekKey(date)
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { scores: [], dates: [] })
      }
      
      const percentage = (grade.score / grade.maxScore) * 100
      weeklyData.get(weekKey)!.scores.push(percentage)
      weeklyData.get(weekKey)!.dates.push(date)
    })

    // Calculate average per week and changes
    const weeklyChanges: WeeklyPerformanceChange[] = []
    const sortedWeeks = Array.from(weeklyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-weeks)

    for (let i = 0; i < sortedWeeks.length; i++) {
      const [weekKey, data] = sortedWeeks[i]
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      
      let change = 0
      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      
      if (i > 0) {
        const prevWeek = sortedWeeks[i - 1][1]
        const prevAvg = prevWeek.scores.reduce((a, b) => a + b, 0) / prevWeek.scores.length
        change = avgScore - prevAvg
        
        if (change > 2) trend = 'improving'
        else if (change < -2) trend = 'declining'
        else trend = 'stable'
      }

      weeklyChanges.push({
        week: weekKey,
        score: Math.round(avgScore * 10) / 10,
        change: Math.round(change * 10) / 10,
        trend
      })
    }

    return weeklyChanges
  } catch (error) {
    console.error('Error calculating weekly performance changes:', error)
    return []
  }
}

/**
 * Calculate subject growth rates
 */
export async function calculateSubjectGrowthRates(
  studentId: string
): Promise<SubjectGrowthRate[]> {
  try {
    // Get enrollments to find courses
    const enrollments = await Enrollment.find({ studentId })
    const courseIds = enrollments
      .map(e => e.courseId)
      .filter((id: any) => id && id !== 'undefined' && id !== undefined && id !== null)
    
    if (courseIds.length === 0) {
      console.log(`[calculateSubjectGrowthRates] No valid course enrollments for student ${studentId}`)
      return []
    }
    
    // Get courses
    const courses = await Course.find({ _id: { $in: courseIds } })
    const subjectMap = new Map<string, string>() // courseId -> subject
    
    courses.forEach(course => {
      subjectMap.set(String(course._id), course.subject)
    })

    // Get all grades for valid course IDs only
    const validCourseIds = courseIds.filter(id => id && id !== 'undefined' && id !== null && id !== '')
    const grades = await Grade.find({ 
      studentId, 
      courseId: { $in: validCourseIds }
    })
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean()
      
    // Filter out grades with invalid courseIds
    const validGrades = grades.filter((g: any) => 
      g.courseId && 
      g.courseId !== 'undefined' && 
      g.courseId !== null &&
      validCourseIds.includes(g.courseId)
    )

    // Group by subject
    const subjectData = new Map<string, { scores: number[], dates: Date[] }>()
    
    grades.forEach(grade => {
      const subject = subjectMap.get(String(grade.courseId)) || 'Unknown'
      const date = new Date((grade as any).submittedAt || (grade as any).gradedAt || Date.now())
      const percentage = ((grade as any).score / (grade as any).maxScore) * 100
      
      if (!subjectData.has(subject)) {
        subjectData.set(subject, { scores: [], dates: [] })
      }
      
      subjectData.get(subject)!.scores.push(percentage)
      subjectData.get(subject)!.dates.push(date)
    })

    // Calculate growth rates
    const growthRates: SubjectGrowthRate[] = []
    
    subjectData.forEach((data, subject) => {
      if (data.scores.length < 2) {
        // Not enough data for growth calculation
        return
      }

      // Split into recent (last 50%) and previous (first 50%)
      const midPoint = Math.floor(data.scores.length / 2)
      const recentScores = data.scores.slice(0, midPoint)
      const previousScores = data.scores.slice(midPoint)
      
      const currentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      const previousScore = previousScores.reduce((a, b) => a + b, 0) / previousScores.length
      
      const growthRate = previousScore > 0 
        ? ((currentScore - previousScore) / previousScore) * 100 
        : 0

      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      if (growthRate > 3) trend = 'improving'
      else if (growthRate < -3) trend = 'declining'

      growthRates.push({
        subject,
        currentScore: Math.round(currentScore * 10) / 10,
        previousScore: Math.round(previousScore * 10) / 10,
        growthRate: Math.round(growthRate * 10) / 10,
        trend,
        weeksOfData: Math.ceil(data.scores.length / 3) // Approximate weeks
      })
    })

    return growthRates.sort((a, b) => b.growthRate - a.growthRate)
  } catch (error) {
    console.error('Error calculating subject growth rates:', error)
    return []
  }
}

/**
 * Detect overall trend
 */
export async function detectTrend(
  studentId: string
): Promise<TrendAnalysis> {
  try {
    const weeklyChanges = await calculateWeeklyPerformanceChanges(studentId, 6)
    
    if (weeklyChanges.length < 2) {
      return {
        overallTrend: 'stable',
        confidence: 0.5,
        weeksAnalyzed: weeklyChanges.length,
        averageWeeklyChange: 0
      }
    }

    // Calculate average weekly change
    const changes = weeklyChanges.slice(1).map(w => w.change)
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length

    // Determine trend
    let overallTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (avgChange > 1) overallTrend = 'improving'
    else if (avgChange < -1) overallTrend = 'declining'

    // Calculate confidence based on consistency
    const consistent = changes.every(c => 
      (overallTrend === 'improving' && c > 0) ||
      (overallTrend === 'declining' && c < 0) ||
      (overallTrend === 'stable' && Math.abs(c) < 1)
    )
    const confidence = consistent ? 0.85 : Math.max(0.5, 0.85 - (changes.length * 0.1))

    return {
      overallTrend,
      confidence: Math.round(confidence * 100) / 100,
      weeksAnalyzed: weeklyChanges.length,
      averageWeeklyChange: Math.round(avgChange * 10) / 10
    }
  } catch (error) {
    console.error('Error detecting trend:', error)
    return {
      overallTrend: 'stable',
      confidence: 0.5,
      weeksAnalyzed: 0,
      averageWeeklyChange: 0
    }
  }
}

/**
 * Identify strengths and focus areas
 */
export async function identifyStrengthsAndFocusAreas(
  studentId: string
): Promise<{ strengths: StrengthArea[], focusAreas: FocusArea[] }> {
  try {
    const growthRates = await calculateSubjectGrowthRates(studentId)
    
    const strengths: StrengthArea[] = []
    const focusAreas: FocusArea[] = []

    growthRates.forEach(subject => {
      if (subject.currentScore >= 80 && subject.trend !== 'declining') {
        strengths.push({
          subject: subject.subject,
          score: subject.currentScore,
          trend: subject.trend,
          reason: subject.trend === 'improving' 
            ? `Strong performance with ${subject.growthRate > 0 ? '+' : ''}${subject.growthRate.toFixed(1)}% growth`
            : 'Consistently strong performance'
        })
      } else if (subject.currentScore < 70 || subject.trend === 'declining') {
        const priority: 'high' | 'medium' | 'low' = 
          subject.currentScore < 60 ? 'high' :
          subject.currentScore < 65 ? 'medium' : 'low'
        
        focusAreas.push({
          subject: subject.subject,
          score: subject.currentScore,
          trend: subject.trend === 'declining' ? 'declining' : 'stable',
          reason: subject.trend === 'declining'
            ? `Declining performance (${subject.growthRate.toFixed(1)}% change)`
            : `Below average performance (${subject.currentScore}%)`,
          priority
        })
      }
    })

    return { strengths, focusAreas }
  } catch (error) {
    console.error('Error identifying strengths and focus areas:', error)
    return { strengths: [], focusAreas: [] }
  }
}

/**
 * Generate automated insights
 */
export async function generateAcademicInsights(
  studentId: string
): Promise<AcademicInsight[]> {
  try {
    const insights: AcademicInsight[] = []
    
    // Get trend analysis
    const trend = await detectTrend(studentId)
    const growthRates = await calculateSubjectGrowthRates(studentId)
    const { strengths, focusAreas } = await identifyStrengthsAndFocusAreas(studentId)
    const weeklyChanges = await calculateWeeklyPerformanceChanges(studentId, 4)
    
    // Debug logging
    console.log(`[generateAcademicInsights] Student: ${studentId}`)
    console.log(`[generateAcademicInsights] Growth rates: ${growthRates.length}`)
    console.log(`[generateAcademicInsights] Strengths: ${strengths.length}`)
    console.log(`[generateAcademicInsights] Focus areas: ${focusAreas.length}`)
    console.log(`[generateAcademicInsights] Weekly changes: ${weeklyChanges.length}`)

    // Overall trend insight
    if (trend.overallTrend === 'improving' && trend.confidence > 0.5) {
      insights.push({
        type: 'improving',
        category: 'overall',
        title: 'Overall Performance Improving',
        message: `Performance is trending upward with an average weekly increase of ${trend.averageWeeklyChange.toFixed(1)}%. This positive momentum suggests effective learning strategies.`,
        confidence: trend.confidence,
        actionable: false
      })
    } else if (trend.overallTrend === 'declining' && trend.confidence > 0.5) {
      insights.push({
        type: 'needs_attention',
        category: 'overall',
        title: 'Performance Needs Attention',
        message: `Performance is declining with an average weekly decrease of ${Math.abs(trend.averageWeeklyChange).toFixed(1)}%. Consider reviewing study habits and seeking additional support.`,
        confidence: trend.confidence,
        actionable: true,
        recommendation: 'Schedule a meeting with teachers to discuss support strategies'
      })
    } else if (trend.overallTrend === 'stable' && weeklyChanges.length >= 2) {
      // Show insight for stable performance
      const avgScore = weeklyChanges.reduce((sum, w) => sum + w.score, 0) / weeklyChanges.length
      if (avgScore >= 75) {
        insights.push({
          type: 'stable',
          category: 'overall',
          title: 'Consistent Performance',
          message: `Performance has remained stable with an average score of ${avgScore.toFixed(1)}%. Maintaining consistent performance is a positive indicator.`,
          confidence: 0.7,
          actionable: false
        })
      }
    }

    // Subject-specific insights
    growthRates.forEach(subject => {
      // Show insights for any improvement > 2%
      if (subject.trend === 'improving' && subject.growthRate > 2) {
        insights.push({
          type: 'improving',
          category: 'subject',
          title: `${subject.subject} Showing Growth`,
          message: `${subject.subject} has improved by ${subject.growthRate.toFixed(1)}% over recent assessments. This indicates effective learning in this area.`,
          subject: subject.subject,
          confidence: Math.min(0.9, 0.6 + (subject.growthRate / 20)),
          actionable: false
        })
      } else if (subject.trend === 'declining' && subject.growthRate < -2) {
        insights.push({
          type: 'warning',
          category: 'subject',
          title: `${subject.subject} Needs Focus`,
          message: `${subject.subject} has declined by ${Math.abs(subject.growthRate).toFixed(1)}%. Additional practice and support may be beneficial.`,
          subject: subject.subject,
          confidence: 0.75,
          actionable: true,
          recommendation: `Focus on ${subject.subject} with targeted practice sessions`
        })
      } else if (subject.currentScore >= 85 && subject.trend !== 'declining') {
        // Show insight for strong performance even without high growth
        insights.push({
          type: 'excellent',
          category: 'subject',
          title: `Strong Performance in ${subject.subject}`,
          message: `${subject.subject} is performing well with a score of ${subject.currentScore.toFixed(1)}%. Keep up the excellent work!`,
          subject: subject.subject,
          confidence: 0.85,
          actionable: false
        })
      }
    })

    // Strength insights - add for all strengths (not just the top one)
    strengths.forEach(strength => {
      // Only add if we haven't already added an insight for this subject
      const existingInsight = insights.find(i => i.subject === strength.subject)
      if (!existingInsight) {
        insights.push({
          type: 'excellent',
          category: 'subject',
          title: `Strong Performance in ${strength.subject}`,
          message: `${strength.subject} is a strength area with a score of ${strength.score.toFixed(1)}% and ${strength.trend === 'improving' ? 'improving' : 'stable'} performance.`,
          subject: strength.subject,
          confidence: 0.9,
          actionable: false
        })
      }
    })

    // Focus area insights - show medium and high priority
    focusAreas.forEach(area => {
      // Only add if we haven't already added an insight for this subject
      const existingInsight = insights.find(i => i.subject === area.subject)
      if (!existingInsight && (area.priority === 'high' || area.priority === 'medium')) {
        insights.push({
          type: area.priority === 'high' ? 'needs_attention' : 'warning',
          category: 'subject',
          title: area.priority === 'high' ? `Priority Focus: ${area.subject}` : `${area.subject} Needs Improvement`,
          message: `${area.subject} requires attention with a score of ${area.score.toFixed(1)}% and ${area.trend} trend. ${area.reason}`,
          subject: area.subject,
          confidence: area.priority === 'high' ? 0.85 : 0.75,
          actionable: true,
          recommendation: `Create a focused study plan for ${area.subject} with regular check-ins`
        })
      }
    })

    // Weekly momentum insight
    if (weeklyChanges.length >= 2) {
      const recentChange = weeklyChanges[weeklyChanges.length - 1].change
      if (recentChange > 2) {
        insights.push({
          type: 'improving',
          category: 'trend',
          title: 'Strong Weekly Momentum',
          message: `This week showed an improvement of ${recentChange.toFixed(1)}% compared to last week. Keep up the excellent work!`,
          confidence: 0.8,
          actionable: false
        })
      }
    }
    
    // Always add subject-specific insights if we have growth rates
    if (growthRates.length > 0) {
      const subjectInsightsCount = insights.filter(i => i.category === 'subject').length
      
      // Always ensure we have at least 2-3 subject insights
      if (subjectInsightsCount < 3) {
        // Sort by score and add insights for top subjects
        const sortedSubjects = [...growthRates].sort((a, b) => b.currentScore - a.currentScore)
        const topSubjects = sortedSubjects.slice(0, Math.min(3, sortedSubjects.length))
        
        topSubjects.forEach(subject => {
          // Skip if we already have an insight for this subject
          const existingInsight = insights.find(i => i.subject === subject.subject)
          if (existingInsight) return
          
          // Always add an insight for subjects with scores >= 70
          if (subject.currentScore >= 80) {
            insights.push({
              type: 'excellent',
              category: 'subject',
              title: `Strong Performance in ${subject.subject}`,
              message: `${subject.subject} is performing well with a score of ${subject.currentScore.toFixed(1)}%. ${subject.trend === 'improving' ? 'Performance is improving.' : 'Keep up the great work!'}`,
              subject: subject.subject,
              confidence: 0.85,
              actionable: false
            })
          } else if (subject.currentScore >= 70) {
            insights.push({
              type: 'stable',
              category: 'subject',
              title: `${subject.subject} Performance`,
              message: `${subject.subject} has a score of ${subject.currentScore.toFixed(1)}%. ${subject.trend === 'improving' ? 'Performance is improving.' : 'Maintaining steady progress.'}`,
              subject: subject.subject,
              confidence: 0.7,
              actionable: false
            })
          }
        })
      }
    }

    // Final fallback: if we have very few insights, generate from performance metrics
    if (insights.length <= 1) {
      try {
        const PerformanceService = await import('./performanceService')
        const metrics = await PerformanceService.getPerformanceMetrics(studentId)
        
        if (metrics && metrics.subjectBreakdown && metrics.subjectBreakdown.length > 0) {
          const topSubjects = [...metrics.subjectBreakdown]
            .filter(s => s.score != null && s.score > 0)
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, Math.min(3, metrics.subjectBreakdown.length))
          
          topSubjects.forEach(subject => {
            const existingInsight = insights.find(i => i.subject === subject.subject)
            if (existingInsight) return
            
            if (subject.score && subject.score >= 80) {
              insights.push({
                type: 'excellent',
                category: 'subject',
                title: `Strong Performance in ${subject.subject}`,
                message: `${subject.subject} is performing well with a score of ${subject.score.toFixed(1)}%. Keep up the excellent work!`,
                subject: subject.subject,
                confidence: 0.85,
                actionable: false
              })
            } else if (subject.score && subject.score >= 70) {
              insights.push({
                type: 'stable',
                category: 'subject',
                title: `${subject.subject} Performance`,
                message: `${subject.subject} has a score of ${subject.score.toFixed(1)}%. Maintaining steady progress.`,
                subject: subject.subject,
                confidence: 0.7,
                actionable: false
              })
            }
          })
        }
      } catch (fallbackError) {
        console.error('[generateAcademicInsights] Error in fallback insight generation:', fallbackError)
      }
    }

    return insights.sort((a, b) => {
      // Sort by priority: needs_attention > warning > improving > excellent > stable
      const priority = { 'needs_attention': 5, 'warning': 4, 'improving': 3, 'excellent': 2, 'stable': 1 }
      return (priority[b.type] || 0) - (priority[a.type] || 0)
    })
  } catch (error) {
    console.error('Error generating academic insights:', error)
    return []
  }
}

// Helper function to get week key (YYYY-WW format)
function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // Start of week (Sunday)
  const year = d.getFullYear()
  const week = Math.ceil((d.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${year}-W${week.toString().padStart(2, '0')}`
}

