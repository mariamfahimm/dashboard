// Enhanced Calendar Page - With Events, Types, Reminders, and Details
import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAssignments } from '../hooks/useAssignments'
import { useEvents } from '../hooks/useEvents'
import { useAllAssignmentCompletions } from '../hooks/useAssignmentCompletion'
import { useStudents } from '../hooks/useStudents'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/EmptyState'
import { EventModal } from '../components/ui/EventModal'
import { ExamCountdown } from '../components/ui/ExamCountdown'
import { StudyLoadIndicator } from '../components/ui/StudyLoadIndicator'
import { useGradeMode } from '../context/GradeModeContext'
import type { Event } from '../services/api/eventsApi'
import { HiFilter } from 'react-icons/hi'

// Helper function to get default color for event type
function getDefaultColor(type: string): string {
  const colorMap: Record<string, string> = {
    assignment: '#f59e0b', // amber
    exam: '#ef4444', // red
    holiday: '#10b981', // green
    school_event: '#3b82f6', // blue
    meeting: '#8b5cf6', // purple
    deadline: '#f97316', // orange
    reminder: '#6366f1' // indigo
  }
  return colorMap[type] || '#3b82f6'
}

interface CalendarPageProps {
  selectedStudentId?: string | null
  t: (key: string) => string
  locale: string
}

interface CalendarItem {
  id: string
  title: string
  date: Date
  type: 'assignment' | 'exam' | 'holiday' | 'school_event' | 'meeting' | 'deadline' | 'reminder'
  color: string
  priority?: 'low' | 'normal' | 'high'
  event?: Event
  assignment?: any
}

export function CalendarPage({ selectedStudentId, t, locale }: CalendarPageProps) {
  const { user } = useAuth()
  const { students } = useStudents(user?._id)
  const selectedStudent = students?.find(s => s._id === selectedStudentId) || students?.[0]
  const gradeLevel = selectedStudent?.gradeLevel || 5
  const { config: gradeConfig } = useGradeMode(selectedStudent?._id, gradeLevel)
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventFilter, setEventFilter] = useState<string>('all') // 'all' or specific type
  const [showFilters, setShowFilters] = useState(false)

  // Calculate date range for events
  const startDate = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    return new Date(year, month, 1).toISOString().split('T')[0]
  }, [selectedDate])

  const endDate = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, lastDay).toISOString().split('T')[0]
  }, [selectedDate])

  // Fetch data
  const { assignments, loading: assignmentsLoading } = useAssignments(selectedStudentId || undefined)
  const { events, loading: eventsLoading, refresh: refreshEvents } = useEvents({
    studentId: selectedStudentId || undefined,
    startDate,
    endDate,
    type: eventFilter !== 'all' ? eventFilter : undefined
  })
  const { predictions, loading: predictionsLoading, getPrediction } = useAllAssignmentCompletions(selectedStudentId || undefined)

  const loading = assignmentsLoading || eventsLoading || predictionsLoading

  // Combine assignments and events into calendar items
  const calendarItems = useMemo(() => {
    const items: CalendarItem[] = []

    // Add assignments
    if (assignments) {
      assignments.forEach(assignment => {
        if (assignment.dueDate) {
          const prediction = getPrediction(assignment._id)
          
          // Determine color based on risk level
          let color = '#f59e0b' // Default amber
          if (prediction) {
            switch (prediction.riskLevel) {
              case 'critical':
                color = '#dc2626' // red
                break
              case 'high':
                color = '#f97316' // orange
                break
              case 'medium':
                color = '#eab308' // yellow
                break
              case 'low':
                color = '#10b981' // green
                break
            }
          }
          
          items.push({
            id: assignment._id,
            title: assignment.title,
            date: new Date(assignment.dueDate),
            type: 'assignment',
            color,
            priority: prediction?.riskLevel === 'critical' || prediction?.riskLevel === 'high' ? 'high' : 'normal',
            assignment,
            prediction: prediction ? {
              riskLevel: prediction.riskLevel,
              probability: prediction.probability,
              riskScore: prediction.riskScore
            } : undefined
          })
        }
      })
    }

    // Add events
    if (events) {
      events.forEach(event => {
        items.push({
          id: event._id,
          title: event.title,
          date: new Date(event.startDate),
          type: event.type,
          color: event.color || getDefaultColor(event.type),
          priority: event.priority,
          event
        })
      })
    }

    return items.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [assignments, events])

  // Get items for selected month
  const monthItems = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    return calendarItems.filter(item => {
      const itemDate = item.date
      return itemDate.getFullYear() === year && itemDate.getMonth() === month
    })
  }, [calendarItems, selectedDate])

  // Group items by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {}
    monthItems.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0]
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(item)
    })
    return grouped
  }, [monthItems])

  // Extract exams for ExamCountdown component
  const exams = useMemo(() => {
    return calendarItems
      .filter(item => item.type === 'exam')
      .map(item => {
        // Extract subject from title (e.g., "Math Final Exam" -> "Math")
        // Or use the full title if no clear subject separator
        const titleWords = item.title.split(' ')
        const subject = titleWords.length > 1 && titleWords[0].length <= 15 
          ? titleWords[0] 
          : item.title
        
        return {
          id: item.id,
          title: item.title,
          subject: subject,
          date: item.date,
          weight: item.priority === 'high' ? 'high' as const : 
                  item.priority === 'low' ? 'low' as const : 
                  'medium' as const
        }
      })
  }, [calendarItems])

  // Calculate study load for current week
  const currentWeekStart = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek // Sunday = 0
    const weekStart = new Date(today)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }, [])

  const currentWeekEnd = useMemo(() => {
    const end = new Date(currentWeekStart)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }, [currentWeekStart])

  const weeklyStudyLoad = useMemo(() => {
    const weekAssignments = calendarItems.filter(item => {
      return item.date >= currentWeekStart && 
             item.date <= currentWeekEnd && 
             (item.type === 'assignment' || item.type === 'deadline')
    })

    const weekExams = calendarItems.filter(item => {
      return item.date >= currentWeekStart && 
             item.date <= currentWeekEnd && 
             item.type === 'exam'
    })

    return {
      assignments: weekAssignments.length,
      exams: weekExams.length,
      averageHoursPerAssignment: 2, // Average 2 hours per assignment
      averageHoursPerExam: 4 // Average 4 hours per exam prep
    }
  }, [calendarItems, currentWeekStart, currentWeekEnd])

  // Identify high-impact weeks (weeks with many assignments/exams)
  const highImpactWeeks = useMemo(() => {
    const weekMap = new Map<string, { assignments: number; exams: number; total: number }>()
    
    calendarItems.forEach(item => {
      if (item.type === 'assignment' || item.type === 'exam' || item.type === 'deadline') {
        const weekStart = new Date(item.date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        weekStart.setHours(0, 0, 0, 0)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { assignments: 0, exams: 0, total: 0 })
        }
        
        const week = weekMap.get(weekKey)!
        if (item.type === 'exam') {
          week.exams++
        } else {
          week.assignments++
        }
        week.total = week.assignments + week.exams * 2 // Exams count double
      }
    })

    // High impact = 5+ items or 3+ exams
    return Array.from(weekMap.entries())
      .filter(([_, data]) => data.total >= 5 || data.exams >= 3)
      .map(([weekKey, _]) => weekKey)
  }, [calendarItems])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: Array<{ 
      date: number
      isCurrentMonth: boolean
      isToday: boolean
      items: CalendarItem[]
      isHighImpactWeek: boolean
    }> = []
    
    // Helper to check if a date is in a high-impact week
    const isInHighImpactWeek = (date: Date): boolean => {
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekKey = weekStart.toISOString().split('T')[0]
      return highImpactWeeks.includes(weekKey)
    }
    
    // Previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      const dateKey = date.toISOString().split('T')[0]
      days.push({ 
        date: date.getDate(), 
        isCurrentMonth: false,
        isToday: false,
        items: itemsByDate[dateKey] || [],
        isHighImpactWeek: isInHighImpactWeek(date)
      })
    }
    
    // Current month
    const today = new Date()
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateKey = date.toISOString().split('T')[0]
      const isToday = date.toDateString() === today.toDateString()
      days.push({ 
        date: i, 
        isCurrentMonth: true,
        isToday,
        items: itemsByDate[dateKey] || [],
        isHighImpactWeek: isInHighImpactWeek(date)
      })
    }
    
    // Next month
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      const dateKey = date.toISOString().split('T')[0]
      days.push({ 
        date: i, 
        isCurrentMonth: false,
        isToday: false,
        items: itemsByDate[dateKey] || [],
        isHighImpactWeek: isInHighImpactWeek(date)
      })
    }
    
    return days
  }, [selectedDate, itemsByDate, highImpactWeeks])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-slate-600">{t('loadingCalendar')}</p>
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
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('academicCalendar')}</h1>
              <p className="text-slate-600">{t('viewAssignmentsExamsEvents')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prevMonth = new Date(selectedDate)
                  prevMonth.setMonth(prevMonth.getMonth() - 1)
                  setSelectedDate(prevMonth)
                }}
              >
                {locale === 'ar' ? '→ ' : '← '}{t('previous')}
              </Button>
              <div className="px-4 py-2 bg-white rounded-xl shadow-soft font-medium text-slate-900 flex items-center">
                {selectedDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric', calendar: 'gregory' })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextMonth = new Date(selectedDate)
                  nextMonth.setMonth(nextMonth.getMonth() + 1)
                  setSelectedDate(nextMonth)
                }}
              >
                {t('next')} {locale === 'ar' ? ' ←' : ' →'}
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-white rounded-xl p-1 shadow-soft w-fit">
              {(['month', 'week', 'agenda'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
                    ${viewMode === mode 
                      ? 'bg-brand-500 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Filter & Actions */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<HiFilter />}
                >
                  Filter
                </Button>
                {showFilters && (
                  <Card className="absolute right-0 top-full mt-2 z-50 min-w-[200px]">
                    <div className="p-2 space-y-1">
                      {['all', 'assignment', 'exam', 'holiday', 'school_event', 'meeting', 'deadline', 'reminder'].map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setEventFilter(type)
                            setShowFilters(false)
                          }}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                            ${eventFilter === type
                              ? 'bg-brand-500 text-white'
                              : 'hover:bg-slate-100 text-slate-700'
                            }
                          `}
                        >
                          {type === 'all' ? t('allEvents') : type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'month' && (
          <Card padding="lg" className="overflow-hidden">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-slate-700 py-3">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`
                    min-h-[120px] rounded-xl p-2 transition-all duration-200 relative
                    ${!day.isCurrentMonth 
                      ? 'bg-slate-50 text-slate-300' 
                      : day.isToday
                      ? 'bg-brand-50 border-2 border-brand-500'
                      : day.isHighImpactWeek && gradeConfig.features.showExamCountdown
                      ? 'bg-amber-50 border-2 border-amber-400'
                      : 'bg-white hover:bg-slate-50 border border-slate-200'
                    }
                    ${day.isCurrentMonth ? 'cursor-pointer hover:shadow-md' : ''}
                  `}
                  onClick={() => day.isCurrentMonth && setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day.date))}
                >
                  {/* High-impact week indicator */}
                  {day.isHighImpactWeek && gradeConfig.features.showExamCountdown && day.isCurrentMonth && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" title="High-impact week" />
                  )}
                  <div className={`
                    text-sm font-semibold mb-1
                    ${day.isToday ? 'text-brand-600' : day.isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}
                  `}>
                    {day.date}
                  </div>
                  <div className="space-y-1">
                    {day.items.slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.event) {
                            setSelectedEvent(item.event)
                          }
                        }}
                        className={`
                          text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-all relative
                          ${item.event ? 'hover:opacity-80' : ''}
                          ${item.prediction && item.prediction.riskLevel === 'critical' ? 'ring-2 ring-red-500' : ''}
                        `}
                        style={{ 
                          backgroundColor: item.color,
                          color: 'white'
                        }}
                        title={item.prediction ? `${item.title} - ${item.prediction.probability}% chance of on-time completion (${item.prediction.riskLevel} risk)` : item.title}
                      >
                        {getEventTypeIcon(item.type)} {item.title}
                        {item.prediction && item.prediction.riskLevel !== 'low' && (
                          <span className="ml-1 text-[10px]">
                            {item.prediction.riskLevel === 'critical' ? '🔴' :
                             item.prediction.riskLevel === 'high' ? '🟠' :
                             item.prediction.riskLevel === 'medium' ? '🟡' : ''}
                          </span>
                        )}
                      </div>
                    ))}
                    {day.items.length > 3 && (
                      <div className="text-xs text-slate-500 font-medium">
                        +{day.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-sm text-slate-600">{t('assignmentLowRisk')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
                <span className="text-sm text-slate-600">{t('assignmentMediumRisk')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
                <span className="text-sm text-slate-600">{t('assignmentHighRisk')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                <span className="text-sm text-slate-600">{t('assignmentCriticalRisk')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                <span className="text-sm text-slate-600">{t('assignmentNoPrediction')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-sm text-slate-600">{t('exam')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-sm text-slate-600">{t('holiday')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                <span className="text-sm text-slate-600">{t('schoolEvent')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
                <span className="text-sm text-slate-600">{t('meeting')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
                <span className="text-sm text-slate-600">{t('deadline')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6366f1' }}></div>
                <span className="text-sm text-slate-600">{t('reminder')}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Exam Countdown & Study Load - Only for middle/senior school */}
        {gradeConfig.features.showExamCountdown && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <ExamCountdown exams={exams} />
            <StudyLoadIndicator
              weekStart={currentWeekStart}
              assignments={weeklyStudyLoad.assignments}
              exams={weeklyStudyLoad.exams}
              averageHoursPerAssignment={weeklyStudyLoad.averageHoursPerAssignment}
              averageHoursPerExam={weeklyStudyLoad.averageHoursPerExam}
            />
          </div>
        )}

        {/* Upcoming Events Sidebar */}
        <div className="mt-6">
          <Card>
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t('upcomingEvents')}</h2>
            {monthItems.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No Upcoming Events"
                message={t('noUpcomingEventsMessage')}
                className="p-4"
              />
            ) : (
              <div className="space-y-3">
                {monthItems
                  .slice(0, 10)
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => item.event && setSelectedEvent(item.event)}
                      className={`
                        flex items-start gap-3 p-3 rounded-xl transition-colors
                        ${item.event ? 'cursor-pointer hover:bg-slate-50' : ''}
                      `}
                    >
                      <div 
                        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: item.color }}
                      >
                        {getEventTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1 truncate">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default" size="sm">
                            {item.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </Badge>
                          {item.prediction && (
                            <Badge 
                              variant={
                                item.prediction.riskLevel === 'critical' ? 'danger' :
                                item.prediction.riskLevel === 'high' ? 'warning' :
                                item.prediction.riskLevel === 'medium' ? 'warning' :
                                'success'
                              } 
                              size="sm"
                            >
                              {item.prediction.probability}% on-time
                            </Badge>
                          )}
                          {item.priority === 'high' && (
                            <Badge variant="error" size="sm">High Priority</Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {item.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: item.event?.allDay ? undefined : '2-digit',
                              minute: item.event?.allDay ? undefined : '2-digit'
                            })}
                          </span>
                        </div>
                        {item.prediction && item.prediction.riskLevel !== 'low' && (
                          <div className="mt-2 text-xs text-slate-600">
                            <span className="font-medium">
                              {item.prediction.riskLevel === 'critical' ? '🔴 Critical Risk' :
                               item.prediction.riskLevel === 'high' ? '🟠 High Risk' :
                               '🟡 Medium Risk'}
                            </span>
                            {' - '}
                            <span>{item.prediction.probability}% chance of on-time completion</span>
                          </div>
                        )}
                        {item.event?.reminders && item.event.reminders.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                            <span>🔔</span>
                            <span>{item.event.reminders.length} reminder{item.event.reminders.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          canEdit={user?.role === 'admin' || user?.role === 'teacher'}
        />
      )}
    </div>
  )
}
