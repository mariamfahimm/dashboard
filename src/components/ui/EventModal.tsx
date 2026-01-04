// Event Details Modal Component
import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { HiX, HiClock, HiLocationMarker, HiBell, HiCalendar } from 'react-icons/hi'

interface Event {
  _id: string
  title: string
  description?: string
  type: 'assignment' | 'exam' | 'holiday' | 'school_event' | 'meeting' | 'deadline' | 'reminder'
  startDate: string
  endDate?: string
  allDay: boolean
  location?: string
  reminders?: Array<{
    time: string
    method: 'notification' | 'email' | 'sms'
    sent: boolean
  }>
  color?: string
  priority: 'low' | 'normal' | 'high'
  createdBy: {
    userId: string
    name: string
    role: 'parent' | 'teacher' | 'admin'
  }
}

interface EventModalProps {
  event: Event | null
  onClose: () => void
  onEdit?: (event: Event) => void
  onDelete?: (eventId: string) => void
  canEdit?: boolean
}

const getEventTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    assignment: '📝',
    exam: '📋',
    holiday: '🎉',
    school_event: '🏫',
    meeting: '👥',
    deadline: '⏰',
    reminder: '🔔'
  }
  return icons[type] || '📅'
}

const getEventTypeLabel = (type: string) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function EventModal({ event, onClose, onEdit, onDelete, canEdit = false }: EventModalProps) {
  if (!event) return null

  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4 flex-1">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ backgroundColor: event.color || '#3b82f6' }}
            >
              {getEventTypeIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" size="sm">
                  {getEventTypeLabel(event.type)}
                </Badge>
                {event.priority === 'high' && (
                  <Badge variant="error" size="sm">High Priority</Badge>
                )}
                {event.priority === 'low' && (
                  <Badge variant="default" size="sm">Low Priority</Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <HiX className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <HiCalendar className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">Date & Time</div>
              <div className="text-slate-900 font-semibold">
                {formatDate(startDate)}
              </div>
              {!event.allDay && (
                <div className="text-sm text-slate-600 mt-1">
                  {formatTime(startDate)}
                  {endDate && ` - ${formatTime(endDate)}`}
                </div>
              )}
              {event.allDay && (
                <div className="text-sm text-slate-600 mt-1">All Day</div>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <HiLocationMarker className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-500 mb-1">Location</div>
                <div className="text-slate-900 font-semibold">{event.location}</div>
              </div>
            </div>
          )}

          {/* Reminders */}
          {event.reminders && event.reminders.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <HiBell className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-500 mb-2">Reminders</div>
                <div className="space-y-1">
                  {event.reminders.map((reminder, idx) => (
                    <div key={idx} className="text-sm text-slate-700">
                      {new Date(reminder.time).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} ({reminder.method})
                      {reminder.sent && (
                        <span className="ml-2 text-xs text-emerald-600">✓ Sent</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                {event.createdBy.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">Created By</div>
              <div className="text-slate-900 font-semibold">{event.createdBy.name}</div>
              <div className="text-xs text-slate-500 capitalize">{event.createdBy.role}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (onEdit || onDelete) && (
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            {onEdit && (
              <Button
                variant="primary"
                onClick={() => {
                  onEdit(event)
                  onClose()
                }}
              >
                Edit Event
              </Button>
            )}
            {onDelete && (
              <Button
                variant="error"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this event?')) {
                    onDelete(event._id)
                    onClose()
                  }
                }}
              >
                Delete Event
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

