// Notifications & Alerts Center - Beautiful UI for all notifications
import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../hooks/useAlerts'
import type { Alert } from '../services/alertsService'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/EmptyState'

interface NotificationsCenterProps {
  selectedStudentId?: string | null
  t: (key: string) => string
}

export function NotificationsCenter({ selectedStudentId, t }: NotificationsCenterProps) {
  const { user } = useAuth()
  const { alerts, loading, error, refresh, markAsRead, markAllAsRead } = useAlerts(selectedStudentId || undefined)
  const [filter, setFilter] = useState<'all' | 'unread' | 'performance' | 'attendance' | 'deadline' | 'achievement'>('all')
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)

  const filteredAlerts = useMemo(() => {
    if (!alerts) return []
    
    let filtered = alerts
    
    if (filter === 'unread') {
      filtered = filtered.filter(a => !a.read)
    } else if (filter !== 'all') {
      filtered = filtered.filter(a => a.type === filter)
    }
    
    return filtered.sort((a, b) => {
      // Unread first
      if (a.read !== b.read) return a.read ? 1 : -1
      // Then by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [alerts, filter])

  const unreadCount = alerts?.filter(a => !a.read).length || 0
  const countsByType = useMemo(() => {
    if (!alerts) return {}
    return {
      performance: alerts.filter(a => a.type === 'performance' && !a.read).length,
      attendance: alerts.filter(a => a.type === 'attendance' && !a.read).length,
      deadline: alerts.filter(a => a.type === 'deadline' && !a.read).length,
      achievement: alerts.filter(a => a.type === 'achievement' && !a.read).length,
    }
  }, [alerts])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'performance': return '📊'
      case 'attendance': return '📅'
      case 'deadline': return '⏰'
      case 'achievement': return '🎉'
      case 'engagement': return '📈'
      default: return '🔔'
    }
  }

  const getAlertColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'error'
    if (priority === 'high') return 'warning'
    if (type === 'achievement') return 'success'
    return 'info'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🔔</span>
          </div>
          <p className="text-slate-600">{t('loadingNotifications')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Notifications</h1>
              <p className="text-slate-600">
                {unreadCount > 0 
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up! No new notifications.'
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={async () => {
                  await markAllAsRead()
                  refresh()
                }}
              >
                Mark All Read
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All', count: alerts?.length || 0 },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'performance', label: 'Performance', count: countsByType.performance },
              { key: 'attendance', label: 'Attendance', count: countsByType.attendance },
              { key: 'deadline', label: 'Deadlines', count: countsByType.deadline },
              { key: 'achievement', label: 'Achievements', count: countsByType.achievement },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`
                  px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200
                  ${filter === tab.key
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-soft'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`
                    ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                    ${filter === tab.key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-brand-100 text-brand-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {error ? (
          <Card className="text-center p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Notifications</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={refresh}>Retry</Button>
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card className="text-center p-12">
            <EmptyState
              icon="🔔"
              title={filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              message={
                filter === 'unread' 
                  ? 'You\'re all caught up! No unread notifications.'
                  : 'No notifications match your current filter.'
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert._id}
                hover
                className={`
                  relative overflow-hidden border-l-4 transition-all duration-300
                  ${!alert.read 
                    ? 'border-l-brand-500 bg-brand-50/50 shadow-md' 
                    : 'border-l-transparent hover:border-l-slate-300'
                  }
                  ${selectedAlert === alert._id ? 'ring-2 ring-brand-500' : ''}
                `}
                onClick={() => {
                  setSelectedAlert(selectedAlert === alert._id ? null : alert._id)
                  if (!alert.read) {
                    markAsRead(alert._id)
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center text-2xl
                    ${!alert.read 
                      ? 'bg-brand-100 text-brand-600' 
                      : 'bg-slate-100 text-slate-600'
                    }
                    transition-colors
                  `}>
                    {getAlertIcon(alert.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`
                            font-semibold text-lg
                            ${!alert.read ? 'text-slate-900' : 'text-slate-700'}
                          `}>
                            {alert.title}
                          </h3>
                          {!alert.read && (
                            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed mb-3">
                          {alert.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getAlertColor(alert.type, alert.priority)} size="sm">
                          {alert.priority}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {alert.type}
                        </Badge>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedAlert === alert._id && alert.metadata && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                        {Object.entries(alert.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500 capitalize">{key}:</span>
                            <span className="text-slate-700 font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {new Date(alert.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {alert.actionRequired && (
                        <Badge variant="error" size="sm">Action Required</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

