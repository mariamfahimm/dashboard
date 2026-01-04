// Alerts Controller
import { Request, Response } from 'express'
import {
  getAlerts,
  createAlert,
  markAlertAsRead,
  deleteAlert,
  getAlertRules,
  generateAlerts
} from '../services/alertsService'

/**
 * GET /api/alerts/:studentId
 * Get all alerts for a student
 */
export async function getStudentAlerts(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    const alerts = await getAlerts(studentId)
    res.json(alerts)
  } catch (error) {
    console.error('Error in getStudentAlerts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/alerts
 * Create a new alert
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const alertData = req.body
    
    if (!alertData.studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    const alert = await createAlert(alertData)
    res.status(201).json(alert)
  } catch (error) {
    console.error('Error in create:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * PATCH /api/alerts/:alertId/read
 * Mark alert as read
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { alertId } = req.params
    const { studentId } = req.body
    
    if (!alertId || !studentId) {
      res.status(400).json({ error: 'Alert ID and Student ID are required' })
      return
    }
    
    await markAlertAsRead(alertId, studentId)
    res.json({ message: 'Alert marked as read' })
  } catch (error) {
    console.error('Error in markAsRead:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/alerts/:alertId
 * Delete an alert
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { alertId } = req.params
    const { studentId } = req.query
    
    if (!alertId || !studentId) {
      res.status(400).json({ error: 'Alert ID and Student ID are required' })
      return
    }
    
    await deleteAlert(alertId, studentId as string)
    res.json({ message: 'Alert deleted' })
  } catch (error) {
    console.error('Error in remove:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/alerts/rules
 * Get alert rules
 */
export async function getRules(req: Request, res: Response): Promise<void> {
  try {
    const rules = await getAlertRules()
    res.json(rules)
  } catch (error) {
    console.error('Error in getRules:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/alerts/:studentId/generate
 * Auto-generate alerts for a student
 */
export async function generate(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params
    
    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required' })
      return
    }
    
    const alerts = await generateAlerts(studentId)
    res.json({ generated: alerts.length, alerts })
  } catch (error) {
    console.error('Error in generate:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

