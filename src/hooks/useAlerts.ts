// Alerts Hook - Updated to use real API
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../utils/apiClient'
import type { Alert } from '../services/alertsService'

export function useAlerts(studentId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAlerts = useCallback(async () => {
    if (!studentId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get<any>(`/alerts/student/${studentId}`)
      const alertsData = Array.isArray(response) ? response : (response.data || [])
      setAlerts(alertsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await apiClient.patch(`/alerts/${alertId}/read`, {})
      setAlerts(prev => 
        prev.map(alert => 
          alert._id === alertId ? { ...alert, read: true } : alert
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadAlerts = alerts.filter(a => !a.read)
      await Promise.all(unreadAlerts.map(alert => 
        apiClient.patch(`/alerts/${alert._id}/read`, {})
      ))
      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all alerts as read')
    }
  }, [alerts])

  const removeAlert = useCallback(async (alertId: string) => {
    try {
      await apiClient.delete(`/alerts/${alertId}`)
      setAlerts(prev => prev.filter(alert => alert._id !== alertId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert')
    }
  }, [])

  const unreadCount = alerts.filter(a => !a.read).length
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' && !a.read)

  return {
    alerts,
    unreadCount,
    criticalAlerts,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeAlert,
    refresh: loadAlerts
  }
}

