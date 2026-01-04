// Alert Card Component
import React from 'react'
import { useAlerts } from '@/hooks/useAlerts'
import { getRiskColor } from '@/utils/riskScoring'
import type { AlertType, AlertPriority } from '@/services/alertsService'

const alertIcons: Record<AlertType, string> = {
  performance: '📊',
  engagement: '📈',
  attendance: '📅',
  deadline: '⏰',
  achievement: '🎉'
}

const priorityColors: Record<AlertPriority, string> = {
  low: 'bg-slate-50 border-slate-200 text-slate-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  critical: 'bg-rose-50 border-rose-200 text-rose-700'
}

interface AlertCardProps {
  studentId: string
  maxAlerts?: number
}

export function AlertCard({ studentId, maxAlerts = 5 }: AlertCardProps) {
  const { alerts, unreadCount, criticalAlerts, loading, error, markAsRead, removeAlert } = useAlerts(studentId)

  if (loading) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="text-sm text-slate-500">Loading alerts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="text-sm text-rose-600">Error: {error}</div>
      </div>
    )
  }

  const displayedAlerts = alerts.slice(0, maxAlerts)
  const hasUnread = unreadCount > 0

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Alerts</h3>
        {hasUnread && (
          <div className="text-xs px-2 py-1 rounded-full bg-rose-500 text-white">
            {unreadCount} new
          </div>
        )}
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200">
          <div className="text-sm font-medium text-rose-800 mb-1">
            ⚠️ {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
          </div>
          <div className="text-xs text-rose-600">
            Immediate attention required
          </div>
        </div>
      )}

      {/* Alerts List */}
      {displayedAlerts.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8">
          No alerts at this time
        </div>
      ) : (
        <div className="grid gap-3">
          {displayedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border ${
                alert.read 
                  ? 'bg-slate-50 border-slate-200' 
                  : priorityColors[alert.priority]
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{alertIcons[alert.type]}</span>
                  <div>
                    <div className="text-sm font-medium">{alert.title}</div>
                    {!alert.read && (
                      <div className="h-2 w-2 rounded-full bg-brand-500 mt-1" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    alert.priority === 'critical' ? 'bg-rose-500 text-white' :
                    alert.priority === 'high' ? 'bg-orange-500 text-white' :
                    alert.priority === 'medium' ? 'bg-amber-500 text-white' :
                    'bg-slate-400 text-white'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-slate-600 mb-2">{alert.message}</div>
              
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-500">
                  {new Date(alert.timestamp).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  {!alert.read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length > maxAlerts && (
        <div className="mt-4 text-center">
          <button className="text-xs text-brand-600 hover:text-brand-700">
            View all {alerts.length} alerts →
          </button>
        </div>
      )}
    </div>
  )
}

