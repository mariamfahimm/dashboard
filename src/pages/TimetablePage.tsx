// Timetable Page - Weekly class schedule
import React, { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudents } from '../hooks/useStudents'
import { useWeeklySchedule } from '../hooks/useSchedule'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/EmptyState'
import { ExportButton } from '../components/ui/ExportButton'
import { printPage } from '../utils/printUtils'
import { exportTimetableToPDF, exportTimetableToExcel } from '../utils/exportUtils'

interface TimetablePageProps {
  selectedStudentId?: string | null
  t: (key: string) => string
  locale: string
}

const getDays = (t: (key: string) => string) => [
  { key: 1, label: t('monday'), short: t('mon') },
  { key: 2, label: t('tuesday'), short: t('tue') },
  { key: 3, label: t('wednesday'), short: t('wed') },
  { key: 4, label: t('thursday'), short: t('thu') },
  { key: 5, label: t('friday'), short: t('fri') },
  { key: 6, label: t('saturday'), short: t('sat') },
  { key: 0, label: t('sunday'), short: t('sun') }
]

export function TimetablePage({ selectedStudentId, t, locale }: TimetablePageProps) {
  const { user } = useAuth()
  const { students } = useStudents(user?._id)
  const { weeklySchedule, loading, error, refresh } = useWeeklySchedule(selectedStudentId || undefined)

  const selectedStudent = students?.find(s => s._id === selectedStudentId)
  const studentName = selectedStudent?.name || t('student')
  const DAYS = getDays(t)

  // Get current day (1 = Monday, 6 = Saturday, 0 = Sunday)
  const currentDay = useMemo(() => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1 // Convert to Monday=1, Sunday=6
  }, [])

  // Get all unique periods across all days
  const allPeriods = useMemo(() => {
    if (!weeklySchedule) return []
    
    const periods = new Set<number>()
    Object.values(weeklySchedule).forEach(dayEntries => {
      dayEntries.forEach(entry => {
        periods.add(entry.period)
      })
    })
    return Array.from(periods).sort((a, b) => a - b)
  }, [weeklySchedule])

  // Get all unique time slots
  const timeSlots = useMemo(() => {
    if (!weeklySchedule) return []
    
    const slots = new Set<string>()
    Object.values(weeklySchedule).forEach(dayEntries => {
      dayEntries.forEach(entry => {
        slots.add(`${entry.startTime}-${entry.endTime}`)
      })
    })
    return Array.from(slots).sort()
  }, [weeklySchedule])

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Get entry for a specific day and period
  const getEntry = (dayOfWeek: number, period: number) => {
    if (!weeklySchedule) return null
    const dayEntries = weeklySchedule[dayOfWeek as keyof typeof weeklySchedule] || []
    return dayEntries.find(e => e.period === period) || null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-slate-600">{t('loadingTimetable')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('errorLoadingTimetable')}</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={refresh}>Try Again</Button>
          </div>
        </Card>
      </div>
    )
  }

  const hasSchedule = weeklySchedule && Object.values(weeklySchedule).some(day => day.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('weeklyTimetable')}</h1>
            <p className="text-slate-600">{t('viewClassScheduleWeek')?.replace('{studentName}', studentName) || `View ${studentName}'s class schedule for the week`}</p>
          </div>
          <div className="no-print">
            <ExportButton
              onPrint={printPage}
              onExportPDF={() => {
                if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
                  alert('No timetable data to export')
                  return
                }
                exportTimetableToPDF(studentName, weeklySchedule)
              }}
              onExportExcel={() => {
                if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
                  alert('No timetable data to export')
                  return
                }
                exportTimetableToExcel(studentName, weeklySchedule)
              }}
            />
          </div>
        </div>

        {!hasSchedule ? (
          <Card>
            <EmptyState
              icon="📅"
              title="No Timetable Available"
              message={t('noTimetableMessage')}
              className="p-8"
            />
          </Card>
        ) : (
          <Card padding="lg" className="overflow-x-auto">
            {/* Timetable Grid */}
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      {t('time')}
                    </th>
                    {DAYS.filter(day => day.key >= 1 && day.key <= 5).map(day => (
                      <th
                        key={day.key}
                        className={`
                          p-3 text-center text-sm font-semibold text-slate-700 border-b border-slate-200
                          ${currentDay === day.key ? 'bg-brand-50' : ''}
                        `}
                      >
                        <div>{day.label}</div>
                        {currentDay === day.key && (
                          <Badge variant="info" size="sm" className="mt-1">Today</Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPeriods.map(period => {
                    // Get time slot for this period (use first entry found)
                    let timeSlot = ''
                    for (const day of DAYS.filter(d => d.key >= 1 && d.key <= 5)) {
                      const entry = getEntry(day.key, period)
                      if (entry) {
                        timeSlot = `${entry.startTime}-${entry.endTime}`
                        break
                      }
                    }

                    const [startTime, endTime] = timeSlot ? timeSlot.split('-') : ['', '']

                    return (
                      <tr key={period} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-sm font-medium text-slate-600 align-top">
                          <div className="whitespace-nowrap">
                            {startTime && endTime ? (
                              <>
                                <div>{formatTime(startTime)}</div>
                                <div className="text-xs text-slate-400">- {formatTime(endTime)}</div>
                                <div className="text-xs text-slate-400 mt-1">{t('period')} {period}</div>
                              </>
                            ) : (
                              <div className="text-slate-400">{t('period')} {period}</div>
                            )}
                          </div>
                        </td>
                        {DAYS.filter(day => day.key >= 1 && day.key <= 5).map(day => {
                          const entry = getEntry(day.key, period)
                          const isToday = currentDay === day.key

                          return (
                            <td
                              key={day.key}
                              className={`
                                p-3 align-top min-w-[180px]
                                ${isToday ? 'bg-brand-50/50' : ''}
                              `}
                            >
                              {entry ? (
                                <div
                                  className={`
                                    p-3 rounded-xl border-l-4 transition-all
                                    ${isToday 
                                      ? 'bg-white border-brand-500 shadow-md' 
                                      : 'bg-slate-50 border-slate-300 hover:shadow-sm'
                                    }
                                  `}
                                >
                                  <div className="font-semibold text-slate-900 mb-1">
                                    {entry.course?.subject || entry.course?.title || t('subject')}
                                  </div>
                                  {entry.course?.title && entry.course.title !== entry.course.subject && (
                                    <div className="text-xs text-slate-600 mb-2">
                                      {entry.course.title}
                                    </div>
                                  )}
                                  {entry.teacherName && (
                                    <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                                      <span>👤</span>
                                      <span>{entry.teacherName}</span>
                                    </div>
                                  )}
                                  {entry.room && (
                                    <div className="text-xs text-slate-600 flex items-center gap-1">
                                      <span>🏫</span>
                                      <span>{entry.room}</span>
                                    </div>
                                  )}
                                  {entry.startTime && entry.endTime && (
                                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                                      {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-slate-400 text-sm py-4">
                                  —
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-brand-50 border-l-4 border-brand-500"></div>
                <span className="text-slate-600">Today's classes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-50 border-l-4 border-slate-300"></div>
                <span className="text-slate-600">Regular classes</span>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Schedule Summary */}
        {hasSchedule && weeklySchedule && weeklySchedule[currentDay as keyof typeof weeklySchedule]?.length > 0 && (
          <Card className="mt-6 border-l-4 border-l-brand-500 bg-brand-50/30">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Today's Schedule</h2>
            <div className="grid gap-3">
              {weeklySchedule[currentDay as keyof typeof weeklySchedule]
                .sort((a, b) => a.period - b.period)
                .map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-brand-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">
                        {entry.period}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {entry.course?.subject || entry.course?.title || t('subject')}
                        </div>
                        <div className="text-sm text-slate-600">
                          {entry.startTime && entry.endTime && (
                            <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
                          )}
                          {entry.room && (
                            <span className="ml-2">• {entry.room}</span>
                          )}
                          {entry.teacherName && (
                            <span className="ml-2">• {entry.teacherName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {new Date().getHours() >= parseInt(entry.startTime?.split(':')[0] || '0') && 
                     new Date().getHours() < parseInt(entry.endTime?.split(':')[0] || '23') && (
                      <Badge variant="success" size="sm">Now</Badge>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

