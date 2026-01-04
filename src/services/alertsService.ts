// Alerts Service - Updated to use real API
import { apiClient } from '../utils/apiClient'

export interface Alert {
  _id: string
  type: 'performance' | 'engagement' | 'attendance' | 'deadline' | 'achievement'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  studentId: string
  timestamp: string
  read: boolean
  actionRequired: boolean
  metadata?: Record<string, any>
}

export interface AlertRule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
}

/**
 * Fetch alerts for a student
 */
export async function fetchAlerts(studentId: string): Promise<Alert[]> {
  try {
    const response = await apiClient.get<{
      success: boolean
      count: number
      unreadCount?: number
      data: Alert[]
    }>(`/alerts/student/${studentId}`)
    return response.data || []
  } catch (error) {
    console.error('Error fetching alerts:', error)
    throw error
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  try {
    await apiClient.patch(`/alerts/${alertId}/read`)
  } catch (error) {
    console.error('Error marking alert as read:', error)
    throw error
  }
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<void> {
  try {
    await apiClient.delete(`/alerts/${alertId}`)
  } catch (error) {
    console.error('Error deleting alert:', error)
    throw error
  }
}

/**
 * Create a new alert
 */
export async function createAlert(alertData: {
  type: Alert['type']
  priority: Alert['priority']
  title: string
  message: string
  studentId: string
  actionRequired?: boolean
  metadata?: Record<string, any>
}): Promise<Alert> {
  try {
    const response = await apiClient.post<{ success: boolean; data: Alert }>(
      '/alerts',
      alertData
    )
    return response.data
  } catch (error) {
    console.error('Error creating alert:', error)
    throw error
  }
}

/**
 * Fetch alert rules
 */
export async function fetchAlertRules(): Promise<AlertRule[]> {
  try {
    const response = await apiClient.get<AlertRule[]>('/alerts/rules')
    return Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error fetching alert rules:', error)
    return []
  }
}
