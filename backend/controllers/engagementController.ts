// Engagement Controller
import { Request, Response } from 'express'
import {
  getEngagementMetrics,
  predictEngagement,
  getEngagementInsights
} from '../services/engagementService'

/**
 * GET /api/engagement/:studentId
 * Get engagement metrics for a student
 */
export async function getEngagement(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    const metrics = await getEngagementMetrics(studentId)
    
    if (!metrics) {
      res.status(404).json({ error: 'Student not found' })
      return
    }
    
    res.json(metrics)
  } catch (error) {
    console.error('Error in getEngagement:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/engagement/:studentId/predict
 * Predict future engagement
 * Query params: ?timeframe=daily|weekly|monthly
 */
export async function predict(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    const timeframe = (req.query.timeframe as 'daily' | 'weekly' | 'monthly') || 'weekly'
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    if (!['daily', 'weekly', 'monthly'].includes(timeframe)) {
      res.status(400).json({ error: 'Invalid timeframe. Use: daily, weekly, or monthly' })
      return
    }
    
    const prediction = await predictEngagement(studentId, timeframe)
    res.json(prediction)
  } catch (error) {
    console.error('Error in predict:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/engagement/:studentId/insights
 * Get engagement insights
 */
export async function getInsights(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    const insights = await getEngagementInsights(studentId)
    res.json(insights)
  } catch (error) {
    console.error('Error in getInsights:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

