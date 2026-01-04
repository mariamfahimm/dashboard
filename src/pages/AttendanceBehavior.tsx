// Attendance & Behavior Monitoring Page - Beautiful UI
import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/EmptyState'
import { ExportButton } from '../components/ui/ExportButton'
import { exportAttendanceToPDF, exportToExcel } from '../utils/exportUtils'
import { printPage } from '../utils/printUtils'
import { useStudents } from '../hooks/useStudents'
import { useBehaviorAnalysis } from '../hooks/useBehaviorAnalysis'
import { useAttendance } from '../hooks/useAttendance'
import { getStudentDisplayName } from '../utils/nameUtils'
import type { AttendanceRecord } from '../services/api/attendanceApi'

interface AttendanceBehaviorProps {
  selectedStudentId?: string | null
  t: (key: string) => string
  locale: string
}

interface BehaviorLog {
  date: string
  type: 'positive' | 'incident' | 'note'
  title: string
  description: string
  teacher: string
  severity?: 'low' | 'medium' | 'high'
}

export function AttendanceBehavior({ selectedStudentId, t, locale }: AttendanceBehaviorProps) {
  const { user } = useAuth()
  const { students } = useStudents(user?._id)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [behaviorData] = useState<BehaviorLog[]>([])
  
  // Get attendance data from API
  const startDate = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    return new Date(year, month, 1).toISOString().split('T')[0]
  }, [selectedMonth])

  const endDate = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, lastDay).toISOString().split('T')[0]
  }, [selectedMonth])

  const { records: attendanceData, stats: attendanceStats, loading: attendanceLoading, refresh: refreshAttendance } = useAttendance(
    selectedStudentId || undefined,
    { startDate, endDate }
  )
  
  // Get behavior pattern analysis
  const { analysis: behaviorAnalysis, loading: analysisLoading } = useBehaviorAnalysis(selectedStudentId || undefined)
  
  const selectedStudent = students?.find(s => s._id === selectedStudentId)
  const studentName = selectedStudent ? getStudentDisplayName(selectedStudent, locale) : t('student')

  const loading = attendanceLoading || analysisLoading

  // Format attendance stats from API or calculate from records
  const formattedStats = useMemo(() => {
    if (attendanceStats) {
      return {
        present: attendanceStats.present,
        absent: attendanceStats.absent,
        late: attendanceStats.late,
        excused: attendanceStats.excused,
        total: attendanceStats.total,
        rate: attendanceStats.attendanceRate
      }
    }

    // Fallback to calculating from records if stats not available
    if (attendanceData.length === 0) {
      return {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
        rate: 0
      }
    }
    
    const present = attendanceData.filter(a => a.status === 'present').length
    const absent = attendanceData.filter(a => a.status === 'absent').length
    const late = attendanceData.filter(a => a.status === 'late').length
    const excused = attendanceData.filter(a => a.status === 'excused').length
    const total = attendanceData.length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    
    return { present, absent, late, excused, total, rate }
  }, [attendanceStats, attendanceData])

  // Generate calendar days for selected month
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: Array<{ date: number; status?: AttendanceRecord['status']; isCurrentMonth: boolean }> = []
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i).getDate(), isCurrentMonth: false })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i)
      const dateStr = dayDate.toISOString().split('T')[0]
      
      // Find matching attendance record (compare by date string)
      const record = attendanceData.find(a => {
        const recordDate = new Date(a.date)
        return recordDate.toISOString().split('T')[0] === dateStr
      })
      
      days.push({ 
        date: i, 
        status: record?.status,
        isCurrentMonth: true 
      })
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: i, isCurrentMonth: false })
    }
    
    return days
  }, [selectedMonth, attendanceData])

  const getStatusColor = (status?: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'bg-emerald-500'
      case 'absent': return 'bg-rose-500'
      case 'late': return 'bg-amber-500'
      case 'excused': return 'bg-blue-500'
      default: return 'bg-slate-200'
    }
  }

  const getStatusLabel = (status?: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return t('present')
      case 'absent': return t('absent')
      case 'late': return t('late')
      case 'excused': return t('excused')
      default: return t('noData')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-slate-600">{t('loadingAttendanceData')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('attendanceBehavior')}</h1>
            <p className="text-slate-600">{t('trackAttendanceRecords')}</p>
          </div>
          <div className="no-print">
            <ExportButton
              onPrint={() => printPage()}
              onExportPDF={() => {
                const attendanceRecords = attendanceData.map(record => ({
                  date: new Date(record.date).toLocaleDateString(),
                  status: record.status,
                  time: record.time || '',
                  notes: record.notes || ''
                }))
                exportAttendanceToPDF(studentName, attendanceRecords)
              }}
              onExportExcel={() => {
                const excelData = attendanceData.map(record => ({
                  [t('date')]: new Date(record.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { calendar: 'gregory' }),
                  [t('status')]: record.status,
                  [t('time')]: record.time || t('na'),
                  [t('notes')]: record.notes || ''
                }))
                exportToExcel(excelData, t('attendance'), `${studentName}_${t('attendance')}_${Date.now()}.xlsx`)
              }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="text-sm opacity-90 mb-1">Present</div>
            <div className="text-3xl font-bold">{formattedStats.present}</div>
            <div className="text-xs opacity-75 mt-1">Days</div>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
            <div className="text-sm opacity-90 mb-1">Absent</div>
            <div className="text-3xl font-bold">{formattedStats.absent}</div>
            <div className="text-xs opacity-75 mt-1">Days</div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="text-sm opacity-90 mb-1">Late</div>
            <div className="text-3xl font-bold">{formattedStats.late}</div>
            <div className="text-xs opacity-75 mt-1">Days</div>
          </Card>
          <Card className="bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <div className="text-sm opacity-90 mb-1">Attendance Rate</div>
            <div className="text-3xl font-bold">{formattedStats.rate}%</div>
            <div className="text-xs opacity-75 mt-1">This Month</div>
          </Card>
        </div>

        {/* Behavior Pattern Analysis */}
        {behaviorAnalysis && (
          <Card className="mb-6 border-l-4" style={{
            borderLeftColor: behaviorAnalysis.riskLevel === 'critical' ? '#dc2626' :
                            behaviorAnalysis.riskLevel === 'high' ? '#f97316' :
                            behaviorAnalysis.riskLevel === 'medium' ? '#eab308' : '#10b981'
          }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🔍</span>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('behaviorPatternAnalysis')}</h2>
                    <p className="text-sm text-slate-600">{t('aiPoweredInsights')}</p>
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  behaviorAnalysis.riskLevel === 'critical' ? 'danger' :
                  behaviorAnalysis.riskLevel === 'high' ? 'warning' :
                  behaviorAnalysis.riskLevel === 'medium' ? 'warning' : 'success'
                }
                size="lg"
              >
                {behaviorAnalysis.riskLevel === 'critical' ? '🔴 Critical Risk' :
                 behaviorAnalysis.riskLevel === 'high' ? '🟠 High Risk' :
                 behaviorAnalysis.riskLevel === 'medium' ? '🟡 Medium Risk' : '🟢 Low Risk'}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Risk Score */}
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">Incident Risk Score</span>
                    <span className="text-lg font-bold text-slate-900">{behaviorAnalysis.incidentRisk}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${behaviorAnalysis.incidentRisk}%`,
                        backgroundColor: behaviorAnalysis.riskLevel === 'critical' ? '#dc2626' :
                                       behaviorAnalysis.riskLevel === 'high' ? '#f97316' :
                                       behaviorAnalysis.riskLevel === 'medium' ? '#eab308' : '#10b981'
                      }}
                    />
                  </div>
                </div>

                {/* Predictions */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Predictions</div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Next Week Incident Probability</div>
                    <div className="text-lg font-bold text-slate-900">
                      {Math.round(behaviorAnalysis.predictions.nextWeekIncidentProbability * 100)}%
                    </div>
                  </div>
                  {behaviorAnalysis.predictions.highRiskDays.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-600 mb-1">High Risk Days</div>
                      <div className="text-sm font-medium text-slate-900">
                        {behaviorAnalysis.predictions.highRiskDays.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Patterns & Triggers */}
              <div>
                {behaviorAnalysis.patterns.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-slate-700 mb-2">Detected Patterns</div>
                    <div className="space-y-2">
                      {behaviorAnalysis.patterns.map((pattern, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-blue-50 rounded-lg p-2">
                          <span className="text-blue-600 mt-0.5">📊</span>
                          <span className="text-sm text-slate-700">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {behaviorAnalysis.triggers.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2">Potential Triggers</div>
                    <div className="space-y-2">
                      {behaviorAnalysis.triggers.map((trigger, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-amber-50 rounded-lg p-2">
                          <span className="text-amber-600 mt-0.5">⚡</span>
                          <span className="text-sm text-slate-700">{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Actions */}
            {behaviorAnalysis.predictions.recommendedActions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="text-sm font-semibold text-slate-700 mb-3">Recommended Actions</div>
                <div className="grid md:grid-cols-2 gap-3">
                  {behaviorAnalysis.predictions.recommendedActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span className="text-sm text-slate-700">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>⏰</span>
                <span className="font-medium">{behaviorAnalysis.timeline}</span>
                <span className="ml-auto text-xs">Confidence: {Math.round(behaviorAnalysis.confidence * 100)}%</span>
              </div>
            </div>
          </Card>
        )}

        {analysisLoading && (
          <Card className="mb-6">
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-slate-600">Analyzing behavior patterns...</p>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Attendance Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{t('attendanceCalendar')}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prevMonth = new Date(selectedMonth)
                      prevMonth.setMonth(prevMonth.getMonth() - 1)
                      setSelectedMonth(prevMonth)
                    }}
                  >
                    ←
                  </Button>
                  <div className="px-4 py-2 bg-slate-50 rounded-lg font-medium text-slate-900">
                    {selectedMonth.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric', calendar: 'gregory' })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextMonth = new Date(selectedMonth)
                      nextMonth.setMonth(nextMonth.getMonth() + 1)
                      setSelectedMonth(nextMonth)
                    }}
                  >
                    →
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map((day, idx) => (
                  <div key={idx} className="text-center text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium
                      transition-all duration-200
                      ${!day.isCurrentMonth ? 'text-slate-300' : 'text-slate-900'}
                      ${day.status ? `${getStatusColor(day.status)} text-white shadow-md` : 'bg-slate-50 hover:bg-slate-100'}
                      ${day.isCurrentMonth && !day.status ? 'hover:scale-105 cursor-pointer' : ''}
                    `}
                    title={day.status ? getStatusLabel(day.status) : t('noData')}
                  >
                    {day.date}
                    {day.status && (
                      <div className="text-xs mt-0.5 opacity-75">
                        {day.status === 'present' ? '✓' : 
                         day.status === 'absent' ? '✗' :
                         day.status === 'late' ? '⏰' : '○'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500"></div>
                  <span className="text-sm text-slate-600">{t('present')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-rose-500"></div>
                  <span className="text-sm text-slate-600">{t('absent')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500"></div>
                  <span className="text-sm text-slate-600">{t('late')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-sm text-slate-600">{t('excused')}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Behavior Log */}
          <div>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{t('behaviorLog')}</h2>
                <Badge variant="info" size="sm">
                  {behaviorData.length} {t('entries')}
                </Badge>
              </div>

              {behaviorData.length === 0 ? (
                <EmptyState
                  icon="📝"
                  title={t('noBehaviorRecords')}
                  message={t('noBehaviorRecordsMessage') || 'No behavioral incidents or notes have been recorded yet.'}
                  className="p-4"
                />
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {behaviorData.map((log, idx) => (
                    <div
                      key={idx}
                      className={`
                        p-4 rounded-xl border-l-4 transition-all
                        ${log.type === 'positive' 
                          ? 'bg-emerald-50 border-emerald-500' 
                          : log.type === 'incident'
                          ? 'bg-rose-50 border-rose-500'
                          : 'bg-blue-50 border-blue-500'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {log.type === 'positive' ? '✅' : log.type === 'incident' ? '⚠️' : '📝'}
                          </span>
                          <h3 className="font-semibold text-slate-900">{log.title}</h3>
                        </div>
                        {log.severity && (
                          <Badge 
                            variant={log.severity === 'high' ? 'error' : log.severity === 'medium' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {log.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{log.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{log.teacher}</span>
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Alerts Section */}
        {formattedStats.absent > 0 && (
          <Card className="mt-6 border-l-4 border-l-amber-500 bg-amber-50">
            <div className="flex items-start gap-4">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Unexcused Absences Alert</h3>
                <p className="text-sm text-slate-600">
                  Your child has {formattedStats.absent} unexcused absence{formattedStats.absent !== 1 ? 's' : ''} this month. 
                  Please contact the school to resolve this.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Contact School
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

