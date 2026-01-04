// Recommendation Service - Rule-based recommendations from analytics
import Student, { IStudent } from '../models/Student'
import { generateAcademicInsights } from './analyticsEngine'
import { detectTrend } from './analyticsEngine'
import { identifyStrengthsAndFocusAreas } from './analyticsEngine'
import Recommendation from '../models/Recommendation'

export type RecommendationCategory = 
  | 'study_plan' 
  | 'resource' 
  | 'activity' 
  | 'goal' 
  | 'intervention'

export interface Recommendation {
  id: string
  category: RecommendationCategory
  title: string
  description: string
  priority: number
  confidence: number
  studentId: string
  reasoning: string
  actionUrl?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface RecommendationContext {
  studentId: string
  currentPerformance: number
  engagementLevel: number
  recentActivity: string[]
  learningGoals: string[]
}

// Note: Recommendations are now stored in database via Recommendation model

/**
 * Generate rule-based recommendations from analytics
 */
export async function generateRecommendations(
  context: RecommendationContext
): Promise<Recommendation[]> {
  try {
    // Find student
    const student = await Student.findOne({ studentId: context.studentId })
    if (!student) {
      return []
    }

    const recommendations: Recommendation[] = []

    // Get analytics insights
    const insights = await generateAcademicInsights(String(student._id))
    const trend = await detectTrend(String(student._id))
    const { strengths, focusAreas } = await identifyStrengthsAndFocusAreas(String(student._id))

    // Rule 1: Declining trend → Recommend intervention
    if (trend.overallTrend === 'declining' && trend.confidence > 0.7) {
      const avgScore = student.performance?.overallScore || 0
      if (avgScore < 70) {
        recommendations.push({
          id: `rec-${Date.now()}-1`,
          category: 'intervention',
          title: 'Consider Additional Support',
          description: `Performance is declining (${trend.averageWeeklyChange.toFixed(1)}% weekly decrease). Consider scheduling a meeting with teachers or seeking tutoring support.`,
          priority: 10,
          confidence: trend.confidence,
          studentId: context.studentId,
          reasoning: `Declining trend detected with ${(trend.confidence * 100).toFixed(0)}% confidence. Current average: ${avgScore.toFixed(1)}%`,
          metadata: { trend: 'declining', avgScore, weeklyChange: trend.averageWeeklyChange },
          createdAt: new Date().toISOString()
        })
      }
    }

    // Rule 2: Focus areas → Recommend study plan
    focusAreas.forEach((area, index) => {
      if (area.priority === 'high' || area.priority === 'medium') {
        recommendations.push({
          id: `rec-${Date.now()}-${index + 2}`,
          category: 'study_plan',
          title: `Focus on ${area.subject}`,
          description: `${area.subject} needs attention (${area.score.toFixed(1)}% average). Create a focused study plan with regular practice sessions.`,
          priority: area.priority === 'high' ? 9 : 7,
          confidence: 0.8,
          studentId: context.studentId,
          reasoning: area.reason,
          metadata: { subject: area.subject, score: area.score, priority: area.priority },
          createdAt: new Date().toISOString()
        })
      }
    })

    // Rule 3: Improving trend → Recommend goal setting
    if (trend.overallTrend === 'improving' && trend.confidence > 0.7) {
      recommendations.push({
        id: `rec-${Date.now()}-goal`,
        category: 'goal',
        title: 'Set Ambitious Goal',
        description: `You're showing strong improvement! Consider setting a challenging goal to maintain this momentum.`,
        priority: 6,
        confidence: trend.confidence,
        studentId: context.studentId,
        reasoning: `Improving trend with ${trend.averageWeeklyChange.toFixed(1)}% weekly increase`,
        metadata: { trend: 'improving', weeklyChange: trend.averageWeeklyChange },
        createdAt: new Date().toISOString()
      })
    }

    // Rule 4: Strengths → Recommend leveraging
    if (strengths.length > 0) {
      const topStrength = strengths[0]
      recommendations.push({
        id: `rec-${Date.now()}-strength`,
        category: 'activity',
        title: `Leverage Your Strength in ${topStrength.subject}`,
        description: `${topStrength.subject} is a strong area (${topStrength.score.toFixed(1)}%). Consider helping peers or exploring advanced topics.`,
        priority: 5,
        confidence: 0.75,
        studentId: context.studentId,
        reasoning: `Strong performance in ${topStrength.subject} with ${topStrength.trend} trend`,
        metadata: { subject: topStrength.subject, score: topStrength.score },
        createdAt: new Date().toISOString()
      })
    }

    // Rule 5: Low engagement → Recommend resources
    const engagement = student.engagement?.currentEngagement || 0
    if (engagement < 50) {
      recommendations.push({
        id: `rec-${Date.now()}-engagement`,
        category: 'resource',
        title: 'Explore Interactive Learning Resources',
        description: `Your engagement level is ${engagement.toFixed(0)}%. Try interactive learning tools and gamified exercises to boost participation.`,
        priority: 8,
        confidence: 0.7,
        studentId: context.studentId,
        reasoning: `Low engagement detected: ${engagement.toFixed(0)}%`,
        metadata: { engagementLevel: engagement },
        createdAt: new Date().toISOString()
      })
    }

    // Save recommendations to database
    const recommendationDocs = await Promise.all(
      recommendations.map(rec => 
        Recommendation.create({
          category: rec.category,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          confidence: rec.confidence,
          studentId: rec.studentId,
          reasoning: rec.reasoning,
          actionUrl: rec.actionUrl,
          metadata: rec.metadata,
          accepted: false,
          dismissed: false
        })
      )
    )

    return recommendationDocs.map(doc => ({
      id: String(doc._id),
      category: doc.category as RecommendationCategory,
      title: doc.title,
      description: doc.description,
      priority: doc.priority,
      confidence: doc.confidence,
      studentId: doc.studentId,
      reasoning: doc.reasoning,
      actionUrl: doc.actionUrl,
      metadata: doc.metadata,
      createdAt: doc.createdAt.toISOString()
    }))
  } catch (error) {
    console.error('Error generating recommendations:', error)
    throw error
  }
}

/**
 * Get recommendations for a student from database
 */
export async function getRecommendations(studentId: string): Promise<Recommendation[]> {
  try {
    // Find student to get MongoDB _id
    const student = await Student.findOne({ studentId })
    if (!student) {
      return []
    }

    // Query recommendations from database
    const recommendations = await Recommendation.find({ 
      studentId: String(student._id),
      dismissed: false 
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(10)

    return recommendations.map(doc => ({
      id: String(doc._id),
      category: doc.category as RecommendationCategory,
      title: doc.title,
      description: doc.description,
      priority: doc.priority,
      confidence: doc.confidence,
      studentId: doc.studentId,
      reasoning: doc.reasoning,
      actionUrl: doc.actionUrl,
      metadata: doc.metadata,
      createdAt: doc.createdAt.toISOString()
    }))
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    throw error
  }
}

/**
 * Mark recommendation as accepted
 */
export async function acceptRecommendation(
  recommendationId: string,
  studentId: string
): Promise<void> {
  try {
    // Find student to get MongoDB _id
    const student = await Student.findOne({ studentId })
    if (!student) {
      throw new Error('Student not found')
    }

    await Recommendation.updateOne(
      { _id: recommendationId, studentId: String(student._id) },
      { accepted: true, dismissed: false }
    )
  } catch (error) {
    console.error('Error accepting recommendation:', error)
    throw error
  }
}

/**
 * Mark recommendation as dismissed
 */
export async function dismissRecommendation(
  recommendationId: string,
  studentId: string
): Promise<void> {
  try {
    // Find student to get MongoDB _id
    const student = await Student.findOne({ studentId })
    if (!student) {
      throw new Error('Student not found')
    }

    await Recommendation.updateOne(
      { _id: recommendationId, studentId: String(student._id) },
      { dismissed: true, accepted: false }
    )
  } catch (error) {
    console.error('Error dismissing recommendation:', error)
    throw error
  }
}

/**
 * Get recommendation effectiveness
 * TODO: Implement effectiveness tracking
 */
export async function getRecommendationEffectiveness(
  recommendationId: string,
  studentId: string
): Promise<{ accepted: boolean; impact: number; feedback?: string } | null> {
  try {
    // TODO: Query effectiveness data from database
    // const effectiveness = await RecommendationEffectiveness.findOne({
    //   recommendationId,
    //   studentId
    // })
    
    return {
      accepted: true,
      impact: 0.15, // 15% improvement
      feedback: 'Student showed improved engagement after following this recommendation'
    }
  } catch (error) {
    console.error('Error fetching recommendation effectiveness:', error)
    throw error
  }
}

