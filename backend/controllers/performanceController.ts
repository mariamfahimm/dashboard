// Performance Controller
import { Request, Response } from 'express'
import {
  getPerformanceMetrics,
  getPerformanceInsights,
  calculateRiskScore
} from '../services/performanceService'

/**
 * GET /api/performance/:studentId
 * Get performance metrics for a student
 */
export async function getPerformance(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    const Student = (await import('../models/Student')).default
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    // Support both MongoDB _id and studentId field
    const student = await Student.findOne({ 
      $or: [{ _id: studentId }, { studentId: studentId }] 
    })
    
    if (!student) {
      res.status(404).json({ error: 'Student not found' })
      return
    }
    
    const studentMongoId = String(student._id)
    const metrics = await getPerformanceMetrics(studentMongoId)
    
    if (!metrics) {
      res.status(404).json({ error: 'Performance metrics not found' })
      return
    }
    
    res.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error in getPerformance:', error)
    res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

/**
 * GET /api/performance/:studentId/insights
 * Get AI-generated performance insights
 */
export async function getInsights(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    const Student = (await import('../models/Student')).default
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    // Support both MongoDB _id and studentId field
    const student = await Student.findOne({ 
      $or: [{ _id: studentId }, { studentId: studentId }] 
    })
    
    if (!student) {
      res.status(404).json({ error: 'Student not found' })
      return
    }
    
    const studentMongoId = String(student._id)
    const insights = await getPerformanceInsights(studentMongoId)
    res.json({ success: true, data: insights })
  } catch (error) {
    console.error('Error in getInsights:', error)
    res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

/**
 * GET /api/performance/:studentId/risk
 * Get risk score for a student
 */
export async function getRiskScore(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    const riskScore = await calculateRiskScore(studentId)
    res.json({ studentId, riskScore })
  } catch (error) {
    console.error('Error in getRiskScore:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

